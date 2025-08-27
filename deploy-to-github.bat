@echo off
echo FreshShare GitHub Deployment Script
echo ====================================

cd /d D:\Users\gabep\Desktop\Freshshare1,4\FreshShare1.3

echo Pulling latest changes from GitHub...
git pull origin restore_branch

echo Adding modified files...
git add .

echo Adding resolved merge conflict files...
git add views/pages/create-group.ejs
git add views/pages/dashboard.ejs
git add views/pages/group-details.ejs
git add views/pages/groups.ejs
git add views/pages/index.ejs
git add views/pages/login.ejs
git add views/pages/signup.ejs

echo Committing changes...
git commit -m "Resolve merge conflicts by consistently using <%= baseUrl %> for URLs and paths"

echo Pushing to GitHub...
git push origin restore_branch

echo Done!
pause
