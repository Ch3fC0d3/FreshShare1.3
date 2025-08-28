@echo on
REM FreshShare GitHub Deployment Script with Debug
echo ===== FreshShare GitHub Deployment Script =====

REM Change to the project directory
cd /d D:\Users\gabep\Desktop\Freshshare1,4\FreshShare1.3

REM Show environment info
echo Current directory:
cd
echo.

REM Configure Git
echo Configuring Git...
git config --global core.autocrlf false
git config --global user.name "FreshShare Deploy"
git config --global user.email "deploy@freshshare.local"

REM Check if Git is initialized
echo Checking Git initialization...
if not exist .git (
    echo Initializing Git repository...
    git init
)

REM Show remote status
echo Current remotes:
git remote -v
echo.

REM Set up remote
echo Setting up GitHub remote...
git remote remove origin 2>nul
git remote add origin https://github.com/Ch3fC0d3/FreshShare1.3.git
echo Updated remotes:
git remote -v
echo.

REM Show status
echo Current Git status:
git status
echo.

REM Add files
echo Adding all files...
git add .
echo.

REM Commit changes
echo Committing changes...
git commit -m "Clean repository for production deployment with CSS fixes and error handling"
echo.

REM Handle branch creation/checkout
echo Setting up restore_branch...
git branch
git checkout -b restore_branch 2>nul || git checkout restore_branch
echo Current branch:
git branch
echo.

REM Push to GitHub
echo Pushing to GitHub...
git push -u origin restore_branch --force
echo.

echo ===== Deployment complete! =====
echo Check GitHub Actions workflow at: https://github.com/Ch3fC0d3/FreshShare1.3/actions
echo.
pause
