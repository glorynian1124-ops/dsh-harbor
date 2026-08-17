/** Shared constants between main and preload. */

export const IPC = {
  getShellVersion: 'dsh:get-shell-version',
  ping: 'dsh:ping',
} as const

/** dsh core versions the shell is tested against (warn-only gate for MVP). */
export const SUPPORTED_DSH_PREFIX = '0.1.0'

export const SHELL_VERSION = '0.1.0-mvp.1'

export const DEFAULTS = {
  port: 3210,
  host: '127.0.0.1',
  closeToTray: true,
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
