# Build Android APK using local portable environment
# Run this script after 'scripts/setup-mobile-env.ps1'

$ErrorActionPreference = "Stop"

$LocalEnvDir = Join-Path $PSScriptRoot "..\.local-env"
$JdkDir = Join-Path $LocalEnvDir "jdk"
$SdkDir = Join-Path $LocalEnvDir "android-sdk"
$DumpDir = Join-Path $PSScriptRoot "..\dump"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "         COMPILING NATIVE DEBUG APK           " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# -------------------------------------------------------------
# 1. Verify Portable Environment
# -------------------------------------------------------------
if (-not (Test-Path $JdkDir) -or -not (Test-Path $SdkDir)) {
    Write-Host "Error: Local portable environment not found!" -ForegroundColor Red
    Write-Host "Please run 'scripts/setup-mobile-env.ps1' first to install JDK and Android SDK." -ForegroundColor Yellow
    Exit 1
}

# Setup env variables for compilation
$env:JAVA_HOME = $JdkDir
$env:ANDROID_HOME = $SdkDir
$env:PATH = "$JdkDir\bin;" + $env:PATH

# -------------------------------------------------------------
# 2. Configure local.properties for Gradle
# -------------------------------------------------------------
$AndroidDir = Join-Path $PSScriptRoot "..\android"
$LocalPropertiesFile = Join-Path $AndroidDir "local.properties"

Write-Host "`n[1/5] Configuring Gradle SDK locations..." -ForegroundColor Yellow
# Convert absolute SDK path for local.properties file (escaping backslashes)
$EscapedSdkPath = $SdkDir.Replace("\", "\\")
"sdk.dir=$EscapedSdkPath" | Out-File -FilePath $LocalPropertiesFile -Encoding ascii

# -------------------------------------------------------------
# 3. Build Web Bundle
# -------------------------------------------------------------
Write-Host "`n[2/5] Compiling production web bundle..." -ForegroundColor Yellow
npm run build

# -------------------------------------------------------------
# 4. Sync Web Bundle to Capacitor Android
# -------------------------------------------------------------
Write-Host "`n[3/5] Syncing web bundle to Android native platform..." -ForegroundColor Yellow
npx cap sync android

# -------------------------------------------------------------
# 5. Compile the Android APK via Gradle
# -------------------------------------------------------------
Write-Host "`n[4/5] Compiling Android APK with Gradle..." -ForegroundColor Yellow

# Store current location and change to android/ directory
if (-not (Test-Path $AndroidDir)) {
    Write-Host "Error: The native 'android' directory does not exist!" -ForegroundColor Red
    Write-Host "Please ensure you have initialized the Capacitor Android project by running 'npx cap add android' and synced the web bundle." -ForegroundColor Yellow
    Exit 1
}

Push-Location $AndroidDir

try {
    # Run the Gradle assembleDebug task
    & .\gradlew.bat assembleDebug
} finally {
    # Always restore original directory location
    Pop-Location
}

# -------------------------------------------------------------
# 6. Copy Finished APK to Dump Directory
# -------------------------------------------------------------
$BuiltApkPath = Join-Path $AndroidDir "app\build\outputs\apk\debug\app-debug.apk"
$Timestamp = Get-Date -Format "ddMMyy-HHmm"
# Read name dynamically from package.json
$PackageJson = Get-Content -Raw -Path (Join-Path $PSScriptRoot "..\package.json") | ConvertFrom-Json
$AppName = $PackageJson.name
$TargetApkName = "${AppName}-${Timestamp}-android.apk"
$TargetApkPath = Join-Path $DumpDir $TargetApkName

if (Test-Path $BuiltApkPath) {
    Write-Host "`n[5/5] Relocating APK to project dump/ folder..." -ForegroundColor Yellow
    
    if (-not (Test-Path $DumpDir)) {
        New-Item -ItemType Directory -Path $DumpDir | Out-Null
    }
    
    Copy-Item -Path $BuiltApkPath -Destination $TargetApkPath -Force
    
    Write-Host "`n==============================================" -ForegroundColor Green
    Write-Host "  APK COMPILED AND SAVED SUCCESSFULLY!        " -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor Green
    Write-Host "Saved Location: $TargetApkPath" -ForegroundColor Cyan
    Write-Host "Size: $((Get-Item $TargetApkPath).Length / 1MB | ForEach-Object { '{0:N2}' -f $_ }) MB" -ForegroundColor Gray
} else {
    Write-Host "Error: The build finished but the output APK could not be found at: $BuiltApkPath" -ForegroundColor Red
    Exit 1
}
