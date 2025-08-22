# cPanel Node.js Setup Guide

## Critical Issue: Node.js Version Mismatch

Your deployment is failing because cPanel is using Node.js 10, but your application requires Node.js 18.

## Steps to Fix in cPanel

### 1. Update Node.js Version
1. Log into your cPanel
2. Go to **Software** → **Node.js Selector** (or **Node.js App**)
3. Find your FreshShare application
4. Change Node.js version from **10.x** to **18.x**
5. Click **Save** or **Update**

### 2. Verify Node.js Path
After updating, your Node.js path should be:
```
/home/myfrovov/nodevenv/freshshare1.3/18/bin/node
```

### 3. Environment Variables
Ensure these environment variables are set in cPanel:
- `NODE_ENV=production`
- `PORT=3001` (for Express)
- `FASTIFY_PORT=8080` (for Fastify)

### 4. Application Settings
- **Application Root**: `public_html`
- **Application URL**: Your domain
- **Application Startup File**: `server.js`

## Manual Verification Commands

SSH into your server and run:
```bash
# Check Node.js version
~/nodevenv/freshshare1.3/18/bin/node --version

# Check npm version
~/nodevenv/freshshare1.3/18/bin/npm --version

# Test application startup
cd ~/public_html
~/nodevenv/freshshare1.3/18/bin/node server.js
```

## If Node.js 18 is Not Available

Contact your hosting provider to:
1. Install Node.js 18 on the server
2. Enable it in cPanel Node.js Selector
3. Update your hosting plan if needed

## After Updating Node.js

1. Re-run the GitHub Actions deployment
2. Check the logs for "Using cPanel Node.js App" message
3. Verify both Fastify and Express servers start successfully
