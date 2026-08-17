import { Menu, Tray, nativeImage } from 'electron'
import * as path from 'node:path'

export interface TrayActions {
  showWindow: () => void
  restartCore: () => void
  checkCoreUpdate: () => void
  toggleAutostart: () => void
  checkShellUpdate: () => void
  openConfigDir: () => void
  quit: () => void
  coreStatus: () => string
  isAutostart: () => boolean
}

export function createTray(actions: TrayActions): Tray {
  let icon = nativeImage.createFromPath(path.join(__dirname, '..', '..', 'build', 'icon.png'))
  if (icon.isEmpty()) icon = nativeImage.createEmpty()

  const tray = new Tray(icon)
  tray.setToolTip('DSH Harbor')

  const rebuildMenu = (): void => {
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: '显示 DSH Harbor', click: actions.showWindow },
        { label: `核心状态：${actions.coreStatus()}`, enabled: false },
        { type: 'separator' },
        { label: '重启核心', click: actions.restartCore },
        { label: '检查核心更新（npm）', click: actions.checkCoreUpdate },
        { type: 'separator' },
        { label: '开机自启', type: 'checkbox', checked: actions.isAutostart(), click: actions.toggleAutostart },
        { type: 'separator' },
        { label: '检查壳更新', click: actions.checkShellUpdate },
        { label: '打开配置目录', click: actions.openConfigDir },
        { type: 'separator' },
        { label: '退出', click: actions.quit },
      ]),
    )
  }
  rebuildMenu()
  tray.on('click', actions.showWindow)
  // refresh the status line periodically
  setInterval(rebuildMenu, 5000)

  return tray
}
