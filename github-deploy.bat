@echo on
REM FreshShare GitHub Deployment Script
echo ===== FreshShare GitHub Deployment Script =====

REM Change to the project directory
cd /d D:\Users\gabep\Desktop\Freshshare1,4\FreshShare1.3

REM Configure Git
git config --global core.autocrlf false
git config --global user.name "FreshShare Deploy"
git config --global user.email "deploy@freshshare.local"

REM Check if remote exists and update/add accordingly
git remote -v
git remote remove origin
git remote add origin https://github.com/Ch3fC0d3/FreshShare1.3.git

REM Add all changes
echo ===== Adding all changes =====
git add .

REM Commit changes
echo ===== Committing changes =====
git commit -m "Clean repository for production deployment with CSS fixes and error handling"

REM Create and checkout restore_branch
echo ===== Setting up restore_branch =====
git checkout restore_branch 2>nul || git checkout -b restore_branch

REM Push to GitHub
echo ===== Pushing to GitHub =====
git push -u origin restore_branch --force

echo ===== Deployment complete! =====
echo Check GitHub Actions workflow at: https://github.com/Ch3fC0d3/FreshShare1.3/actions

pause
