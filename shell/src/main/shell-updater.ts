import { app, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'

/**
 * Shell updater — layer L3 of the three-layer hot-update design.
 * Uses electron-updater against the GitHub Releases feed configured in
 * electron-builder.yml (publish provider github). Only active when packaged;
 * dev mode skips. Rollback = reinstall the previous installer.
 */
export class ShellUpdater {
  private ready = false

  async check(): Promise<string> {
    if (!app.isPackaged) return 'dev 模式：壳更新检查仅在打包后生效'

    if (!this.ready) {
      autoUpdater.autoDownload = true
      autoUpdater.on('update-downloaded', async () => {
        const { response } = await dialog.showMessageBox({
          type: 'info',
          title: 'DSH Harbor',
          message: '壳的新版本已下载，是否立即安装？',
          buttons: ['立即安装', '稍后'],
          defaultId: 0,
        })
        if (response === 0) autoUpdater.quitAndInstall()
      })
      this.ready = true
    }

    try {
      const result = await autoUpdater.checkForUpdates()
      if (!result) return '已是最新版本'
      return `发现新版本 ${result.updateInfo.version}，下载中…`
    } catch (err) {
      return `检查失败：${err instanceof Error ? err.message : String(err)}`
    }
  }
}
