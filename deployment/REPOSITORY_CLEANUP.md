# Repository Cleanup Guide

Before pushing to GitHub, it's important to clean up your repository by removing unnecessary files. This guide provides a systematic approach to aggressively clean your codebase before syncing.

## 1. Create a .gitignore File

First, create a comprehensive `.gitignore` file at the root of your repository:

```bash
# Node modules and dependencies
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log
package-lock.json

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
```

## 2. Identify and Remove Backup Files

Aggressively remove backup directories and files:

```bash
# Remove backup directories
rm -rf backup_files/
rm -rf *_backup/
rm -rf *.bak/

# Remove backup files
find . -name "*.bak" -type f -delete
find . -name "*.backup" -type f -delete
find . -name "*~" -type f -delete
```

## 3. Clean Development and Testing Files

Remove development and testing artifacts:

```bash
# Remove test data
rm -rf test/fixtures/
rm -rf mock-data/

# Remove development-only scripts
rm -rf dev-scripts/
rm -rf scripts/dev/
```

## 4. Clean Build Artifacts

Remove compiled files and build directories:

```bash
# Remove build directories
rm -rf dist/
rm -rf build/
rm -rf out/

# Remove compiled files
find . -name "*.min.js" -type f -delete
find . -name "*.min.css" -type f -delete
```

## 5. Remove Specific Unnecessary Files

### Logs and Debug Files
```bash
# Remove log files
rm -rf logs/
find . -name "*.log" -type f -delete
find . -name "npm-debug.log*" -type f -delete
```

### Large Binary Files
```bash
# Remove large binaries that shouldn't be in git
find . -size +10M -delete
```

### Specific FreshShare Cleanup

For FreshShare specifically, consider removing these files/directories:

```bash
# Remove duplicate or unnecessary files
rm -rf freshshare_models/models/backup/
rm -rf models/backup/

# Remove large image files not needed for the deployment
find ./public/images -size +1M -delete

# Clean temporary uploads
rm -rf public/uploads/*
mkdir -p public/uploads/marketplace
touch public/uploads/.gitkeep
touch public/uploads/marketplace/.gitkeep
```

## 6. PowerShell Script for Windows

Here's a PowerShell script you can use to perform the cleanup on Windows:

```powershell
# Create repository-cleanup.ps1

# Remove backup files
Write-Host "Removing backup files..."
Remove-Item -Path "backup_files" -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Filter "*.bak" -Recurse | Remove-Item -Force
Get-ChildItem -Path . -Filter "*.backup" -Recurse | Remove-Item -Force

# Remove development/test artifacts
Write-Host "Removing development and test artifacts..."
Remove-Item -Path "test/fixtures" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "mock-data" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "dev-scripts" -Recurse -Force -ErrorAction SilentlyContinue

# Remove build artifacts
Write-Host "Removing build artifacts..."
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "out" -Recurse -Force -ErrorAction SilentlyContinue

# Remove log files
Write-Host "Removing logs..."
Remove-Item -Path "logs" -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Filter "*.log" -Recurse | Remove-Item -Force

# FreshShare specific cleanup
Write-Host "FreshShare specific cleanup..."

# Clean backup and duplicate directories
Remove-Item -Path "freshshare_models/models/backup" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "models/backup" -Recurse -Force -ErrorAction SilentlyContinue

# Clean large images (>1MB)
Get-ChildItem -Path "./public/images" -File -Recurse | Where-Object { $_.Length -gt 1MB } | Remove-Item -Force

# Clean uploads but maintain structure
Remove-Item -Path "public/uploads/*" -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path "public/uploads/marketplace" -Force | Out-Null
New-Item -ItemType File -Path "public/uploads/.gitkeep" -Force | Out-Null
New-Item -ItemType File -Path "public/uploads/marketplace/.gitkeep" -Force | Out-Null

Write-Host "Repository cleanup complete!"
```

## 7. Files to Keep

Despite the aggressive cleanup, make sure to **keep** these essential files:

1. Configuration files (non-sensitive ones):
   - `.gitignore`
   - `package.json`
   - `tsconfig.json`
   - Configuration templates (without secrets)

2. Documentation:
   - `README.md`
   - `LICENSE`
   - Documentation in `/docs` that isn't drafts
   - Deployment guides

3. Source code:
   - All application source code
   - Core models
   - Controllers
   - Routes
   - Views
   - Public assets (except large unused ones)

## 8. Final Check Before Commit

After cleaning up, perform these final checks:

1. **Review staged changes**:
   ```bash
   git status
   ```

2. **Check the size of your repository**:
   ```bash
   du -sh .
   ```

3. **Look for any remaining large files**:
   ```bash
   find . -type f -size +1M | sort -nr -k 5 | head -10
   ```

4. **Make sure your application still works** by running tests or a local server before committing the changes.

By following these steps, you'll significantly reduce the size of your repository before pushing to GitHub, making clone operations faster and reducing storage requirements.
