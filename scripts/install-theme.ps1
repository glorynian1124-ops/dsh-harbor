# Install dsh-harbor-theme into the web profile and register it in cordis.patch.yml.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\install-theme.ps1
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$pkgSrc = Join-Path $repoRoot 'dsh-plugins\harbor-theme'
$profileDir = Join-Path $env:USERPROFILE '.dsh\profiles\web'
$pkgDest = Join-Path $profileDir 'node_modules\dsh-harbor-theme'

if (-not (Test-Path $profileDir)) { throw "profile not found: $profileDir" }

# 1. copy the package into the profile's node_modules
Remove-Item $pkgDest -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $pkgDest -Force | Out-Null
Copy-Item (Join-Path $pkgSrc 'package.json') $pkgDest -Force
Copy-Item (Join-Path $pkgSrc 'lib') (Join-Path $pkgDest 'lib') -Recurse -Force
Write-Host "copied package -> $pkgDest"

# 2. register the plugin entry in the profile patch layer
$patchPath = Join-Path $profileDir 'cordis.patch.yml'
$entry = @"
# DSH Harbor injections (managed by scripts\install-theme.ps1)
- insert:
    - id: harbor-theme
      name: dsh-harbor-theme
"@
Set-Content -LiteralPath $patchPath -Value $entry -Encoding utf8
Write-Host "registered entry -> $patchPath"

Write-Host 'done. Restart the dsh core (tray -> 重启核心) and reload the window (Ctrl+R).'
