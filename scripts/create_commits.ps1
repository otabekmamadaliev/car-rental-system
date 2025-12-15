<#
PowerShell helper to create git commits for each team member.
Run this from the project root.
Requires: git installed and available in PATH.

This script will:
- Initialize a git repo if none exists
- Create 5 commits per team member by appending lines to README.md
#>

param(
  [switch]$DryRun
)

function Ensure-Git {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "git is not installed or not in PATH. Install git first."; exit 1
  }
}

Ensure-Git

if (-not (Test-Path .git)) {
  if ($DryRun) { Write-Host "(DryRun) Would run: git init" } else { git init }
}

$members = @(
  @{ Name = 'Ruzimuhammad Alinazarov'; Email = 'alinazarovrozimuhammad9@gmail.com' },
  @{ Name = 'Otabek Mamadaliev'; Email = 'otabekmamadaliyev09@gmail.com' }
)

foreach ($m in $members) {
  for ($i = 1; $i -le 5; $i++) {
    $line = "`n$m.Name commit $i"
    if ($DryRun) { Write-Host "(DryRun) Would append: $line" } else { Add-Content -Path README.md -Value $line }
    git add README.md
    $env:GIT_AUTHOR_NAME = $m.Name
    $env:GIT_AUTHOR_EMAIL = $m.Email
    $msg = "$($m.Name) commit $i"
    if ($DryRun) { Write-Host "(DryRun) Would run: git commit -m '$msg' --author='$($m.Name) <$($m.Email)>'" } else { git commit -m $msg --author="$($m.Name) <$($m.Email)>" }
  }
}

Write-Host "Done. Review commits with: git log --pretty=format:'%h %an %ae %s' -n 50"
