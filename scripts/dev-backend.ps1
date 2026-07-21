$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = (Resolve-Path (Join-Path $scriptDir '..')).Path
$backendRoot = Join-Path $projectRoot 'backend'
$port = 5000

try {
    $listener = Get-NetTCPConnection -LocalPort $port -ErrorAction Stop | Select-Object -First 1
}
catch {
    $listener = $null
}

if ($listener) {
    Write-Host "Backend already running on http://127.0.0.1:$port"
    exit 0
}

Set-Location $backendRoot
$pythonExe = Join-Path $backendRoot 'venv\Scripts\python.exe'
if (-not (Test-Path $pythonExe)) {
    throw "Backend virtualenv not found at $pythonExe. Run the backend setup first."
}

Write-Host "Starting backend from $backendRoot..."
& $pythonExe app.py
