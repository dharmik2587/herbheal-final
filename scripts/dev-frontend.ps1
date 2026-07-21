$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = (Resolve-Path (Join-Path $scriptDir '..')).Path
$port = 3000

try {
    $listener = Get-NetTCPConnection -LocalPort $port -ErrorAction Stop | Select-Object -First 1
}
catch {
    $listener = $null
}

if ($listener) {
    Write-Host "Frontend already running on http://localhost:$port"
    exit 0
}

Set-Location $projectRoot
Write-Host "Starting frontend from $projectRoot..."
npm run dev
