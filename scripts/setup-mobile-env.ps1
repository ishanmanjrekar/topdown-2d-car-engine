# Setup Self-Contained Portable Android/JDK Environment for Windows
# Run this script to bootstrap JDK 21 and the Android SDK inside your project folder under `.local-env/`

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Create local env directory
$LocalEnvDir = Join-Path $PSScriptRoot "..\.local-env"
if (-not (Test-Path $LocalEnvDir)) {
    New-Item -ItemType Directory -Path $LocalEnvDir | Out-Null
}

$JdkDir = Join-Path $LocalEnvDir "jdk"
$SdkDir = Join-Path $LocalEnvDir "android-sdk"
$CmdLineToolsDir = Join-Path $SdkDir "cmdline-tools"
$CmdLineLatestDir = Join-Path $CmdLineToolsDir "latest"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  PORTABLE ANDROID ENVIRONMENT SETUP           " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Installing environment locally under: $LocalEnvDir" -ForegroundColor Gray

# -------------------------------------------------------------
# 1. Download & Extract Portable JDK 21
# -------------------------------------------------------------
if (-not (Test-Path $JdkDir)) {
    $JdkZipUrl = "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.3%2B9/OpenJDK21U-jdk_x64_windows_hotspot_21.0.3_9.zip"
    $JdkZipFile = Join-Path $LocalEnvDir "jdk.zip"
    
    Write-Host "`n[1/4] Downloading JDK 21 (Adoptium)..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $JdkZipUrl -OutFile $JdkZipFile -UserAgent "Mozilla/5.0"
    
    Write-Host "Extracting JDK..." -ForegroundColor Yellow
    $TempExtractDir = Join-Path $LocalEnvDir "jdk_temp"
    if (Test-Path $TempExtractDir) { Remove-Item -Recurse -Force $TempExtractDir }
    
    Expand-Archive -Path $JdkZipFile -DestinationPath $TempExtractDir -Force
    
    # Adoptium zip contains a root folder like 'jdk-21.0.3+9'
    $RootFolder = Get-ChildItem -Path $TempExtractDir | Select-Object -First 1
    Move-Item -Path $RootFolder.FullName -Destination $JdkDir
    
    # Cleanup temp
    Remove-Item -Force $JdkZipFile
    Remove-Item -Recurse -Force $TempExtractDir
    Write-Host "JDK 21 installed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n[1/4] JDK 21 is already installed locally." -ForegroundColor Green
}

# -------------------------------------------------------------
# 2. Download & Extract Android CommandLineTools
# -------------------------------------------------------------
if (-not (Test-Path $CmdLineLatestDir)) {
    # CommandLineTools Win version
    $SdkUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
    $SdkZipFile = Join-Path $LocalEnvDir "sdk-tools.zip"
    
    Write-Host "`n[2/4] Downloading Android Command Line Tools..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $SdkUrl -OutFile $SdkZipFile -UserAgent "Mozilla/5.0"
    
    Write-Host "Extracting Command Line Tools..." -ForegroundColor Yellow
    $TempExtractDir = Join-Path $LocalEnvDir "sdk_temp"
    if (Test-Path $TempExtractDir) { Remove-Item -Recurse -Force $TempExtractDir }
    
    Expand-Archive -Path $SdkZipFile -DestinationPath $TempExtractDir -Force
    
    # Inside the zip is 'cmdline-tools'. We need it to be in 'cmdline-tools/latest'
    if (-not (Test-Path $CmdLineToolsDir)) {
        New-Item -ItemType Directory -Path $CmdLineToolsDir | Out-Null
    }
    
    $UnpackedCmdlineTools = Join-Path $TempExtractDir "cmdline-tools"
    Move-Item -Path $UnpackedCmdlineTools -Destination $CmdLineLatestDir
    
    # Cleanup temp
    Remove-Item -Force $SdkZipFile
    Remove-Item -Recurse -Force $TempExtractDir
    Write-Host "Android Command Line Tools installed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n[2/4] Android Command Line Tools already installed locally." -ForegroundColor Green
}

# Set environment variables for the rest of the script
$env:JAVA_HOME = $JdkDir
$env:ANDROID_HOME = $SdkDir
$env:PATH = "$JdkDir\bin;$CmdLineLatestDir\bin;" + $env:PATH

$SdkManager = Join-Path $CmdLineLatestDir "bin\sdkmanager.bat"

# -------------------------------------------------------------
# 3. Accept Android Licenses
# -------------------------------------------------------------
Write-Host "`n[3/4] Accepting Android SDK Licenses..." -ForegroundColor Yellow
# Create directory for licenses to prevent write errors
$LicenseDir = Join-Path $SdkDir "licenses"
if (-not (Test-Path $LicenseDir)) {
    New-Item -ItemType Directory -Path $LicenseDir | Out-Null
}

# Send "y" repeatedly to accept all licenses
$YesInput = @("y", "y", "y", "y", "y", "y", "y")
$YesInput | & $SdkManager --licenses --sdk_root=$SdkDir
Write-Host "Licenses accepted successfully!" -ForegroundColor Green

# -------------------------------------------------------------
# 4. Install Platforms & Build Tools
# -------------------------------------------------------------
Write-Host "`n[4/4] Installing SDK Platform 34 and Build Tools 34.0.0..." -ForegroundColor Yellow
& $SdkManager "platforms;android-34" "build-tools;34.0.0" "platform-tools" --sdk_root=$SdkDir

Write-Host "`n==============================================" -ForegroundColor Green
Write-Host "  PORTABLE ANDROID ENVIRONMENT IS FULLY READY!  " -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host "You can now run 'scripts/build-apk.ps1' to compile the APK." -ForegroundColor Cyan
