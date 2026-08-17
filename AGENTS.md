# AGENTS.md — DSH Harbor

Self-built desktop shell for DeepSeek Harness. Codename: DSH Harbor (鲸港).

## Layout

- `shell/` — Electron 43 + TypeScript shell (the code of this repo)
- `kernel/` — official deepseek-harness clone (git-ignored; sync with `git -C kernel pull`)
- `docs/` — architecture blueprint, competitor research, localization plan

## Build & run

```sh
cd shell
npm install      # downloads electron + @deepseek-ai/dsh
npm run dev      # tsc + electron .
npm run dev:watch  # shell hot-reload (rebuild + relaunch on src change)
npm run dist     # NSIS installer into release/
```

The shell spawns the official dsh core (`node <dsh bin> --profile web --host 127.0.0.1 --port <config>`) and loads the official Web UI. Core port default 3210; config lives in Electron `userData/config.json`.

## Principles (never violate)

1. Shell/core separation — never vendor or modify the official DSH kernel/UI; spawn `dsh web` and `loadURL`.
2. Preload bridge is whitelist-only (`window.dshDesktop`); no DOM injection, no `executeJavaScript`.
3. Three independent update layers: UI content (official), core (npm), shell (electron-updater, planned).
4. Desktop capabilities belong in DSH cordis plugins via the api-gateway Typert remote, not in the shell.
