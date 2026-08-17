import { Menu, Tray, nativeImage } from 'electron'
import * as path from 'node:path'

export interface TrayActions {
  showWindow: () => void
  restartCore: () => void
  quit: () => void
  coreStatus: () => string
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
        { label: '重启核心', click: actions.restartCore },
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
