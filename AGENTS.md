# AGENTS.md — DSH Harbor

Self-built desktop shell for DeepSeek Harness. Codename: DSH Harbor (鲸港).

## Layout

- `shell/` — Electron 43 + TypeScript shell (the code of this repo)
- `dsh-plugins/` — DSH cordis plugins owned by the shell (desktop-bridge)
- `kernel/` — official deepseek-harness clone (git-ignored; sync with `git -C kernel pull`)
- `docs/` — architecture blueprint, competitor research, localization plan

## Build & run

```sh
cd shell
npm install      # downloads electron + @deepseek-ai/dsh (see .npmrc mirrors)
npm run dev      # tsc + electron .  (dev: source layout)
npm run dev:watch  # shell hot-reload (rebuild + relaunch on src change)
npm run pack     # unpacked build into release/win-unpacked (fast sanity check)
npm run dist     # NSIS installer into release/
```

Also `start-harbor.bat` in the shell folder = double-click dev launcher.

## Runtime paths (dev vs packaged)

- Dev: shell root = `app.getAppPath()`; core spawns `node node_modules/@deepseek-ai/dsh/lib/bin.js`; plugin patch at `<root>/dsh-plugins/desktop-bridge/src/index.ts`.
- Packaged: shell root = `resources/app.asar.unpacked` (`shellRootDir()` in `paths.ts`) — the child node process cannot read asar, so electron-builder `asarUnpack`s `node_modules/@deepseek-ai/**` + `dsh-plugins/**`. Do not "fix" packaged paths by reading from asar.
- The core is spawned with `--profile web --patch <generated patch> --host 127.0.0.1 --port <config>` — launcher flags MUST precede `--host` (dsh launcher stops parsing at the first unknown token). Env: `DSH_HARBOR_BRIDGE_PORT`, `DSH_HARBOR_SHELL_DIR`.

## Modules (src/main)

- `process-steward.ts` — spawn/health/crash-recovery/tree-kill of the core (L2 runtime)
- `core-updater.ts` — npm registry check + local dep update + core restart (L2 update; dev-mode only for now)
- `shell-updater.ts` — electron-updater against GitHub Releases (L3 update, packaged only)
- `version-gate.ts` — warn-only compatibility gate on core version
- `bridge.ts` — loopback HTTP bridge (127.0.0.1:3211) exposing status/notify/window/open-path to core plugins
- `patch-manager.ts` — generates the cordis.yml `--patch` overlay for `dsh-plugins/desktop-bridge` (plugin path must be a file:// URL — ESM loader requirement)
- `paths.ts` — shellRootDir(): dev app path vs packaged app.asar.unpacked
- `window.ts` / `tray.ts` / `hotkey.ts` / `autostart.ts` / `config.ts` — shell chrome

## Desktop-bridge plugin (dsh-plugins/desktop-bridge)

A DSH cordis plugin loaded into the core via `--patch`. It registers tools
(`desktop_notify`, `desktop_status`, `desktop_show_window`, `desktop_open_path`)
that call the shell bridge over loopback HTTP — desktop capabilities become DSH
blocks: remove the patch and the shell degrades to a plain web window.

The plugin runs as ESM inside the core (no `require`): it loads `defineTool`
via `createRequire` anchored at `DSH_HARBOR_SHELL_DIR` (env-injected by the
shell). Typecheck: `npx tsc -p dsh-plugins/desktop-bridge/tsconfig.json`
(paths map `@deepseek-ai/*` into `shell/node_modules`).

## Principles (never violate)

1. Shell/core separation — never vendor or modify the official DSH kernel/UI; spawn `dsh web` and `loadURL`.
2. Preload bridge is whitelist-only (`window.dshDesktop`); no DOM injection, no `executeJavaScript`.
3. Three independent update layers: UI content (official), core (npm, `core-updater`), shell (electron-updater, `shell-updater`).
4. Desktop capabilities belong in DSH cordis plugins (`dsh-plugins/desktop-bridge`) talking to the loopback bridge — never in the shell DOM.
