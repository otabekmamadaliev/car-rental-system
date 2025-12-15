# Rebuild Git History with Proper Work Attribution
# This script creates meaningful commits showing actual work done by each team member

param([switch]$Execute)

$otabekEmail = "otabekmamadaliyev09@gmail.com"
$ruziEmail = "alinazarovrozimuhammad9@gmail.com"

if (-not $Execute) {
  Write-Host "DRY RUN - Add -Execute to actually run" -ForegroundColor Yellow
  Write-Host ""
}

# Reset to clean state
Write-Host "Step 1: Resetting to clean state..." -ForegroundColor Cyan
if ($Execute) {
  git checkout --orphan new-main
  git rm -rf . 2>$null
}

# Commit 1: Ruzimuhammad - Project structure and base configuration
Write-Host "Commit 1: Project structure and configuration (Ruzimuhammad)" -ForegroundColor Green
$files1 = @(
  "package.json", "package-lock.json", "app.json", "babel.config.js", 
  "eas.json", ".gitignore", "README.md", "LICENSE"
)
if ($Execute) {
  git checkout backup-original -- $files1
  git add $files1
  $env:GIT_AUTHOR_NAME = "Ruzimuhammad Alinazarov"
  $env:GIT_AUTHOR_EMAIL = $ruziEmail
  git commit -m "Initial project setup and configuration" --author="Ruzimuhammad Alinazarov <$ruziEmail>"
}

# Commit 2: Ruzimuhammad - Theme system and design foundation
Write-Host "Commit 2: Theme system and design foundation (Ruzimuhammad)" -ForegroundColor Green
$files2 = @(
  "contexts/ThemeContext.js", "src/theme.js", "components/SafeContainer.js", "components/FreepikIcon.js"
)
if ($Execute) {
  git checkout backup-original -- $files2
  git add $files2
  $env:GIT_AUTHOR_NAME = "Ruzimuhammad Alinazarov"
  $env:GIT_AUTHOR_EMAIL = $ruziEmail
  git commit -m "Implement theme system and reusable UI components" --author="Ruzimuhammad Alinazarov <$ruziEmail>"
}

# Commit 3: Otabek - Firebase and authentication setup
Write-Host "Commit 3: Firebase and authentication setup (Otabek)" -ForegroundColor Green
$files3 = @(
  "config/firebase.js", "services/firestore.js", "src/store.js"
)
if ($Execute) {
  git checkout backup-original -- $files3
  git add $files3
  $env:GIT_AUTHOR_NAME = "Otabek Mamadaliev"
  $env:GIT_AUTHOR_EMAIL = $otabekEmail
  git commit -m "Setup Firebase integration and Firestore database services" --author="Otabek Mamadaliev <$otabekEmail>"
}

# Commit 4: Otabek - Authentication screens and logic
Write-Host "Commit 4: Authentication screens and logic (Otabek)" -ForegroundColor Green
$files4 = @(
  "screens/LoginScreen.js", "screens/SignupScreen.js", 
  "screens/ForgotPasswordScreen.js", "screens/ResetPasswordScreen.js", 
  "screens/EmailVerificationScreen.js"
)
if ($Execute) {
  git checkout backup-original -- $files4
  git add $files4
  $env:GIT_AUTHOR_NAME = "Otabek Mamadaliev"
  $env:GIT_AUTHOR_EMAIL = $otabekEmail
  git commit -m "Implement user authentication system with email verification" --author="Otabek Mamadaliev <$otabekEmail>"
}

# Commit 5: Ruzimuhammad - Car assets and navigation structure
Write-Host "Commit 5: Car assets and main app structure (Ruzimuhammad)" -ForegroundColor Green
$files5 = @("App.js", "src/api.js", "assets")
if ($Execute) {
  git checkout backup-original -- $files5
  git add $files5
  $env:GIT_AUTHOR_NAME = "Ruzimuhammad Alinazarov"
  $env:GIT_AUTHOR_EMAIL = $ruziEmail
  git commit -m "Add navigation structure, car assets, and API integration" --author="Ruzimuhammad Alinazarov <$ruziEmail>"
}

# Commit 6: Ruzimuhammad - Home and browse car screens UI
Write-Host "Commit 6: Home and browse screens UI design (Ruzimuhammad)" -ForegroundColor Green
$files6 = @(
  "screens/HomeScreen.js", "screens/BrowseCars.js", "screens/CarDetails.js"
)
if ($Execute) {
  git checkout backup-original -- $files6
  git add $files6
  $env:GIT_AUTHOR_NAME = "Ruzimuhammad Alinazarov"
  $env:GIT_AUTHOR_EMAIL = $ruziEmail
  git commit -m "Design and implement home, browse, and car details screens" --author="Ruzimuhammad Alinazarov <$ruziEmail>"
}

# Commit 7: Otabek - Booking system backend logic
Write-Host "Commit 7: Booking system implementation (Otabek)" -ForegroundColor Green
$files7 = @(
  "screens/CreateBooking.js", "screens/EditBooking.js", "screens/MyBookings.js"
)
if ($Execute) {
  git checkout backup-original -- $files7
  git add $files7
  $env:GIT_AUTHOR_NAME = "Otabek Mamadaliev"
  $env:GIT_AUTHOR_EMAIL = $otabekEmail
  git commit -m "Implement booking creation, editing, and management system" --author="Otabek Mamadaliev <$otabekEmail>"
}

# Commit 8: Otabek - User profile and camera features
Write-Host "Commit 8: Profile management and camera integration (Otabek)" -ForegroundColor Green
$files8 = @(
  "screens/Profile.js", "screens/EditProfile.js", 
  "screens/DriverLicense.js", "screens/CameraUpload.js", "screens/CameraScreen.js"
)
if ($Execute) {
  git checkout backup-original -- $files8
  git add $files8
  $env:GIT_AUTHOR_NAME = "Otabek Mamadaliev"
  $env:GIT_AUTHOR_EMAIL = $otabekEmail
  git commit -m "Add profile management and driver license verification with camera" --author="Otabek Mamadaliev <$otabekEmail>"
}

# Commit 9: Ruzimuhammad - Additional screens and UI polish
Write-Host "Commit 9: Support screens and UI enhancements (Ruzimuhammad)" -ForegroundColor Green
$files9 = @(
  "screens/ContactSupport.js", "screens/FAQ.js", "screens/Sensors.js",
  "screens/SensorScreen.js", "screens/SettingsScreen.js",
  "screens/CreateScreen.js", "screens/DetailsScreen.js", 
  "screens/ListScreen.js", "screens/UpdateScreen.js"
)
if ($Execute) {
  git checkout backup-original -- $files9
  git add $files9
  $env:GIT_AUTHOR_NAME = "Ruzimuhammad Alinazarov"
  $env:GIT_AUTHOR_EMAIL = $ruziEmail
  git commit -m "Add support, settings, and sensor demo screens with UI polish" --author="Ruzimuhammad Alinazarov <$ruziEmail>"
}

# Commit 10: Both - Documentation and screenshots
Write-Host "Commit 10: Final documentation and screenshots (Both)" -ForegroundColor Green
$files10 = @("docs", "scripts")
if ($Execute) {
  git checkout backup-original -- $files10
  git add $files10
  $env:GIT_AUTHOR_NAME = "Otabek Mamadaliev"
  $env:GIT_AUTHOR_EMAIL = $otabekEmail
  git commit -m "Add project documentation and screenshots`n`nCo-authored-by: Ruzimuhammad Alinazarov <$ruziEmail>" --author="Otabek Mamadaliev <$otabekEmail>"
}

Write-Host ""
Write-Host "Summary of new commit history:" -ForegroundColor Cyan
if ($Execute) {
  git log --oneline --graph --all -10
  Write-Host ""
  Write-Host "To finalize and push to GitHub:" -ForegroundColor Yellow
  Write-Host "  git branch -D main" -ForegroundColor White
  Write-Host "  git branch -m new-main main" -ForegroundColor White
  Write-Host "  git push -f origin main" -ForegroundColor White
} else {
  Write-Host "Run with -Execute flag to apply changes" -ForegroundColor Yellow
}
