import { globalShortcut } from 'electron'
import { HOTKEY } from '../shared/constants'

/** Global hotkey to show/hide the main window. */
export function registerToggleHotkey(toggle: () => void): void {
  const ok = globalShortcut.register(HOTKEY, toggle)
  console.log(`[harbor] hotkey ${HOTKEY} ${ok ? 'registered' : 'failed'}`)
}

export function unregisterHotkeys(): void {
  globalShortcut.unregisterAll()
}
