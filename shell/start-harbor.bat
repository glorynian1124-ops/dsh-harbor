@echo off
chcp 65001 >nul
title DSH Harbor
cd /d "%~dp0"
if not exist node_modules\electron\dist\electron.exe (
  echo [first run] installing dependencies, please wait...
  call npm install
)
call npm run dev
pause
