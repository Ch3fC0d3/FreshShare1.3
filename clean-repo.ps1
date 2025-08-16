# FreshShare Repository Cleanup Script
# Simplified version for direct execution

# Show banner
Write-Host "======================================================"
Write-Host "    FreshShare Repository Cleanup Tool                "
Write-Host "    Aggressively removing unnecessary files           "
Write-Host "======================================================"

# 1. Remove backup directories
Write-Host "Cleaning backup directories..." -ForegroundColor Cyan
Remove-Item -Path "backup_files" -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Directory -Recurse | Where-Object { $_.Name -like "*_backup" -or $_.Name -like "*.bak" } | 
ForEach-Object {
    Write-Host "  Removing: $($_.FullName)" -ForegroundColor Yellow
    Remove-Item -Path $_.FullName -Recurse -Force
}

# 2. Remove backup files
Write-Host "Cleaning backup files..." -ForegroundColor Cyan
Get-ChildItem -Path . -File -Recurse | Where-Object { 
    $_.Name -like "*.bak" -or $_.Name -like "*.backup" -or $_.Name -like "*~" -or $_.Name -match '.*\.ejs\.bak$'
} | ForEach-Object {
    Write-Host "  Removing: $($_.Name)" -ForegroundColor Yellow
    Remove-Item -Path $_.FullName -Force
}

# 3. Clean development and testing files
Write-Host "Cleaning development and testing artifacts..." -ForegroundColor Cyan
$devDirs = @("test/fixtures", "mock-data", "dev-scripts", "scripts/dev", "test-data")
foreach ($dir in $devDirs) {
    if (Test-Path $dir) {
        Write-Host "  Removing: $dir" -ForegroundColor Yellow
        Remove-Item -Path $dir -Recurse -Force
    }
}

# 4. Clean build artifacts
Write-Host "Cleaning build artifacts..." -ForegroundColor Cyan
$buildDirs = @("dist", "build", "out")
foreach ($dir in $buildDirs) {
    if (Test-Path $dir) {
        Write-Host "  Removing: $dir" -ForegroundColor Yellow
        Remove-Item -Path $dir -Recurse -Force
    }
}

# 5. Remove log files
Write-Host "Cleaning logs and debug files..." -ForegroundColor Cyan
Remove-Item -Path "logs" -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -File -Recurse | Where-Object { 
    $_.Name -like "*.log" -or $_.Name -like "npm-debug.log*" 
} | ForEach-Object {
    Write-Host "  Removing: $($_.Name)" -ForegroundColor Yellow
    Remove-Item -Path $_.FullName -Force
}

# 6. Clean large binary files
Write-Host "Removing large binary files (>5MB)..." -ForegroundColor Cyan
Get-ChildItem -Path . -File -Recurse | Where-Object { $_.Length -gt 5MB } | ForEach-Object {
    Write-Host "  Removing large file: $($_.Name) ($('{0:N2}' -f ($_.Length / 1MB)) MB)" -ForegroundColor Yellow
    Remove-Item -Path $_.FullName -Force
}

# 7. FreshShare specific cleanup
Write-Host "Performing FreshShare-specific cleanup..." -ForegroundColor Cyan

# Clean backup model directories
Remove-Item -Path "freshshare_models/models/backup" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "models/backup" -Recurse -Force -ErrorAction SilentlyContinue

# Clean large image files
Write-Host "  Cleaning large image files..." -ForegroundColor Yellow
if (Test-Path "./public/images") {
    Get-ChildItem -Path "./public/images" -File -Recurse | Where-Object { $_.Length -gt 1MB } | ForEach-Object {
        Write-Host "    Removing: $($_.Name) ($('{0:N2}' -f ($_.Length / 1MB)) MB)" -ForegroundColor Yellow
        Remove-Item -Path $_.FullName -Force
    }
}

# Clean uploads but maintain structure
Write-Host "  Cleaning uploads directory..." -ForegroundColor Yellow
if (Test-Path "public/uploads") {
    Get-ChildItem -Path "public/uploads" -Recurse -File | Remove-Item -Force
    
    # Create necessary directory structure and placeholder files
    New-Item -ItemType Directory -Path "public/uploads/marketplace" -Force | Out-Null
    "" | Set-Content -Path "public/uploads/.gitkeep"
    "" | Set-Content -Path "public/uploads/marketplace/.gitkeep"
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

# Final summary
Write-Host "`n======================================================"
Write-Host "Repository Cleanup Complete!" -ForegroundColor Green
Write-Host "======================================================"

# Suggest next steps
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Initialize the Git repository:       git init"
Write-Host "2. Add your cleaned files:              git add ."
Write-Host "3. Commit the initial clean state:      git commit -m 'Initial clean commit'"
Write-Host "4. Set remote:                          git remote add origin https://github.com/Ch3fC0d3/FreshShare1.3.git"
Write-Host "5. Push to GitHub:                      git push -u origin main"
Write-Host "======================================================"
