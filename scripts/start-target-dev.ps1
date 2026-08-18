[CmdletBinding()]
param(
    [switch]$RestartBackend,
    [switch]$StartFrontend
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$backendPort = 5080
$frontendPort = 5173

$sessionKey = [Environment]::GetEnvironmentVariable('FIINGROUPAPP_SESSION_KEY', 'User')
if ([string]::IsNullOrWhiteSpace($sessionKey)) {
    throw 'FIINGROUPAPP_SESSION_KEY is missing from the User environment.'
}

$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:Auth__SessionEncryptionKey = $sessionKey
$env:Tfs__Enabled = 'true'
$env:Tfs__BaseUrl = 'http://192.168.1.40:8080/tfs'
$env:Tfs__Collection = 'FiinGroup'
$env:Tfs__RequireIdentityMapping = 'false'
$env:Tfs__WriteEnabled = 'false'

# Read local Identity DB settings from the integration container at runtime.
# Credentials are not committed or printed.
$identityContainer = 'fiingroup-identity-db-integration'
$containerEnv = @(docker inspect $identityContainer --format '{{range .Config.Env}}{{println .}}{{end}}' 2>$null)
$dbUserLine = $containerEnv | Where-Object { $_ -like 'MARIADB_USER=*' } | Select-Object -First 1
$dbPasswordLine = $containerEnv | Where-Object { $_ -like 'MARIADB_PASSWORD=*' } | Select-Object -First 1
$dbNameLine = $containerEnv | Where-Object { $_ -like 'MARIADB_DATABASE=*' } | Select-Object -First 1
if ($dbUserLine -and $dbPasswordLine -and $dbNameLine) {
    $dbUser = $dbUserLine.Substring('MARIADB_USER='.Length)
    $dbPassword = $dbPasswordLine.Substring('MARIADB_PASSWORD='.Length)
    $dbName = $dbNameLine.Substring('MARIADB_DATABASE='.Length)
    $env:IdentityStore__Enabled = 'true'
    $env:ConnectionStrings__Identity = "Server=127.0.0.1;Port=33306;Database=$dbName;User ID=$dbUser;Password=$dbPassword"
    $env:ProjectManagement__Enabled = 'true'
    $env:ProjectManagement__PmbokEnabled = 'true'
    $env:ConnectionStrings__ProjectManagement = "Server=127.0.0.1;Port=33306;Database=FiinGroupApp.ProjectManagement;User ID=$dbUser;Password=$dbPassword"
} else {
    Write-Warning "Identity container '$identityContainer' is unavailable; TFS login will have no target permission snapshot."
}

function Get-ListeningProcess([int]$port) {
    Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique
}

function Stop-TargetBackend {
    $pids = @(Get-ListeningProcess $backendPort)
    foreach ($pidValue in $pids) {
        $process = Get-CimInstance Win32_Process -Filter "ProcessId = $pidValue"
        $isTarget = $process -and (
            $process.ExecutablePath -like "$repoRoot\backend\*" -or
            $process.CommandLine -like "*$repoRoot\backend*" -or
            $process.CommandLine -like '*--project backend*'
        )
        if (-not $isTarget) {
            throw "Port $backendPort is occupied by an unrelated process (PID $pidValue). Stop it manually after verifying the process."
        }
        Stop-Process -Id $pidValue -Force
    }
    Start-Sleep -Seconds 1
}

$backendPids = @(Get-ListeningProcess $backendPort)
if ($backendPids.Count -gt 0 -and $RestartBackend) {
    Stop-TargetBackend
    $backendPids = @()
}

if ($backendPids.Count -gt 0) {
    $sessionProbe = curl.exe -sS --max-time 5 -o NUL -w '%{http_code}' "http://localhost:$backendPort/api/v2/auth/session"
    Write-Output "Backend already running on port $backendPort (PID $($backendPids -join ', ')); session probe returned HTTP $sessionProbe."
} else {
    Start-Process -FilePath 'dotnet' -ArgumentList @('run', '--project', 'backend', '--launch-profile', 'FiinGroupApp.Api') -WorkingDirectory $repoRoot -WindowStyle Hidden
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        if (@(Get-ListeningProcess $backendPort).Count -gt 0) { $ready = $true; break }
    }
    if (-not $ready) { throw "Backend did not start listening on port $backendPort." }
    Write-Output "Backend started on http://localhost:$backendPort."
}

if ($StartFrontend) {
    $frontendPids = @(Get-NetTCPConnection -State Listen -LocalPort $frontendPort -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)
    if ($frontendPids.Count -eq 0) {
        Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'dev', '--', '--host', 'localhost') -WorkingDirectory (Join-Path $repoRoot 'frontend') -WindowStyle Hidden
        Write-Output "Frontend start requested on http://localhost:$frontendPort."
    } else {
        Write-Output "Frontend already running on port $frontendPort (PID $($frontendPids -join ', '))."
    }
}

Write-Output 'Use Ctrl+F5 after opening http://localhost:5173.'
