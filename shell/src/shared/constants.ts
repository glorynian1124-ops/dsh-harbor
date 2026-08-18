/** Shared constants between main and preload. */

export const IPC = {
  getShellVersion: 'dsh:get-shell-version',
  ping: 'dsh:ping',
  getCoreVersion: 'dsh:get-core-version',
  checkCoreUpdate: 'dsh:check-core-update',
  applyCoreUpdate: 'dsh:apply-core-update',
  toggleAutostart: 'dsh:toggle-autostart',
  openConfigDir: 'dsh:open-config-dir',
} as const

/** dsh core versions the shell is tested against (warn-only gate). */
export const SUPPORTED_DSH_PREFIX = '0.1.0'

export const SHELL_VERSION = '0.2.0-v2.1'

/** The official core npm package the shell spawns. */
export const CORE_PACKAGE = '@deepseek-ai/dsh'

export const HOTKEY = 'CommandOrControl+Alt+D'

/** Env var injected into the dsh core process: where the bridge listens. */
export const BRIDGE_PORT_ENV = 'DSH_HARBOR_BRIDGE_PORT'

/** Env var injected into the dsh core process: absolute shell directory. */
export const SHELL_DIR_ENV = 'DSH_HARBOR_SHELL_DIR'

export const DEFAULTS = {
  port: 3210,
  host: '127.0.0.1',
  /** desktop-bridge loopback HTTP port (core plugins call this) */
  bridgePort: 3211,
  closeToTray: true,
  autostart: false,
  /** generic feed URL for shell updates; empty => use electron-builder publish config (GitHub Releases) */
  updateFeedUrl: '',
  windowWidth: 1280,
  windowHeight: 820,
  /** first-boot readiness timeout (ms) */
  bootTimeoutMs: 60_000,
  /** uptime (ms) after which the restart backoff resets */
  stableUptimeMs: 60_000,
  /** restart backoff schedule (ms); the last value repeats */
  restartBackoffMs: [1_000, 2_000, 4_000, 8_000, 15_000, 30_000],
  /** give up auto-restart after this many consecutive crashes */
  maxConsecutiveCrashes: 5,
} as const
