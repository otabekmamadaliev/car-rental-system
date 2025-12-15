<#!
Interactive helper to correctly label screenshots based on actual content.

Usage (from project root):
  powershell -ExecutionPolicy Bypass -File .\scripts\label_screenshots.ps1

What it does:
- Iterates images under .\docs\screenshots
- Opens each image for you to view
- Prompts you to select the correct label
- Renames files to NN-<label>.jpg in the order you confirm

Supported labels:
  1) login
  2) home
  3) browse
  4) car-details
  5) create-booking
  6) my-bookings
  7) profile
  8) driver-license
  9) sensors
 10) settings

You can also type a custom label if none of the above match.
!#>

param(
  [string]$Folder = ".\\docs\\screenshots"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Test-Path $Folder)) {
  Write-Error "Folder not found: $Folder"; exit 1
}

$images = Get-ChildItem -LiteralPath $Folder -File |
  Where-Object { $_.Extension.ToLower() -in @('.png', '.jpg', '.jpeg', '.gif') } |
  Sort-Object Name
if (-not $images) {
  Write-Host "No images found in $Folder"; exit 0
}

$labels = @(
  'login','home','browse','car-details','create-booking',
  'my-bookings','profile','driver-license','sensors','settings'
)

[int]$seq = 1
$renames = @()

foreach ($img in $images) {
  Write-Host "\nViewing: $($img.Name)"
  try { Start-Process -FilePath $img.FullName } catch { }

  Write-Host "Select label (1-10) or enter custom text:" -ForegroundColor Cyan
  for ($i=0; $i -lt $labels.Count; $i++) {
    $n = $i + 1
    Write-Host ("  {0,2}) {1}" -f $n, $labels[$i])
  }
  Write-Host "  0) custom (type your own)"

  $choice = Read-Host "Your choice"

  $label = $null
  if ($choice -match '^[1-9]$|^10$') {
    $label = $labels[[int]$choice - 1]
  } elseif ($choice -eq '0') {
    $label = Read-Host "Enter custom label (kebab-case suggested)"
    if (-not $label) { $label = 'unlabeled' }
  } else {
    $label = $choice
    if (-not $label) { $label = 'unlabeled' }
  }

  $ext = $img.Extension.ToLower()
  $newName = ("{0:D2}-{1}{2}" -f $seq, $label, $ext)
  $target = Join-Path $img.DirectoryName $newName

  if (Test-Path $target) {
    Write-Host "Target exists, incrementing sequence to avoid conflict." -ForegroundColor Yellow
    do { $seq++ ; $newName = ("{0:D2}-{1}{2}" -f $seq, $label, $ext); $target = Join-Path $img.DirectoryName $newName } while (Test-Path $target)
  }

  Rename-Item -LiteralPath $img.FullName -NewName $newName
  $renames += [pscustomobject]@{ From = $img.Name; To = $newName; Label = $label }
  Write-Host ("Renamed -> {0}" -f $newName) -ForegroundColor Green

  $seq++
}

Write-Host "\nSummary:" -ForegroundColor Cyan
$renames | Format-Table -AutoSize

Write-Host "\nDone. If you want me to update README screenshots section to match the new names, tell me and I will do it." -ForegroundColor Cyan
