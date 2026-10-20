# Installs the "Danish Nadar" signature into classic Outlook for Windows.
#
#   Right-click > Run with PowerShell, or:
#   powershell -ExecutionPolicy Bypass -File .\outlook\Install-ClassicOutlook.ps1
#
# Not needed for new Outlook or Outlook on the web; see INSTALL.md.
$ErrorActionPreference = 'Stop'

$dest = Join-Path $env:APPDATA 'Microsoft\Signatures'
New-Item -ItemType Directory -Force -Path $dest | Out-Null

foreach ($ext in 'htm', 'txt') {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot "Danish Nadar.$ext") -Destination $dest -Force
}

Write-Host "Installed to $dest"
Write-Host "Restart Outlook, then go to File > Options > Mail > Signatures... and select 'Danish Nadar' for new messages and replies."
