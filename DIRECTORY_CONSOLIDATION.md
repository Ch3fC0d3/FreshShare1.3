# Directory Consolidation Guide

## Overview
This document outlines the consolidation of the `public_html` and `public` directories in the FreshShare application. The consolidation was performed to streamline the static asset serving and eliminate duplicate files across multiple directories.

## Changes Made

1. **Modified Static File Serving Priority**
   - Updated `server.js` to prioritize the `public` directory over `public_html`
   - Changed the order in Express middleware to serve `public` first

2. **Updated Client-Side Path Resolution**
   - Modified `css-fix.js` to search for CSS files in `public` directory first
   - Added additional fallback paths to ensure compatibility

3. **Copied Configuration Files**
   - Duplicated `.htaccess` files to ensure proper MIME type handling in both directories
   - Ensured CSS subdirectory has proper configuration

## Current Directory Structure

### `public/` Directory (Primary)
- CSS files
- JavaScript files
- Images
- Upload directories
- Configuration files (`.htaccess`)

### `public_html/` Directory (Legacy/Fallback)
- Same structure as `public`
- Maintained for backward compatibility

## Best Practices

1. **Adding New Assets**
   - Place all new static assets in the `public` directory
   - Do not add new files to `public_html` as it will be phased out

2. **Updating Existing Assets**
   - Update files in the `public` directory
   - If necessary, duplicate critical updates to `public_html` temporarily for maximum compatibility

3. **Path References**
   - Use relative paths from the site root (e.g., `/css/main.css`)
   - Avoid explicit references to either `public` or `public_html` directories

## Future Plans

The long-term plan is to fully migrate away from the `public_html` directory. Once we confirm all deployments are working correctly with the `public` directory as the primary static asset source, we can remove the `public_html` directory completely.
