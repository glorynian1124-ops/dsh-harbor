import * as fs from 'node:fs'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Generate the cordis.yml patch overlay that loads the desktop-bridge plugin
 * into the dsh core at boot.
 *
 * The DSH plugin loader imports loader entries via ESM dynamic import, so the
 * plugin path MUST be a valid file:// URL on Windows — a bare "D:/..." path is
 * rejected with ERR_UNSUPPORTED_ESM_URL_SCHEME ("Received protocol 'd:'").
 * pathToFileURL also percent-encodes spaces ("000.Code Objects" → %20).
 *
 * The patch is generated at runtime into userData/patches (the committed repo
 * stays machine-independent). Returns null when the plugin is missing.
 */
export function ensureDesktopBridgePatch(shellRoot: string, userData: string): string | null {
  const plugin = path.join(shellRoot, '..', 'dsh-plugins', 'desktop-bridge', 'src', 'index.ts')
  if (!fs.existsSync(plugin)) {
    console.warn('[harbor] desktop-bridge plugin not found, core starts without --patch')
    return null
  }
  const dir = path.join(userData, 'patches')
  fs.mkdirSync(dir, { recursive: true })
  const target = path.join(dir, 'desktop-bridge.yml')
  const pluginUrl = pathToFileURL(plugin).href
  const yml = `- insert:\n    - id: desktop-bridge\n      name: '${pluginUrl}'\n`
  fs.writeFileSync(target, yml, 'utf8')
  console.log('[harbor] desktop-bridge patch ready:', target)
  return target
}
