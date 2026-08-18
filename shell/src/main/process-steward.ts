import { ChildProcess, execFile, spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import * as fs from 'node:fs'
import * as http from 'node:http'
import * as path from 'node:path'
import { BRIDGE_PORT_ENV, DEFAULTS, SHELL_DIR_ENV } from '../shared/constants'

export interface StewardOptions {
  port: number
  host: string
  bridgePort: number
  /** absolute path of the shell directory, injected into the core via env */
  shellDir: string
  patchPath?: string | null
}

interface StewardEvents {
  ready: [url: string]
  exited: [info: { code: number | null; willRestart: boolean; attempts: number }]
  'gave-up': []
  'core-version': [version: string]
}

/**
 * Process steward: owns the official dsh core process.
 * spawn → parse URL from stdout → HTTP probe → crash auto-restart with
 * exponential backoff → tree-kill on quit. The shell never vendors the core.
 */
export class ProcessSteward extends EventEmitter<StewardEvents> {
  private child: ChildProcess | null = null
  private stopping = false
  private attempts = 0
  private startedAt = 0
  private backoffTimer: NodeJS.Timeout | null = null
  private bootTimer: NodeJS.Timeout | null = null
  private url: string | null = null
  private spawnAttempt = 0
  private lastCoreVersion: string | null = null

  constructor(private readonly options: StewardOptions) {
    super()
  }

  /** Resolve the official dsh bin.js: shell node_modules first, then global npm. */
  resolveDshBin(): string {
    const local = path.join(__dirname, '..', '..', 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
    if (fs.existsSync(local)) return local
    try {
      const { execSync } = require('node:child_process') as typeof import('node:child_process')
      const root = execSync('npm root -g', { encoding: 'utf8' }).trim()
      const globalBin = path.join(root, '@deepseek-ai', 'dsh', 'lib', 'bin.js')
      if (fs.existsSync(globalBin)) return globalBin
    } catch {
      /* ignore */
    }
    throw new Error(
      'DSH core not found. Run `npm install` inside the shell folder, or `npm install -g @deepseek-ai/dsh`.',
    )
  }

  start(): void {
    if (this.child || this.stopping) return
    this.stopping = false
    this.launch()
  }

  stop(): void {
    this.stopping = true
    if (this.backoffTimer) {
      clearTimeout(this.backoffTimer)
      this.backoffTimer = null
    }
    if (this.bootTimer) {
      clearTimeout(this.bootTimer)
      this.bootTimer = null
    }
    if (this.child?.pid) {
      try {
        this.child.kill('SIGTERM')
      } catch {
        /* ignore */
      }
      execFile('taskkill', ['/pid', String(this.child.pid), '/T', '/F'], () => undefined)
    }
    this.child = null
    this.url = null
  }

  getUrl(): string | null {
    return this.url
  }

  getCoreVersion(): string | null {
    return this.lastCoreVersion
  }

  getStatus(): string {
    if (this.url && this.child?.pid) return `running :${new URL(this.url).port} (pid ${this.child.pid})`
    if (this.child?.pid) return `starting (pid ${this.child.pid})`
    return 'stopped'
  }

  private launch(): void {
    let bin: string
    try {
      bin = this.resolveDshBin()
    } catch (err) {
      this.emit('gave-up')
      console.error('[harbor]', err instanceof Error ? err.message : err)
      return
    }

    this.reportCoreVersion(bin)

    // IMPORTANT: launcher-level flags (--profile, --patch) must all precede the
    // first token the launcher does not know (--host). Otherwise the launcher
    // stops parsing there and passes --patch to the web app, which rejects it
    // with "unknown option '--patch'" → instant core exit → restart loop.
    const args = ['--profile', 'web']
    if (this.options.patchPath) {
      args.push('--patch', this.options.patchPath)
      console.log('[harbor] core boot patch:', this.options.patchPath)
    }
    args.push('--host', this.options.host, '--port', String(this.options.port))

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      [BRIDGE_PORT_ENV]: String(this.options.bridgePort),
      [SHELL_DIR_ENV]: this.options.shellDir,
    }

    this.spawnAttempt = 0
    this.child = this.spawnDsh(bin, args, env)
    this.startedAt = Date.now()

    let buffer = ''
    const onData = (chunk: Buffer): void => {
      buffer += chunk.toString('utf8')
      const m = buffer.match(/https?:\/\/127\.0\.0\.1:(\d+)/)
      if (m && !this.url) {
        this.url = `http://127.0.0.1:${m[1]}`
        this.waitUntilUp(this.url)
      }
    }
    this.child.stdout?.on('data', onData)
    this.child.stderr?.on('data', onData)

    this.child.on('exit', (code) => this.onExit(code))
    this.child.on('error', (err) => this.onSpawnError(err))

    this.bootTimer = setTimeout(() => {
      if (!this.url) console.warn('[harbor] no URL printed by dsh within boot timeout')
    }, DEFAULTS.bootTimeoutMs)
  }

  /** Prefer system Node; fall back to Electron-as-Node when `node` is missing. */
  private spawnDsh(bin: string, args: string[], env: NodeJS.ProcessEnv): ChildProcess {
    if (this.spawnAttempt === 0) {
      return spawn('node', [bin, ...args], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, env })
    }
    return spawn(process.execPath, [bin, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      env: { ...env, ELECTRON_RUN_AS_NODE: '1' },
    })
  }

  private onSpawnError(err: Error): void {
    console.error('[harbor] spawn error', err)
    if (this.spawnAttempt === 0 && !this.stopping && !this.url) {
      this.spawnAttempt += 1
      console.warn('[harbor] system `node` unavailable, falling back to Electron-as-Node')
    }
  }

  private reportCoreVersion(bin: string): void {
    const run = this.spawnAttempt === 0 ? 'node' : process.execPath
    const env = this.spawnAttempt === 0 ? process.env : { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
    execFile(run, [bin, '--version'], { env }, (_err, stdout) => {
      if (stdout?.trim()) {
        this.lastCoreVersion = stdout.trim()
        this.emit('core-version', this.lastCoreVersion)
      }
    })
  }

  private waitUntilUp(url: string): void {
    const deadline = Date.now() + DEFAULTS.bootTimeoutMs
    const tryOnce = (): void => {
      const req = http.get(url, (res) => {
        res.resume()
        if (res.statusCode && res.statusCode < 500) {
          this.attempts = 0
          this.emit('ready', url)
        } else if (Date.now() < deadline) {
          setTimeout(tryOnce, 500)
        }
      })
      req.on('error', () => {
        if (Date.now() < deadline) setTimeout(tryOnce, 500)
      })
      req.setTimeout(3000, () => req.destroy())
    }
    tryOnce()
  }

  private onExit(code: number | null): void {
    if (this.bootTimer) {
      clearTimeout(this.bootTimer)
      this.bootTimer = null
    }
    this.url = null
    this.child = null
    if (this.stopping) return

    const stable = Date.now() - this.startedAt >= DEFAULTS.stableUptimeMs
    if (stable) this.attempts = 0
    this.attempts += 1
    if (this.attempts > DEFAULTS.maxConsecutiveCrashes) {
      this.attempts = 0
      this.emit('gave-up')
      return
    }
    const idx = Math.min(this.attempts - 1, DEFAULTS.restartBackoffMs.length - 1)
    const delay = DEFAULTS.restartBackoffMs[idx]
    this.emit('exited', { code, willRestart: true, attempts: this.attempts })
    this.backoffTimer = setTimeout(() => {
      this.backoffTimer = null
      this.launch()
    }, delay)
  }
}
