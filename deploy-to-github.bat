@echo off
echo FreshShare GitHub Deployment Script
echo ====================================

cd /d D:\Users\gabep\Desktop\Freshshare1,4\FreshShare1.3

REM Configure Git
git config --global core.sshCommand "ssh -i %~dp0freshshare_deploy_key"

echo Pulling latest changes from GitHub...
git pull origin restore_branch

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
git push origin restore_branch

echo Done!
pause
