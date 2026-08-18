import { Notification, app, dialog, ipcMain, shell } from 'electron'
import type { BrowserWindow } from 'electron'
import { HarborConfig, loadConfig } from './config'
import { ProcessSteward } from './process-steward'
import { createTray } from './tray'
import { checkCoreVersion } from './version-gate'
import { createWindow, loadErrorPage, markQuitting } from './window'
import { CoreUpdater } from './core-updater'
import { ShellUpdater } from './shell-updater'
import { registerToggleHotkey, unregisterHotkeys } from './hotkey'
import { applyAutostart, isAutostartEnabled } from './autostart'
import { startBridge, applyWindowAction } from './bridge'
import { ensureDesktopBridgePatch } from './patch-manager'
import { DEFAULTS, IPC, SHELL_VERSION } from '../shared/constants'

const config: HarborConfig = loadConfig()
let win: BrowserWindow | null = null
let steward: ProcessSteward | null = null
let coreUpdater: CoreUpdater | null = null
const shellUpdater = new ShellUpdater()

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  main()
}

function notify(title: string, body: string): void {
  new Notification({ title, body }).show()
}

function toggleWindow(): void {
  if (!win) return
  if (win.isVisible() && !win.isMinimized()) {
    win.hide()
  } else {
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  }
}

function main(): void {
  ipcMain.handle(IPC.getShellVersion, () => SHELL_VERSION)
  ipcMain.handle(IPC.ping, () => 'pong')
  ipcMain.handle(IPC.getCoreVersion, () => steward?.getCoreVersion() ?? null)
  ipcMain.handle(IPC.toggleAutostart, () => {
    applyAutostart(config, !config.autostart)
    return config.autostart
  })
  ipcMain.handle(IPC.openConfigDir, () => shell.openPath(app.getPath('userData')))
  ipcMain.handle(IPC.checkCoreUpdate, async () => {
    if (!coreUpdater) return '核心更新器未就绪'
    coreUpdater.check()
    return '正在查询 npm registry…'
  })

  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    win = createWindow(config)
    const bridgePort = config.bridgePort ?? DEFAULTS.bridgePort
    const shellDir = app.getAppPath()

    // V2: desktop-bridge — generate the cordis patch and inject the bridge port
    // + shell dir into the core process so DSH plugins can call the desktop.
    const patchPath = ensureDesktopBridgePatch(shellDir, app.getPath('userData'))
    steward = new ProcessSteward({
      port: config.port,
      host: config.host,
      bridgePort,
      shellDir,
      patchPath,
    })
    coreUpdater = new CoreUpdater(() => steward?.getCoreVersion() ?? null)

    const bridge = startBridge(bridgePort, {
      getStatus: () => ({
        shellVersion: SHELL_VERSION,
        coreVersion: steward?.getCoreVersion() ?? null,
        coreUrl: steward?.getUrl() ?? null,
        coreStatus: steward?.getStatus() ?? 'stopped',
        windowVisible: win?.isVisible() ?? false,
      }),
      controlWindow: (action) => applyWindowAction(win, action),
    })

    // Boot-time autostart applied once (user can toggle from the tray).
    if (config.autostart && !isAutostartEnabled()) {
      applyAutostart(config, true)
    }

    createTray({
      showWindow: () => {
        win?.show()
        win?.focus()
      },
      restartCore: () => {
        steward?.stop()
        setTimeout(() => steward?.start(), 300)
      },
      checkCoreUpdate: () => coreUpdater?.check(),
      toggleAutostart: () => {
        applyAutostart(config, !config.autostart)
        notify('DSH Harbor', config.autostart ? '已开启开机自启' : '已关闭开机自启')
      },
      checkShellUpdate: async () => {
        const msg = await shellUpdater.check()
        notify('DSH Harbor', msg)
      },
      openConfigDir: () => shell.openPath(app.getPath('userData')),
      quit: () => app.quit(),
      coreStatus: () => steward?.getStatus() ?? 'stopped',
      isAutostart: () => isAutostartEnabled(),
    })

    registerToggleHotkey(toggleWindow)

    steward.on('ready', (url) => {
      console.log('[harbor] core ready at', url)
      win?.loadURL(url).catch((err) => console.error('[harbor] loadURL failed', err))
    })

    steward.on('exited', (info) => {
      console.warn(`[harbor] core exited (code ${info.code}), restart #${info.attempts}`)
      notify('DSH Harbor', `核心进程退出，正在自动重启（第 ${info.attempts} 次）`)
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

    coreUpdater.on('check-result', (current, latest, available) => {
      if (!available) {
        notify('DSH Harbor', `核心已是最新版本：${current ?? '未知'}`)
        return
      }
      dialog
        .showMessageBox({
          type: 'info',
          title: 'DSH Harbor',
          message: `核心更新可用：${current ?? '未知'} → ${latest}`,
          detail: '更新将安装到 shell 本地依赖并自动重启核心。',
          buttons: ['立即更新', '取消'],
          defaultId: 0,
        })
        .then(async ({ response }) => {
          if (response !== 0 || !latest) return
          const ok = await coreUpdater?.apply(latest)
          if (ok) {
            notify('DSH Harbor', `核心已更新到 ${latest}，正在重启…`)
            steward?.stop()
            setTimeout(() => steward?.start(), 500)
          }
        })
        .catch(() => undefined)
    })
    coreUpdater.on('error', (message) => dialog.showErrorBox('DSH Harbor', `核心更新失败：${message}`))

    app.on('before-quit', () => {
      bridge.close()
    })

    steward.start()
  })

  app.on('before-quit', () => {
    markQuitting()
    unregisterHotkeys()
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
