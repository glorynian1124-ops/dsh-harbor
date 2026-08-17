import { Notification, app, dialog, ipcMain } from 'electron'
import type { BrowserWindow } from 'electron'
import { HarborConfig, loadConfig } from './config'
import { ProcessSteward } from './process-steward'
import { createTray } from './tray'
import { checkCoreVersion } from './version-gate'
import { createWindow, loadErrorPage, markQuitting } from './window'
import { DEFAULTS, IPC, SHELL_VERSION } from '../shared/constants'

const config: HarborConfig = loadConfig()
let win: BrowserWindow | null = null
let steward: ProcessSteward | null = null

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  main()
}

function main(): void {
  ipcMain.handle(IPC.getShellVersion, () => SHELL_VERSION)
  ipcMain.handle(IPC.ping, () => 'pong')

  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    win = createWindow(config)
    steward = new ProcessSteward({ port: config.port, host: config.host })

    createTray({
      showWindow: () => {
        win?.show()
        win?.focus()
      },
      restartCore: () => {
        steward?.stop()
        setTimeout(() => steward?.start(), 300)
      },
      quit: () => app.quit(),
      coreStatus: () => steward?.getStatus() ?? 'stopped',
    })

    steward.on('ready', (url) => {
      console.log('[harbor] core ready at', url)
      win?.loadURL(url).catch((err) => console.error('[harbor] loadURL failed', err))
    })

    steward.on('exited', (info) => {
      console.warn(`[harbor] core exited (code ${info.code}), restart #${info.attempts}`)
      new Notification({
        title: 'DSH Harbor',
        body: `核心进程退出，正在自动重启（第 ${info.attempts} 次）`,
      }).show()
    })

    steward.on('gave-up', () => {
      const msg = `DSH 核心连续崩溃超过 ${DEFAULTS.maxConsecutiveCrashes} 次，已停止自动重启。可点托盘「重启核心」重试。`
      if (win) loadErrorPage(win, msg)
      dialog.showErrorBox('DSH Harbor', msg)
    })

    steward.on('core-version', (version) => {
      const gate = checkCoreVersion(version)
      console.log('[harbor]', gate.message)
      if (!gate.ok) {
        dialog
          .showMessageBox({ type: 'warning', title: 'DSH Harbor', message: gate.message })
          .catch(() => undefined)
      }
    })

    steward.start()
  })

  app.on('before-quit', () => {
    markQuitting()
    steward?.stop()
  })

  // Stay resident in the tray: closing every window must not quit.
  app.on('window-all-closed', () => {
    /* keep alive */
  })

  app.on('activate', () => {
    if (win) {
      win.show()
      win.focus()
    }
  })
}
