import { app } from 'electron'
import * as path from 'node:path'

/**
 * Root that hosts REAL (unpacked) files the core child process can read.
 *
 * Dev: the shell directory (app.getAppPath()).
 * Packaged: resources/app.asar.unpacked — the spawned `node` process does not
 * understand asar, so everything the core needs must live unpacked.
 */
export function shellRootDir(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar.unpacked')
  }
  return app.getAppPath()
}
