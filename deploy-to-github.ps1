# FreshShare GitHub Deployment Script
Write-Host "FreshShare GitHub Deployment Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Change to the project directory
Set-Location "D:\Users\gabep\Desktop\Freshshare1,4\FreshShare1.3"

# Configure Git
Write-Host "Configuring Git..." -ForegroundColor Yellow
git config --global core.autocrlf false
git config --global user.name "FreshShare Deploy"
git config --global user.email "deploy@freshshare.local"

# Check if Git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
}

# Check remote repository
$remotes = git remote -v
if ($remotes -match "origin") {
    Write-Host "Updating remote repository URL..." -ForegroundColor Yellow
    git remote set-url origin "https://github.com/Ch3fC0d3/FreshShare1.3.git"
} else {
    Write-Host "Adding remote repository..." -ForegroundColor Yellow
    git remote add origin "https://github.com/Ch3fC0d3/FreshShare1.3.git"
}

Write-Host "Current Git status:" -ForegroundColor Yellow
git status

# Stage all changes
Write-Host "Adding all changes..." -ForegroundColor Yellow
git add .

# Commit changes
$commitMessage = "Clean repository for production deployment with CSS fixes and error handling improvements"
Write-Host "Committing with message: $commitMessage" -ForegroundColor Yellow
git commit -m $commitMessage

# Handle branch
try {
    # Try to create the branch
    Write-Host "Creating restore_branch..." -ForegroundColor Yellow
    git branch restore_branch 2>&1 | Out-Null
} catch {
    # Branch likely exists, continue
    Write-Host "Branch may already exist, continuing..." -ForegroundColor Yellow
}

# Switch to the branch
Write-Host "Checking out restore_branch..." -ForegroundColor Yellow
git checkout restore_branch

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin restore_branch --force

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Check GitHub Actions workflow at: https://github.com/Ch3fC0d3/FreshShare1.3/actions" -ForegroundColor Green

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
