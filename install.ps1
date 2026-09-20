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

  For the DSH Desktop app, point -DshHome at the desktop harness home:
    Windows : %APPDATA%\dsh-desktop\harness
    macOS   : ~/Library/Application Support/dsh-desktop/harness
    Linux   : ~/.config/dsh-desktop/harness
  The script also bootstraps this package's runtime dependencies into the
  target profile from any local DSH installation (CLI npm install, CLI web
  profile, or the desktop's own bundled node_modules) when pnpm/npm is not an
  option.

  A DSH restart picks the row up. Nothing here restarts the running service.

.EXAMPLE
  pwsh -File .\install.ps1
  pwsh -File .\install.ps1 -Profile web -DshHome "$env:APPDATA\dsh-desktop\harness"
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
  $manifest = Get-Content $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $bundles = @($manifest.dsh.profile.bundles | Where-Object { $_ -ne $packageName })
  $manifest.dsh.profile.bundles = $bundles
  Write-JsonFile $manifestPath $manifest
  Write-Host "removed $packageName from profile '$Profile'; restart dsh to unload it."
  return
}

$files = @('package.json', 'index.js', 'client.js', 'typert.host.js', 'cordis.patch.yml', 'README.md', 'README.zh.md', 'LICENSE', 'install.ps1')
New-Item -ItemType Directory -Force -Path $target | Out-Null
foreach ($file in $files) {
  $from = Join-Path $source $file
  if (-not (Test-Path $from)) { throw "missing package file: $from" }
  Copy-Item -Force -Path $from -Destination (Join-Path $target $file)
}

# The host half imports undici / zod / @deepseek-ai/schemastery /
# @deepseek-ai/dsh-typert-protocol. A `pnpm add` would fetch them; this
# offline path copies whatever is missing from another local DSH install
# (CLI npm package, CLI web profile, or the desktop app's bundled modules).
$profileModules = Join-Path $profileDir 'node_modules'
$depSources = @(
  (Join-Path $env:APPDATA 'npm\node_modules\@deepseek-ai\dsh\node_modules'),
  (Join-Path $HOME '.dsh\profiles\web\node_modules'),
  (Join-Path $env:LOCALAPPDATA 'Programs\DSH Desktop\resources\app\node_modules')
)
# Walk the dependency closure from this package's own manifest: direct deps
# (undici / zod / schemastery / dsh-typert-protocol) carry their own deps
# (schemastery needs cosmokit, typert-protocol peers on @deepseek-ai/cordis,
# ...), and a copied package's deps may likewise be missing from the target
# profile. Transitive walks include peerDependencies (cordis, etc.); the root
# package's own peers (react) are runtime-provided and deliberately excluded.
$rootManifest = Get-Content (Join-Path $source 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$queue = [System.Collections.Generic.Queue[string]]::new()
foreach ($name in @($rootManifest.dependencies.PSObject.Properties.Name)) { if ($name) { $queue.Enqueue($name) } }
$visited = @{}
while ($queue.Count -gt 0) {
  $dep = $queue.Dequeue()
  if ($visited.ContainsKey($dep)) { continue }
  $visited[$dep] = $true
  $dest = Join-Path $profileModules ($dep -replace '/', '\')
  $destManifest = Join-Path $dest 'package.json'
  $meta = $null
  if (Test-Path $destManifest) {
    $meta = Get-Content $destManifest -Raw -Encoding UTF8 | ConvertFrom-Json
  } else {
    foreach ($srcRoot in $depSources) {
      $src = Join-Path $srcRoot ($dep -replace '/', '\')
      $srcManifest = Join-Path $src 'package.json'
      if (-not (Test-Path $srcManifest)) { continue }
      $candidate = Get-Content $srcManifest -Raw -Encoding UTF8 | ConvertFrom-Json
      # Hard version gate: the dispatcher this package hands to the runtime's
      # globalThis.fetch must come from the same undici generation as that
      # fetch. Node 24's built-in fetch is undici 7; an undici 8 dispatcher
      # silently hangs every request it governs. My manifest pins ^7, so only
      # a same-major copy is acceptable.
      if ($dep -eq 'undici') {
        $requiredMajor = [regex]::Match([string]$rootManifest.dependencies.undici, '\d+').Value
        $candidateMajor = [regex]::Match([string]$candidate.version, '^\d+').Value
        if ($candidateMajor -ne $requiredMajor) {
          Write-Host "skipped $dep@$($candidate.version) from $srcRoot (need major ${requiredMajor}: cross-generation dispatchers hang the runtime fetch)"
          continue
        }
      }
      New-Item -ItemType Directory -Force -Path (Split-Path $dest -Parent) | Out-Null
      Copy-Item -Recurse -Force -Path $src -Destination $dest
      $meta = $candidate
      Write-Host "bootstrapped dependency $dep@$($meta.version) from $srcRoot"
      break
    }
    if ($meta -eq $null) {
      if ($dep -eq 'undici') {
        Write-Warning "no undici matching the required major was found locally; install it once with network access (e.g. 'npm i undici@7' in any folder, then re-run this script) or prefer 'dsh plugin --profile web add'."
      } else {
        Write-Warning "dependency $dep is missing in $profileModules and no local DSH install provided it; the host half will fail to load until it is installed (prefer 'dsh plugin --profile web add' with network access)."
      }
      continue
    }
  }
  $names = @()
  if ($meta.dependencies) { $names += @($meta.dependencies.PSObject.Properties.Name) }
  if ($meta.peerDependencies) { $names += @($meta.peerDependencies.PSObject.Properties.Name) }
  foreach ($name in $names) { if ($name) { $queue.Enqueue($name) } }
}

$manifest = Get-Content $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$bundles = @($manifest.dsh.profile.bundles)
if ($bundles -notcontains $packageName) {
  $manifest.dsh.profile.bundles = @($bundles + $packageName)
  Write-JsonFile $manifestPath $manifest
  Write-Host "registered $packageName in dsh.profile.bundles"
} else {
  Write-Host "$packageName is already registered in dsh.profile.bundles"
}
Write-Host "installed to $target; restart dsh to load the row."