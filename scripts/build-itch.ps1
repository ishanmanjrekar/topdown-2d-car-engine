# Build Itch.io ZIP Package using local environment
$ErrorActionPreference = "Stop"

$ProjectRootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$DumpDir = Join-Path $ProjectRootDir "dump"
$DistDir = Join-Path $ProjectRootDir "dist"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "         COMPILING ITCH.IO ZIP PACKAGE        " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# -------------------------------------------------------------
# 1. Purge Web Build Caches
# -------------------------------------------------------------
Write-Host "`n[1/4] Purging web build caches..." -ForegroundColor Yellow
if (Test-Path $DistDir) { 
    Remove-Item -Path $DistDir -Recurse -Force -ErrorAction SilentlyContinue 
}

# -------------------------------------------------------------
# 2. Build Web Bundle
# -------------------------------------------------------------
Write-Host "`n[2/4] Compiling web bundle for Itch..." -ForegroundColor Yellow
npx vite build

# -------------------------------------------------------------
# 3. Zip Finished dist Folder to Dump Directory
# -------------------------------------------------------------
$Timestamp = Get-Date -Format "ddMMyy-HHmm"
# Read name dynamically from package.json
$PackageJson = Get-Content -Raw -Path (Join-Path $ProjectRootDir "package.json") | ConvertFrom-Json
$AppName = $PackageJson.name
$TargetZipName = "${AppName}-${Timestamp}-itch.zip"
$TargetZipPath = Join-Path $DumpDir $TargetZipName

Write-Host "`n[3/4] Creating zip archive..." -ForegroundColor Yellow

if (-not (Test-Path $DumpDir)) {
    New-Item -ItemType Directory -Path $DumpDir | Out-Null
}

Push-Location $DistDir
try {
    # Use bestzip to package the contents of dist
    npx bestzip $TargetZipPath *
} finally {
    Pop-Location
}

# -------------------------------------------------------------
# 4. Verification and Clean Up
# -------------------------------------------------------------
if (Test-Path $TargetZipPath) {
    Write-Host "`n==============================================" -ForegroundColor Green
    Write-Host "  ITCH ZIP COMPILED AND SAVED SUCCESSFULLY!   " -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor Green
    Write-Host "Saved Location: $TargetZipPath" -ForegroundColor Cyan
    Write-Host "Size: $((Get-Item $TargetZipPath).Length / 1MB | ForEach-Object { '{0:N2}' -f $_ }) MB" -ForegroundColor Gray

    # Retain only the latest 2 itch build archives in dump/ to prevent storage bloat
    $OlderZips = Get-ChildItem -Path $DumpDir -Filter "*-itch.zip" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 2
    if ($OlderZips) {
        Write-Host "Pruning $($OlderZips.Count) older archive(s) in dump/..." -ForegroundColor DarkGray
        $OlderZips | Remove-Item -Force
    }
} else {
    Write-Host "Error: The build finished but the output ZIP could not be found at: $TargetZipPath" -ForegroundColor Red
    Exit 1
}
