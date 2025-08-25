# FreshShare Repository Aggressive Cleanup Script
# Enhanced version for production deployment preparation

# Show banner
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "    FreshShare Repository AGGRESSIVE Cleanup Tool     " -ForegroundColor Cyan
Write-Host "    Removing all unnecessary files for production    " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# Create backup directory
$backupDir = "cleanup-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
Write-Host "Created backup directory: $backupDir" -ForegroundColor Green

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
    $_.Name -like "*.log" -or $_.Name -like "npm-debug.log*" -or $_.Name -like "debug*.txt" -or
    $_.Name -like "*error_log*" -or $_.Name -like "*access_log*" -or $_.Extension -eq ".pid"
} | ForEach-Object {
    Write-Host "  Removing log file: $($_.FullName)" -ForegroundColor Yellow
    Remove-Item -Path $_.FullName -Force
}

# 6. Clean large binary files
Write-Host "Removing large binary files (>5MB)..." -ForegroundColor Cyan
Get-ChildItem -Path . -File -Recurse | Where-Object { $_.Length -gt 5MB } | ForEach-Object {
    Write-Host "  Removing large file: $($_.Name) ($('{0:N2}' -f ($_.Length / 1MB)) MB)" -ForegroundColor Yellow
    Remove-Item -Path $_.FullName -Force
}

# 7. FreshShare specific aggressive cleanup
Write-Host "Performing FreshShare-specific aggressive cleanup..." -ForegroundColor Cyan

# Function to backup before removing
function Backup-AndRemove {
    param (
        [string]$Path,
        [string]$Description = ""
    )
    
    if (Test-Path $Path) {
        # Create target directory in backup
        $relativePath = $Path.Replace("$PSScriptRoot\", "")
        $targetPath = Join-Path -Path $backupDir -ChildPath $relativePath
        $targetDir = Split-Path -Path $targetPath -Parent
        
        if (-not (Test-Path $targetDir)) {
            New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
        }
        
        # Copy to backup if it's a file
        if (Test-Path -Path $Path -PathType Leaf) {
            Copy-Item -Path $Path -Destination $targetPath -Force
            Write-Host "  Backed up: $Path" -ForegroundColor DarkGray
        } else {
            # For directories, use robocopy
            if (-not (Test-Path $targetPath)) {
                New-Item -Path $targetPath -ItemType Directory -Force | Out-Null
            }
            robocopy $Path $targetPath /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
            Write-Host "  Backed up directory: $Path" -ForegroundColor DarkGray
        }
        
        # Remove the original
        if ($Description) {
            Write-Host "  Removing ${Description}: $Path" -ForegroundColor Yellow
        } else {
            Write-Host "  Removing: $Path" -ForegroundColor Yellow
        }
        Remove-Item -Path $Path -Recurse -Force
        return $true
    }
    return $false
}

# Clean backup model directories
Backup-AndRemove -Path "freshshare_models/models/backup" -Description "backup models"
Backup-AndRemove -Path "models/backup" -Description "backup models"

# Remove entire cleanup-backup directory (it's redundant with our new backup)
Backup-AndRemove -Path "cleanup-backup" -Description "old backup directory"

# Remove deployment packages directory
Backup-AndRemove -Path "deployment-packages" -Description "deployment packages"

# Remove deployment-package directory (empty or redundant)
Backup-AndRemove -Path "deployment-package" -Description "redundant deployment package"

# Clean large image files
Write-Host "  Cleaning large image files..." -ForegroundColor Yellow
if (Test-Path "./public/images") {
    Get-ChildItem -Path "./public/images" -File -Recurse | Where-Object { $_.Length -gt 500KB } | ForEach-Object {
        $imagePath = $_.FullName
        Backup-AndRemove -Path $imagePath -Description "large image ($('{0:N2}' -f ($_.Length / 1KB)) KB)"
    }
}

# Clean uploads but maintain structure
Write-Host "  Cleaning uploads directory..." -ForegroundColor Yellow
if (Test-Path "public/uploads") {
    # Backup existing files
    Get-ChildItem -Path "public/uploads" -Recurse -File | ForEach-Object {
        $uploadPath = $_.FullName
        Backup-AndRemove -Path $uploadPath -Description "upload file"
    }
    
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

# 8. Remove redundant documentation files
Write-Host "Removing redundant documentation files..." -ForegroundColor Cyan
$redundantDocs = @(
    "503-NODEJS-SOLUTION-SUMMARY.md", 
    "503-error-fix.md",
    "503-fix-steps.md",
    "CPANEL_SETUP_INSTRUCTIONS.md",
    "CSS_CONSOLIDATION.md",
    "DEPLOYMENT_CHECKLIST.md", 
    "DEPLOYMENT_STEPS.md",
    "GITHUB_SECRETS_SETUP.md",
    "GITHUB_WORKFLOW_USAGE.md",
    "NODEJS_IMPLEMENTATION_GUIDE.md",
    "NODEJS_PRODUCTION_SETUP.md",
    "NODEJS_SOLUTION_SUMMARY.md",
    "PRODUCTION_FIX_GUIDE.md",
    "PRODUCTION_SETUP_GUIDE.md",
    "cpanel-nodejs-setup.md",
    "deployment-trigger.md",
    "htaccess-fix.txt",
    "mongodb-atlas-setup.md"
)

foreach ($doc in $redundantDocs) {
    $docPath = $doc
    if (Test-Path $docPath) {
        Backup-AndRemove -Path $docPath -Description "redundant documentation"
    }
    # Also check in docs directory
    $docInDocsDir = Join-Path -Path "docs" -ChildPath $doc
    if (Test-Path $docInDocsDir) {
        Backup-AndRemove -Path $docInDocsDir -Description "redundant documentation"
    }
}

# 9. Remove test and development scripts
Write-Host "Removing test and development scripts..." -ForegroundColor Cyan
$testScripts = @(
    "connection-test.js",
    "cpanel-connection-test.js",
    "cpanel-test.sh",
    "test-connection.js",
    "test-proxy-connection.js",
    "test-server.js",
    "simple-test.js",
    "config-temp.js",
    "deploy-nodejs-production.sh",
    "deploy-to-production.js",
    "deployment-preparation.js",
    "temp.env",
    "myfrovov.coreftp",
    "Secure myfrovov.coreftp",
    "commit-message.txt"
)

foreach ($script in $testScripts) {
    $scriptPath = $script
    if (Test-Path $scriptPath) {
        Backup-AndRemove -Path $scriptPath -Description "test/development script"
    }
}

# 10. Clean Node.js package artifacts
Write-Host "Cleaning Node.js package artifacts..." -ForegroundColor Cyan

# Remove node_modules except in root (for future operation needs)
$nodeModulesPaths = Get-ChildItem -Path . -Directory -Recurse -Filter "node_modules" | 
                   Where-Object { $_.FullName -ne (Join-Path -Path $PSScriptRoot -ChildPath "node_modules") }

foreach ($dir in $nodeModulesPaths) {
    Write-Host "  Removing non-root node_modules: $($dir.FullName)" -ForegroundColor Yellow
    Remove-Item -Path $dir.FullName -Recurse -Force -ErrorAction SilentlyContinue
}

# Remove all package-lock.json files except the root one
$rootPackageLock = Join-Path -Path $PSScriptRoot -ChildPath "package-lock.json"
$packageLocks = Get-ChildItem -Path . -File -Recurse -Filter "package-lock.json" |
                Where-Object { $_.FullName -ne $rootPackageLock }

foreach ($file in $packageLocks) {
    Write-Host "  Removing duplicate package-lock.json: $($file.FullName)" -ForegroundColor Yellow
    Remove-Item -Path $file.FullName -Force
}

# Final summary
Write-Host "`n======================================================"
Write-Host "Aggressive Repository Cleanup Complete!" -ForegroundColor Green
Write-Host "All removed files backed up to: $backupDir" -ForegroundColor Green
Write-Host "======================================================"

# Suggest next steps
Write-Host "`nNext steps for deployment:" -ForegroundColor Cyan
Write-Host "1. Review the cleaned repository" -ForegroundColor White
Write-Host "2. Commit the cleaned state:            git add ." -ForegroundColor White
Write-Host "3. Commit with message:                 git commit -m 'Clean repository for production'" -ForegroundColor White
Write-Host "4. Push to deployment branch:           git push origin restore_branch" -ForegroundColor White
Write-Host "5. Monitor GitHub Actions deployment" -ForegroundColor White
Write-Host "======================================================"
