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
npm run dev      # tsc + electron .
npm run dev:watch  # shell hot-reload (rebuild + relaunch on src change)
npm run dist     # NSIS installer into release/
```

Also `start-harbor.bat` in the shell folder = double-click launcher (auto-installs deps on first run).

The shell spawns the official dsh core (`node <dsh bin> --profile web --host 127.0.0.1 --port <config> --patch <generated desktop-bridge patch>`) and loads the official Web UI. Core port default 3210; bridge port default 3211; config lives in Electron `userData/config.json`.

## Modules (src/main)

- `process-steward.ts` — spawn/health/crash-recovery/tree-kill of the core (L2 runtime)
- `core-updater.ts` — npm registry check + local dep update + core restart (L2 update)
- `shell-updater.ts` — electron-updater against GitHub Releases (L3 update, packaged only)
- `version-gate.ts` — warn-only compatibility gate on core version
- `bridge.ts` — loopback HTTP bridge (127.0.0.1) exposing status/notify/window/open-path to core plugins
- `patch-manager.ts` — generates the cordis.yml `--patch` overlay for `dsh-plugins/desktop-bridge` at runtime
- `window.ts` / `tray.ts` / `hotkey.ts` / `autostart.ts` / `config.ts` — shell chrome

## Desktop-bridge plugin (dsh-plugins/desktop-bridge)

A DSH cordis plugin loaded into the core via `--patch`. It registers tools
(`desktop_notify`, `desktop_status`, `desktop_show_window`, `desktop_open_path`)
that call the shell bridge over loopback HTTP — desktop capabilities become DSH
blocks: remove the patch and the shell degrades to a plain web window.

Typecheck: `npx tsc -p dsh-plugins/desktop-bridge/tsconfig.json` (paths map
`@deepseek-ai/*` into `shell/node_modules`). At runtime the plugin loads
`defineTool` via require with a shell-node_modules fallback (the plugin dir has
no node_modules of its own).

## Principles (never violate)

1. Shell/core separation — never vendor or modify the official DSH kernel/UI; spawn `dsh web` and `loadURL`.
2. Preload bridge is whitelist-only (`window.dshDesktop`); no DOM injection, no `executeJavaScript`.
3. Three independent update layers: UI content (official), core (npm, `core-updater`), shell (electron-updater, `shell-updater`).
4. Desktop capabilities belong in DSH cordis plugins (`dsh-plugins/desktop-bridge`) talking to the loopback bridge — never in the shell DOM.
