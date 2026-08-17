import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/constants'

/**
 * Whitelist-only bridge. Exposed surface is deliberately tiny:
 * version + ping. Never inject DOM, never expose raw ipcRenderer.
 */
contextBridge.exposeInMainWorld('dshDesktop', {
  getShellVersion: (): Promise<string> => ipcRenderer.invoke(IPC.getShellVersion),
  ping: (): Promise<string> => ipcRenderer.invoke(IPC.ping),
})
