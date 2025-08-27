@echo off
echo FreshShare GitHub Deployment Script
echo ====================================

cd /d D:\Users\gabep\Desktop\Freshshare1,4\FreshShare1.3

echo Pulling latest changes from GitHub...
git pull origin restore_branch

echo Adding modified files...
git add .
git add server.js
git add public/js/css-fix.js
git add public/js/base-url-fix.js

echo Committing changes...
git commit -m "Fix CSP headers, improve CSS loading, and fix link functionality for production"

echo Pushing to GitHub...
git push origin restore_branch

echo Done!
pause
