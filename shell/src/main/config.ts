import { app } from 'electron'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { DEFAULTS } from '../shared/constants'

export interface HarborConfig {
  port: number
  host: string
  closeToTray: boolean
  autostart: boolean
  updateFeedUrl?: string
  windowBounds?: { x?: number; y?: number; width: number; height: number }
  lastCoreVersion?: string
}

const configPath = (): string => path.join(app.getPath('userData'), 'config.json')

export function loadConfig(): HarborConfig {
  const fallback: HarborConfig = {
    port: DEFAULTS.port,
    host: DEFAULTS.host,
    closeToTray: DEFAULTS.closeToTray,
    autostart: DEFAULTS.autostart,
  }
  try {
    const raw = fs.readFileSync(configPath(), 'utf8')
    return { ...fallback, ...(JSON.parse(raw) as Partial<HarborConfig>) }
  } catch {
    return fallback
  }
}

export function saveConfig(config: HarborConfig): void {
  try {
    fs.mkdirSync(path.dirname(configPath()), { recursive: true })
    fs.writeFileSync(configPath(), JSON.stringify(config, null, 2), 'utf8')
  } catch (err) {
    console.error('[harbor] failed to save config', err)
  }
}
