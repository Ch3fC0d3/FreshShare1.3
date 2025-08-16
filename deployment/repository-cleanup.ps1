# FreshShare Repository Cleanup Script
# This script aggressively removes unnecessary files before syncing to GitHub

# Show intro banner
Write-Host "======================================================"
Write-Host "    FreshShare Repository Cleanup Tool"
Write-Host "    Aggressively removing unnecessary files"
Write-Host "======================================================"

# Function to display progress and results
function Write-CleanupStep {
    param (
        [string]$StepName,
        [int]$FilesRemoved
    )
    Write-Host "[$StepName] " -NoNewline -ForegroundColor Cyan
    if ($FilesRemoved -gt 0) {
        Write-Host "Removed $FilesRemoved items" -ForegroundColor Yellow
    } else {
        Write-Host "No items found to remove" -ForegroundColor Green
    }
}

# Create .gitignore if it doesn't exist
$gitignorePath = ".\.gitignore"
if (-not (Test-Path $gitignorePath)) {
    Write-Host "Creating comprehensive .gitignore file..." -ForegroundColor Cyan
    @"
# Node modules and dependencies
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log

# Environment variables and secrets
.env
.env.*
*.env.local
*.env.development
*.env.test
*.env.production

# IDE and editor files
.idea/
.vscode/
*.swp
*.swo
.DS_Store

# Build and distribution directories
dist/
build/
out/
public/uploads/*
!public/uploads/.gitkeep

# Logs and debugging
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing and coverage
coverage/
.nyc_output/

# Backup and temporary files
*.bak
*.tmp
*.temp
backup_files/
temp/
.cache/

# Database files
*.sqlite
*.sqlite3
*.db

# Documentation drafts
docs/drafts/
"@ | Set-Content -Path $gitignorePath
    Write-Host "Created .gitignore file" -ForegroundColor Green
}

# 1. Remove backup directories
Write-Host "`nCleaning backup directories and files..." -ForegroundColor Magenta
$count = 0
if (Test-Path "backup_files") { 
    Remove-Item -Path "backup_files" -Recurse -Force
    $count++
}

# Find and remove all backup directories
Get-ChildItem -Path . -Directory -Recurse | Where-Object { 
    $_.Name -like "*_backup" -or $_.Name -like "*.bak" 
} | ForEach-Object {
    Remove-Item -Path $_.FullName -Recurse -Force
    $count++
}
Write-CleanupStep "Backup Directories" $count

# 2. Remove backup files
$count = 0
Get-ChildItem -Path . -File -Recurse | Where-Object { 
    $_.Name -like "*.bak" -or 
    $_.Name -like "*.backup" -or 
    $_.Name -like "*~" -or
    $_.Name -match '.*\.js\.bak$' -or
    $_.Name -match '.*\.ejs\.bak$'
} | ForEach-Object {
    Remove-Item -Path $_.FullName -Force
    $count++
}
Write-CleanupStep "Backup Files" $count

# 3. Clean development and testing files
Write-Host "`nCleaning development and testing artifacts..." -ForegroundColor Magenta
$count = 0
$devDirs = @("test/fixtures", "mock-data", "dev-scripts", "scripts/dev", "test-data")
foreach ($dir in $devDirs) {
    if (Test-Path $dir) {
        Remove-Item -Path $dir -Recurse -Force
        $count++
    }
}
Write-CleanupStep "Development Artifacts" $count

# 4. Clean build artifacts
Write-Host "`nCleaning build artifacts..." -ForegroundColor Magenta
$count = 0
$buildDirs = @("dist", "build", "out")
foreach ($dir in $buildDirs) {
    if (Test-Path $dir) {
        Remove-Item -Path $dir -Recurse -Force
        $count++
    }
}

# Find and remove compiled min files (unless they're the only version)
Get-ChildItem -Path . -Filter "*.min.js" -Recurse | ForEach-Object {
    $baseName = $_.Name -replace "\.min\.js$", ".js"
    $basePath = Join-Path $_.Directory.FullName $baseName
    if (Test-Path $basePath) {
        Remove-Item -Path $_.FullName -Force
        $count++
    }
}
Get-ChildItem -Path . -Filter "*.min.css" -Recurse | ForEach-Object {
    $baseName = $_.Name -replace "\.min\.css$", ".css"
    $basePath = Join-Path $_.Directory.FullName $baseName
    if (Test-Path $basePath) {
        Remove-Item -Path $_.FullName -Force
        $count++
    }
}
Write-CleanupStep "Build Artifacts" $count

# 5. Remove log files
Write-Host "`nCleaning logs and debug files..." -ForegroundColor Magenta
$count = 0
if (Test-Path "logs") { 
    Remove-Item -Path "logs" -Recurse -Force
    $count++
}
Get-ChildItem -Path . -File -Recurse | Where-Object { 
    $_.Name -like "*.log" -or 
    $_.Name -like "npm-debug.log*" -or
    $_.Name -like "yarn-debug.log*" -or
    $_.Name -like "yarn-error.log*"
} | ForEach-Object {
    Remove-Item -Path $_.FullName -Force
    $count++
}
Write-CleanupStep "Log Files" $count

# 6. Clean large binary files
Write-Host "`nRemoving large binary files (>10MB)..." -ForegroundColor Magenta
$count = 0
Get-ChildItem -Path . -File -Recurse | Where-Object { $_.Length -gt 10MB } | ForEach-Object {
    Write-Host "  Removing large file: $($_.FullName) ($('{0:N2}' -f ($_.Length / 1MB)) MB)" -ForegroundColor Yellow
    Remove-Item -Path $_.FullName -Force
    $count++
}
Write-CleanupStep "Large Binary Files" $count

# 7. FreshShare specific cleanup
Write-Host "`nPerforming FreshShare-specific cleanup..." -ForegroundColor Magenta

# Clean backup model directories
$count = 0
if (Test-Path "freshshare_models/models/backup") { 
    Remove-Item -Path "freshshare_models/models/backup" -Recurse -Force
    $count++
}
if (Test-Path "models/backup") { 
    Remove-Item -Path "models/backup" -Recurse -Force
    $count++
}

# Clean unused image files
$imageCount = 0
Get-ChildItem -Path "./public/images" -File -Recurse | Where-Object { $_.Length -gt 1MB } | ForEach-Object {
    Remove-Item -Path $_.FullName -Force
    $imageCount++
}
$count += $imageCount
Write-Host "  Removed $imageCount large image files" -ForegroundColor Yellow

# Clean uploads but maintain structure
if (Test-Path "public/uploads") {
    Get-ChildItem -Path "public/uploads" -Recurse | Remove-Item -Force -Recurse
    $count++
    
    # Create necessary directory structure and placeholder files
    New-Item -ItemType Directory -Path "public/uploads/marketplace" -Force | Out-Null
    "" | Set-Content -Path "public/uploads/.gitkeep"
    "" | Set-Content -Path "public/uploads/marketplace/.gitkeep"
}
Write-CleanupStep "FreshShare Specific Items" $count

# Calculate repository size before and after
$folderSize = {
    param($path)
    $size = 0
    Get-ChildItem -Path $path -Recurse -Force -ErrorAction SilentlyContinue | 
    Where-Object { -not $_.PSIsContainer } |
    ForEach-Object { $size += $_.Length }
    return $size
}

# Final summary
Write-Host "`n======================================================"
Write-Host "Repository Cleanup Complete!" -ForegroundColor Green
Write-Host "======================================================"

# Suggest next steps
Write-Host "`nNext steps:" -ForegroundColor Magenta
Write-Host "1. Verify that your application still functions correctly"
Write-Host "2. Check git status to see cleaned files: git status"
Write-Host "3. Add and commit the changes: git add . && git commit -m 'Clean repository'"
Write-Host "4. Push to your repository: git push origin your-branch"
