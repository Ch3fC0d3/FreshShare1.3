@echo off
echo FreshShare GitHub Deployment Script
echo ====================================

cd /d D:\Users\gabep\Desktop\Freshshare1,4\FreshShare1.3

REM Configure Git
git config --global core.sshCommand "ssh -i %~dp0freshshare_deploy_key"
git config --global core.autocrlf false
git config --global user.name "FreshShare Deploy"
git config --global user.email "deploy@freshshare.local"

REM Initialize repository if needed
if not exist .git (
    git init
    git remote add origin https://github.com/Ch3fC0d3/FreshShare1.3.git
)

REM Create and switch to restore_branch
git checkout -b restore_branch 2>nul || git checkout restore_branch

echo Adding modified files...
git add .

echo Committing changes...
git commit -m "feat: improve database error handling and monitoring

- Add exponential backoff for MongoDB reconnection
- Implement custom 503 error page for database issues
- Add comprehensive health check endpoint
- Improve error logging and state tracking
- Add content negotiation for API/HTML responses"

echo Pushing to GitHub...
git push -u origin restore_branch

echo Done!
pause
