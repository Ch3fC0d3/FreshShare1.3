@echo off
REM CSS Fix Manual Deployment Package Creator
REM This script creates a deployment package for the CSS fixes

echo === FreshShare CSS Fix Deployment Package Creator ===

REM Create directories
mkdir "css-fix-package"
mkdir "css-fix-package\public_html\js"
mkdir "css-fix-package\public_html\css"
mkdir "css-fix-package\views\layouts"
mkdir "css-fix-package\docs"

echo Creating deployment package...

REM Copy CSS fix script
copy "public_html\js\css-fix.js" "css-fix-package\public_html\js\" /Y
echo - CSS fix script copied

REM Copy layout template
copy "views\layouts\layout.ejs" "css-fix-package\views\layouts\" /Y
echo - Layout template copied

REM Copy .htaccess files
copy ".htaccess" "css-fix-package\" /Y
if exist "public_html\.htaccess" (
  copy "public_html\.htaccess" "css-fix-package\public_html\" /Y
  echo - .htaccess files copied
)

REM Copy test and diagnostic files
copy "public_html\css-test-page.html" "css-fix-package\public_html\" /Y
copy "public_html\css-diagnostic.js" "css-fix-package\public_html\" /Y
copy "public_html\css-test.html" "css-fix-package\public_html\" /Y
echo - Diagnostic and test files copied

REM Copy documentation
copy "docs\CSS-FIX-GUIDE.md" "css-fix-package\docs\" /Y
copy "deployment\CSS-DEPLOYMENT-GUIDE.md" "css-fix-package\" /Y
echo - Documentation copied

echo Deployment package created successfully!
echo Files are in the "css-fix-package" directory
echo Please upload these files to their respective locations on the production server

pause
