Write-Host "FreshShare GitHub Deployment Script"
Write-Host "===================================="

# Set strict error handling
$ErrorActionPreference = "Stop"

try {
    # Configure Git
    Write-Host "Configuring Git..."
    git config --global core.autocrlf false
    git config --global user.name "FreshShare Deploy"
    git config --global user.email "deploy@freshshare.local"
    
    # Initialize Git if needed
    if (-not (Test-Path ".git")) {
        Write-Host "Initializing Git repository..."
        git init
    }

    # Setup remote repository
    Write-Host "Setting up remote repository..."
    git remote remove origin 2>$null
    git remote add origin https://github.com/Ch3fC0d3/FreshShare1.3.git
    
    # Add all changes
    Write-Host "Adding changes..."
    git add .
    
    # Commit changes
    Write-Host "Committing changes..."
    git commit -m "Clean repository for production deployment with CSS fixes and error handling"
    
    # Create or switch to restore_branch
    Write-Host "Setting up restore_branch..."
    git checkout -b restore_branch 2>$null
    if ($LASTEXITCODE -ne 0) {
        git checkout restore_branch
    }
    
    # Push to GitHub
    Write-Host "Pushing to GitHub..."
    git push -u origin restore_branch --force
    
    Write-Host "Deployment complete!"
    Write-Host "Check GitHub Actions workflow at: https://github.com/Ch3fC0d3/FreshShare1.3/actions"
} catch {
    Write-Host "Error occurred: $_" -ForegroundColor Red
    exit 1
}
