# PowerShell script for deploying CSS fixes
# Run this script to deploy the CSS fixes to production

Write-Host "=== FreshShare CSS Fix Deployment ===" -ForegroundColor Green

# Create backup directory
$backupDir = "css_fix_backup"
if (-not (Test-Path $backupDir)) {
    New-Item -Path $backupDir -ItemType Directory
    Write-Host "Created backup directory: $backupDir" -ForegroundColor Yellow
}

# Backup existing CSS files
Write-Host "Backing up existing CSS files..." -ForegroundColor Yellow
if (Test-Path "public_html\css") {
    Copy-Item -Path "public_html\css" -Destination "$backupDir\public_html_css" -Recurse -Force
    Write-Host "  ✓ public_html\css backed up" -ForegroundColor Green
}
if (Test-Path "public\css") {
    Copy-Item -Path "public\css" -Destination "$backupDir\public_css" -Recurse -Force
    Write-Host "  ✓ public\css backed up" -ForegroundColor Green
}

# Create deployment package directory
$deploymentDir = "deployment-package\css-fix"
if (-not (Test-Path $deploymentDir)) {
    New-Item -Path $deploymentDir -ItemType Directory -Force
    Write-Host "Created deployment package directory: $deploymentDir" -ForegroundColor Yellow
}

# Copy modified files to deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow

# CSS files
if (Test-Path "public_html\css") {
    New-Item -Path "$deploymentDir\public_html\css" -ItemType Directory -Force
    Copy-Item -Path "public_html\css\*" -Destination "$deploymentDir\public_html\css" -Recurse -Force
    Write-Host "  ✓ CSS files copied" -ForegroundColor Green
}

# JavaScript files
New-Item -Path "$deploymentDir\public_html\js" -ItemType Directory -Force
Copy-Item -Path "public_html\js\css-fix.js" -Destination "$deploymentDir\public_html\js" -Force
Write-Host "  ✓ CSS-fix.js copied" -ForegroundColor Green

# HTML test files
Copy-Item -Path "public_html\css-test-page.html" -Destination "$deploymentDir\public_html" -Force
Copy-Item -Path "public_html\css-test.html" -Destination "$deploymentDir\public_html" -Force
Copy-Item -Path "public_html\css-diagnostic.js" -Destination "$deploymentDir\public_html" -Force
Write-Host "  ✓ CSS test files copied" -ForegroundColor Green

# Layout template
New-Item -Path "$deploymentDir\views\layouts" -ItemType Directory -Force
Copy-Item -Path "views\layouts\layout.ejs" -Destination "$deploymentDir\views\layouts" -Force
Write-Host "  ✓ Layout template copied" -ForegroundColor Green

# .htaccess files
Copy-Item -Path ".htaccess" -Destination "$deploymentDir" -Force
Copy-Item -Path "public_html\.htaccess" -Destination "$deploymentDir\public_html" -Force
Write-Host "  ✓ .htaccess files copied" -ForegroundColor Green

# Documentation
New-Item -Path "$deploymentDir\docs" -ItemType Directory -Force
Copy-Item -Path "docs\CSS-FIX-GUIDE.md" -Destination "$deploymentDir\docs" -Force
Write-Host "  ✓ Documentation copied" -ForegroundColor Green

# Create README with deployment instructions
$readme = @"
# CSS Fix Deployment Package

This package contains all the files needed to fix CSS loading issues in production.

## Files included:
- Layout template with CSS fixes: views/layouts/layout.ejs
- CSS fix JavaScript: public_html/js/css-fix.js
- CSS test pages: public_html/css-test-page.html, public_html/css-test.html
- CSS diagnostic script: public_html/css-diagnostic.js
- Apache configurations: .htaccess, public_html/.htaccess
- Documentation: docs/CSS-FIX-GUIDE.md

## Deployment Instructions:

1. Upload all files to their respective locations on the server
2. Ensure file permissions are correct (644 for files, 755 for directories)
3. Clear browser cache and server cache
4. Restart Apache/Nginx if needed
5. Visit /css-test-page.html to verify CSS loading

For complete documentation, see docs/CSS-FIX-GUIDE.md
"@

Set-Content -Path "$deploymentDir\README.md" -Value $readme
Write-Host "  ✓ Deployment README created" -ForegroundColor Green

# Create a ZIP file for easy upload
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$zipPath = "deployment-package\css-fix-deployment-$timestamp.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory("$deploymentDir", $zipPath)

Write-Host "✅ Deployment package created: $zipPath" -ForegroundColor Green
Write-Host ""
Write-Host "To deploy:" -ForegroundColor Cyan
Write-Host "1. Upload the ZIP file to your server" -ForegroundColor Cyan
Write-Host "2. Unzip the files to their respective locations" -ForegroundColor Cyan
Write-Host "3. After deployment, test at: https://myfreshshare.com/css-test-page.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "=== CSS Fix Deployment Package Ready ===" -ForegroundColor Green
