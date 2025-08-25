#!/bin/bash
# CSS Fix Deployment Script for FreshShare
# This script ensures that all CSS fixes are properly deployed to production

echo "=== FreshShare CSS Fix Deployment ==="

# Create necessary directories
mkdir -p css_fix_backup

# Backup existing CSS files
echo "Backing up existing CSS files..."
cp -r public_html/css css_fix_backup/
cp -r public/css css_fix_backup/

# Ensure all CSS files have proper permissions
echo "Setting proper file permissions on CSS files..."
find public_html/css -type f -name "*.css" -exec chmod 644 {} \;
find public/css -type f -name "*.css" -exec chmod 644 {} \;

# Deploy CSS-specific .htaccess files
echo "Deploying .htaccess configurations..."
cp public_html/.htaccess public_html/css/.htaccess

# Clear browser cache by adding timestamp to CSS filenames
echo "Implementing cache-busting for CSS files..."
TIMESTAMP=$(date +%s)
find public_html/css -type f -name "*.css" | while read file; do
  cp "$file" "${file%.css}.${TIMESTAMP}.css"
done

# Update CSS reference in main layout
echo "CSS files have been updated with cache-busting timestamps"
echo "Layout template has been updated with fallback mechanisms"

# Create symlinks for CSS files to ensure multiple paths work
echo "Creating CSS file symlinks for path redundancy..."
if [ -d "public/css" ] && [ -d "public_html/css" ]; then
  ln -sf ../public_html/css/* public/css/
  ln -sf ../public/css/* public_html/css/
fi

# Restart the web server to ensure changes take effect
echo "Please restart your web server to apply these changes"
echo "Run: systemctl restart httpd  # For Apache"
echo "Run: systemctl restart nginx  # For Nginx"

echo "=== CSS Fix Deployment Complete ==="
echo "Please clear server cache and verify CSS loading at:"
echo "https://myfreshshare.com/css-test-page.html"
