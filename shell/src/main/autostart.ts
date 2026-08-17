import { app } from 'electron'
import { HarborConfig, saveConfig } from './config'

/** Apply + persist the "start with Windows" setting. */
export function applyAutostart(config: HarborConfig, enabled: boolean): void {
  config.autostart = enabled
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: true,
    path: process.execPath,
  })
  saveConfig(config)
}

export function isAutostartEnabled(): boolean {
  return app.getLoginItemSettings().openAtLogin
}
