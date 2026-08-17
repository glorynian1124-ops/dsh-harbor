// Dev hot-reload for the shell itself: rebuild (tsc) + relaunch on src change.
// Run from the shell folder: node scripts/dev-watch.mjs
import { spawn, spawnSync } from 'node:child_process'
import { watch } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
let child = null
let restartTimer = null

function start() {
  const build = spawnSync('npx', ['tsc', '-p', '.'], { cwd: root, stdio: 'inherit', shell: true })
  if (build.status !== 0) {
    console.error('[dev-watch] tsc failed, waiting for next change')
    return
  }
  child = spawn('npx', ['electron', '.'], { cwd: root, stdio: 'inherit', shell: true })
  child.on('exit', () => {
    if (!restartTimer) child = null
  })
}

function restart() {
  if (restartTimer) return
  restartTimer = setTimeout(() => {
    restartTimer = null
    if (child) child.kill()
    setTimeout(start, 500)
  }, 300)
}

start()
watch(path.join(root, 'src'), { recursive: true }, (_event, filename) => {
  if (filename && /\.(ts|js)$/.test(filename)) {
    console.log('[dev-watch] change:', filename)
    restart()
  }
})
