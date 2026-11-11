# One-time setup on Windows for every style in this repo.
#   powershell -ExecutionPolicy Bypass -File setup\install.ps1            (asks before installing programs)
#   powershell -ExecutionPolicy Bypass -File setup\install.ps1 -Yes       (installs without asking)
# Extra arguments go to install.py, e.g.  -Rest "--update"
param([switch]$Yes, [string]$Rest = "")

$ErrorActionPreference = "Continue"
$repo = Split-Path -Parent $PSScriptRoot

function Refresh-Path {
  $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
}

function Find-Python {
  foreach ($v in @("3.12", "3.13", "3.11", "3.10")) {
    if (Get-Command py -ErrorAction SilentlyContinue) {
      $p = & py "-$v" -c "import sys; print(sys.executable)" 2>$null
      if ($LASTEXITCODE -eq 0 -and $p) { return $p.Trim() }
    }
  }
  $p = Get-Command python -ErrorAction SilentlyContinue
  if ($p -and $p.Source -notlike "*WindowsApps*") {
    $ok = & $p.Source -c "import sys; print(int((3,10) <= sys.version_info[:2] <= (3,13)))" 2>$null
    if ($ok -eq "1") { return $p.Source }
  }
  return $null
}

function Has-Chrome {
  $paths = @($env:CHROME_PATH,
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe")
  foreach ($p in $paths) { if ($p -and (Test-Path $p)) { return $true } }
  return $false
}

$need = @()
if (-not (Find-Python)) { $need += @{ name = "Python 3.12"; id = "Python.Python.3.12" } }
$node = Get-Command node -ErrorAction SilentlyContinue
$nodeOk = $false
if ($node) { $nv = (& node --version) -replace "v", ""; $nodeOk = ([int]($nv.Split(".")[0]) -ge 18) }
if (-not $nodeOk) { $need += @{ name = "Node.js LTS"; id = "OpenJS.NodeJS.LTS" } }
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue) -or -not (Get-Command ffprobe -ErrorAction SilentlyContinue)) { $need += @{ name = "ffmpeg"; id = "Gyan.FFmpeg" } }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { $need += @{ name = "Git (with Git Bash)"; id = "Git.Git" } }
if (-not (Has-Chrome)) { $need += @{ name = "Google Chrome"; id = "Google.Chrome" } }

if ($need.Count -gt 0) {
  Write-Host "Missing programs:" ($need | ForEach-Object { $_.name }) -Separator "`n  - "
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Host "winget is not available. Install the programs above by hand, then run this script again."
    exit 1
  }
  $go = $Yes
  if (-not $go) { $ans = Read-Host "Install them now with winget? [Y/n]"; $go = ($ans -eq "" -or $ans -match "^[Yy]") }
  if (-not $go) { Write-Host "Stopped. Nothing was installed."; exit 1 }
  foreach ($n in $need) {
    Write-Host "`n== winget install $($n.id)"
    winget install -e --id $n.id --accept-source-agreements --accept-package-agreements
  }
  Refresh-Path
} else {
  Write-Host "Python, Node.js, ffmpeg, Git and Chrome/Edge are already installed."
}

$py = Find-Python
if (-not $py) {
  Write-Host "Python 3.10-3.13 still not found. Open a NEW PowerShell window and run this script again."
  exit 1
}
# The skills call plain `python`. Make sure it is this Python and not the Microsoft Store alias.
$cur = Get-Command python -ErrorAction SilentlyContinue
$curOk = $false
if ($cur -and $cur.Source -notlike "*WindowsApps*") {
  $curOk = ((& $cur.Source -c "import sys; print(int((3,10) <= sys.version_info[:2] <= (3,13)))" 2>$null) -eq "1")
}
if (-not $curOk) {
  $pyDir = Split-Path -Parent $py
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $add = @($pyDir, (Join-Path $pyDir "Scripts")) | Where-Object { ($userPath -split ";") -notcontains $_ }
  if ($add) {
    [Environment]::SetEnvironmentVariable("Path", (($add -join ";") + ";" + $userPath), "User")
    Write-Host "Added $pyDir to your PATH so the 'python' command works."
  }
  Refresh-Path
  $env:Path = "$pyDir;" + (Join-Path $pyDir "Scripts") + ";" + $env:Path
}

$args2 = @("$repo\setup\install.py")
if ($Rest) { $args2 += $Rest.Split(" ") }
& $py @args2
