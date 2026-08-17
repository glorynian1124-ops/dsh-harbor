import { BrowserWindow, shell } from 'electron'
import * as path from 'node:path'
import { HarborConfig, saveConfig } from './config'

let quitting = false

export function markQuitting(): void {
  quitting = true
}

function persistBounds(win: BrowserWindow, config: HarborConfig): void {
  const b = win.getNormalBounds()
  config.windowBounds = { x: b.x, y: b.y, width: b.width, height: b.height }
  saveConfig(config)
}

export function createWindow(config: HarborConfig): BrowserWindow {
  const bounds = config.windowBounds
  const win = new BrowserWindow({
    width: bounds?.width ?? 1280,
    height: bounds?.height ?? 820,
    x: bounds?.x,
    y: bounds?.y,
    minWidth: 940,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'bridge.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  })

  win.once('ready-to-show', () => win.show())

  // Open external links in the system browser; keep the official UI inside.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Close hides to tray (configurable); real quit goes through tray/app menu.
  win.on('close', (event) => {
    if (config.closeToTray && !quitting) {
      event.preventDefault()
      win.hide()
    }
  })

  win.on('resize', () => persistBounds(win, config))
  win.on('move', () => persistBounds(win, config))

  return win
}

/** Minimal in-app error page; never touches the official UI DOM. */
export function loadErrorPage(win: BrowserWindow, message: string): void {
  const safe = message.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c] ?? c)
  const html = `<!doctype html><meta charset="utf-8"><title>DSH Harbor</title><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0d1117;color:#e6edf3"><div style="max-width:440px;text-align:center"><h2>DSH core 不可用</h2><p style="opacity:.75">${safe}</p><p style="opacity:.5">可在托盘菜单选择「重启核心」重试，或修改 shell 配置端口。</p></div></body>`
  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html)).catch(() => undefined)
}
