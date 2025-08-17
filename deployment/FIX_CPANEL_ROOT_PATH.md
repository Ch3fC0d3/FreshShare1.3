# Fixing Application Root Path in cPanel

This guide explains how to fix the 503 Service Unavailable error by correcting the application root path in cPanel.

## Problem

The Node.js application is currently configured with an incorrect application root path. It's pointing to `freshshare1.2` instead of `freshshare1.3`, which is causing the 503 Service Unavailable error.

## Solution

Follow these steps to correct the path:

1. Log in to your cPanel account at `https://myfreshshare.com/cpanel`

2. Navigate to **Software** > **Setup Node.js App**

3. Find your existing Node.js application in the list and click on **Edit**

4. Correct the **Application Root** to point to `/home/myfrovov/freshshare1.3` instead of `/home/myfrovov/freshshare1.2`

5. Make sure other settings are correct:
   - **Application URL**: Should be your domain or subdomain
   - **Application Mode**: Production
   - **Node.js version**: Should be v18+ (recommended)
   - **Application startup file**: `server.js`
   - **Environment variables**: Make sure any required environment variables are set

6. Click **Save** to apply the changes

7. Restart the Node.js application:
   - Click the **Restart** button next to your application in the Node.js app list
   - Or use Terminal to run: `pm2 restart all`

## Verification

After making these changes:

1. Run the troubleshooting script from Terminal:
   ```bash
   cd /home/myfrovov/repositories/FreshShare1.3/deployment/
   ./troubleshoot-503.sh
   ```

2. Check that the application is now running properly:
   ```bash
   pm2 status
   ```

3. Visit your website to verify the 503 error is resolved

## If Issue Persists

If you still encounter issues after fixing the application root path:

1. Run the start services script:
   ```bash
   cd /home/myfrovov/repositories/FreshShare1.3/deployment/
   ./start-services.sh
   ```

2. Check application logs for any errors:
   ```bash
   pm2 logs
   ```

3. Make sure all file permissions are set correctly:
   ```bash
   chmod -R 755 /home/myfrovov/public_html
   chmod -R 755 /home/myfrovov/fastify-backend
   ```
