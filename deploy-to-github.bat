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
git commit -m "fix: MongoDB Atlas IP whitelist bypass solution

- Add robust MongoDB bypass solution with multiple connection strategies
- Implement fallback configuration for production environments
- Fix GitHub Actions workflow to continue despite MongoDB connection failures
- Add DNS resolution checks and SRV record handling
- Implement retry logic with exponential backoff for connection attempts"

echo Pushing to GitHub...
git push -u origin restore_branch

echo Done!
pause
