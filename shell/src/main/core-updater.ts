import { execFile } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { app } from 'electron'
import { CORE_PACKAGE } from '../shared/constants'

interface CoreUpdaterEvents {
  'check-result': [current: string | null, latest: string | null, updateAvailable: boolean]
  applied: [version: string]
  error: [message: string]
}

/**
 * Core (dsh) updater — layer L2 of the three-layer hot-update design.
 * Queries the npm registry, then updates the shell's own local dependency
 * (resolution order of the steward prefers the shell node_modules), so the
 * new core takes effect after a steward restart. Never touches the shell.
 */
export class CoreUpdater extends EventEmitter<CoreUpdaterEvents> {
  constructor(private readonly currentVersion: () => string | null) {
    super()
  }

  /** Query the npm registry for the latest published version of the core. */
  checkLatest(): Promise<string | null> {
    return new Promise((resolve) => {
      execFile('npm', ['view', CORE_PACKAGE, 'version'], { timeout: 30_000 }, (err, stdout) => {
        if (err || !stdout?.trim()) {
          resolve(null)
          return
        }
        resolve(stdout.trim().split(/\s+/)[0])
      })
    })
  }

  async check(): Promise<void> {
    const current = this.currentVersion()
    const latest = await this.checkLatest()
    const available = latest !== null && current !== null && latest !== current
    this.emit('check-result', current, latest, available)
  }

  /** Update the shell's local core dependency. Returns success. */
  apply(latest: string): Promise<boolean> {
    return new Promise((resolve) => {
      execFile(
        'npm',
        ['install', `${CORE_PACKAGE}@${latest}`, '--no-audit', '--no-fund'],
        { cwd: app.getAppPath(), timeout: 180_000 },
        (err, _stdout, stderr) => {
          if (err) {
            this.emit('error', stderr?.slice(0, 500) ?? err.message)
            resolve(false)
            return
          }
          this.emit('applied', latest)
          resolve(true)
        },
      )
    })
  }
}
