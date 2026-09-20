<#
.SYNOPSIS
  Install (or remove) dsh-provider-toolkit in a DSH profile.

.DESCRIPTION
  Copies this package into the profile's node_modules and registers it in
  `dsh.profile.bundles`, which is exactly the state `dsh plugin --profile <p>
  add <path>` produces for these community plugins. A copy — rather than the
  symlink pnpm creates for a local directory — is deliberate: node resolves a
  symlinked package to its real path, from which this package's bare imports
  (`@deepseek-ai/schemastery`, `undici`, `zod`) do not resolve.

  A DSH restart picks the row up. Nothing here restarts the running service.

.EXAMPLE
  pwsh -File .\install.ps1
  pwsh -File .\install.ps1 -Profile web -DshHome C:\Users\me\.dsh
  pwsh -File .\install.ps1 -Uninstall
#>
[CmdletBinding()]
param(
  [string]$Profile = 'web',
  [string]$DshHome = $env:DSH_HOME,
  [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'
$packageName = 'dsh-provider-toolkit'
$source = $PSScriptRoot

# The profile manifest is parsed with JSON.parse on every boot, which rejects a
# UTF-8 BOM. Windows PowerShell's `Set-Content -Encoding utf8` writes one, so
# every manifest write goes through this BOM-free helper instead.
function Write-JsonFile([string]$path, $value) {
  $json = $value | ConvertTo-Json -Depth 10
  [System.IO.File]::WriteAllText($path, $json, (New-Object System.Text.UTF8Encoding($false)))
}

if ([string]::IsNullOrWhiteSpace($DshHome)) { $DshHome = Join-Path $HOME '.dsh' }
$profileDir = Join-Path (Join-Path $DshHome 'profiles') $Profile
if (-not (Test-Path $profileDir)) { throw "profile directory not found: $profileDir" }

$manifestPath = Join-Path $profileDir 'package.json'
if (-not (Test-Path $manifestPath)) { throw "profile manifest not found: $manifestPath" }
$target = Join-Path (Join-Path $profileDir 'node_modules') $packageName

if ($Uninstall) {
  if (Test-Path $target) { Remove-Item -Recurse -Force $target }
  $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
  $bundles = @($manifest.dsh.profile.bundles | Where-Object { $_ -ne $packageName })
  $manifest.dsh.profile.bundles = $bundles
  Write-JsonFile $manifestPath $manifest
  Write-Host "removed $packageName from profile '$Profile'; restart dsh to unload it."
  return
}

$files = @('package.json', 'index.js', 'client.js', 'typert.host.js', 'cordis.patch.yml', 'README.md')
New-Item -ItemType Directory -Force -Path $target | Out-Null
foreach ($file in $files) {
  $from = Join-Path $source $file
  if (-not (Test-Path $from)) { throw "missing package file: $from" }
  Copy-Item -Force -Path $from -Destination (Join-Path $target $file)
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$bundles = @($manifest.dsh.profile.bundles)
if ($bundles -notcontains $packageName) {
  $manifest.dsh.profile.bundles = @($bundles + $packageName)
  Write-JsonFile $manifestPath $manifest
  Write-Host "registered $packageName in dsh.profile.bundles"
} else {
  Write-Host "$packageName is already registered in dsh.profile.bundles"
}
Write-Host "installed to $target; restart dsh to load the row."