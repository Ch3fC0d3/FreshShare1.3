# FreshShare CSS Deployment Guide

This guide provides step-by-step instructions for deploying the CSS fixes to your production environment.

## Required Files

The following files need to be uploaded to your production server:

### 1. CSS Fix Script
- `public_html/js/css-fix.js` - Automatically detects and fixes CSS loading issues

### 2. Updated Layout Template
- `views/layouts/layout.ejs` - Contains cache-busting, inline critical CSS, and fallback mechanisms

### 3. Apache Configuration Files
- `.htaccess` - Updated Content Security Policy
- `public_html/.htaccess` - CSS-specific MIME types, caching, and compression

### 4. Diagnostic Tools
- `public_html/css-test-page.html` - Test page for CSS loading
- `public_html/css-diagnostic.js` - Detailed CSS diagnostics

## Deployment Steps

### Step 1: Backup Existing Files
```bash
# SSH into your server
ssh user@myfreshshare.com

# Create backup directory
mkdir -p css_fix_backup

# Backup important files
cp views/layouts/layout.ejs css_fix_backup/
cp .htaccess css_fix_backup/
cp public_html/.htaccess css_fix_backup/ 2>/dev/null || echo "No public_html/.htaccess found"
```

### Step 2: Upload New Files

Using FTP, SFTP, or cPanel File Manager, upload the following files to their respective locations:

- Upload `js/css-fix.js` to `/public_html/js/`
- Upload `views/layouts/layout.ejs` to `/views/layouts/`
- Upload `.htaccess` to the root directory
- Upload `public_html/.htaccess` to the `/public_html/` directory
- Upload `css-test-page.html` and `css-diagnostic.js` to `/public_html/`

### Step 3: Set Proper File Permissions

```bash
# Set proper permissions
find public_html/css -type f -name "*.css" -exec chmod 644 {} \;
chmod 644 public_html/js/css-fix.js
chmod 644 views/layouts/layout.ejs
chmod 644 .htaccess
chmod 644 public_html/.htaccess
chmod 644 public_html/css-test-page.html
chmod 644 public_html/css-diagnostic.js
```

### Step 4: Clear Caches

```bash
# If using Apache, restart to clear cache
sudo systemctl restart apache2

# If using Nginx
sudo systemctl restart nginx

# If using a CDN, purge the cache from your CDN dashboard
```

### Step 5: Verify Deployment

1. Visit your site: `https://myfreshshare.com`
2. Check if CSS is loading properly
3. Open the diagnostic page: `https://myfreshshare.com/css-test-page.html`
4. Check browser console for any errors

## Troubleshooting

If CSS issues persist after deployment:

1. **Check Network Requests**: Open browser DevTools, go to Network tab, filter by CSS, verify all CSS files load with 200 status
2. **Verify MIME Types**: CSS files should have `Content-Type: text/css` header
3. **Check File Paths**: Make sure CSS files are in the correct directories
4. **Force Hard Reload**: Try Ctrl+Shift+R to bypass browser cache
5. **Check Server Logs**: Look for 404 or 403 errors related to CSS files
6. **Run Additional Fix**: SSH into your server and run the following command:

```bash
# Set MIME types in .htaccess
echo "AddType text/css .css" >> public_html/.htaccess
```

## Need Help?

If you continue experiencing issues, please check the detailed documentation in `docs/CSS-FIX-GUIDE.md` or reach out to the development team.
