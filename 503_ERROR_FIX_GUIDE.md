# FreshShare 503 Error Fix Guide

This guide provides step-by-step instructions for resolving 503 Service Unavailable errors in the FreshShare application in both local Windows environments and production cPanel servers.

## Understanding 503 Service Unavailable Errors

A 503 Service Unavailable error occurs when the web server is unable to handle requests due to temporary overload or maintenance. In the FreshShare application, this typically happens when:

1. Node.js processes (Express or Fastify) are not running
2. Apache proxy configuration is incorrect
3. Database connections (MongoDB or PostgreSQL) are failing
4. Environment variables or configuration files are missing

## Quick Fix Overview

FreshShare includes two scripts to automatically resolve 503 errors:

- **Windows Development**: Use `fix-503-error-windows.js` for local development environments
- **Production Server**: Use `503-fix-production.sh` for cPanel hosting environments

## Windows Environment Fix

### Prerequisites
- Node.js installed (version 14+)
- Access to the FreshShare codebase locally

### Steps to Fix 503 Error on Windows

1. Open a PowerShell or Command Prompt window
2. Navigate to the FreshShare project root directory:
   ```
   cd D:\path\to\FreshShare1.3
   ```
3. Run the fix script:
   ```
   node fix-503-error-windows.js
   ```
4. The script will:
   - Check and create necessary environment files (.env)
   - Configure Apache proxy settings (.htaccess)
   - Install required dependencies
   - Kill any conflicting Node.js processes
   - Start Fastify backend and Express server
   - Verify services are running correctly

5. Once complete, access the application at: `http://localhost:3001`

### Troubleshooting Windows Environment

If you still encounter 503 errors after running the fix script:

1. Check log files:
   - `express.log` - Express server logs
   - `fastify.log` - Fastify backend logs

2. Verify ports are available:
   - Express runs on port 3001
   - Fastify runs on port 8080
   - Use `netstat -ano | findstr :3001` to check if ports are in use

3. Check database connections:
   - Ensure MongoDB is running locally (or accessible if remote)
   - Check PostgreSQL connection string in fastify-backend/.env

## Production (cPanel) Fix

### Prerequisites
- SSH access to the cPanel server
- Node.js installed via cPanel Node.js App Manager
- Basic Linux command line knowledge

### Steps to Fix 503 Error on Production

1. SSH into your cPanel server:
   ```
   ssh username@your-cpanel-server.com -p 22
   ```

2. Navigate to your FreshShare directory:
   ```
   cd ~/freshshare1.3
   ```

3. Make the fix script executable:
   ```
   chmod +x 503-fix-production.sh
   ```

4. Run the fix script:
   ```
   ./503-fix-production.sh
   ```

5. The script will:
   - Detect Node.js environment
   - Stop existing Node.js processes
   - Create/verify environment files
   - Configure Apache proxy in .htaccess
   - Create startup scripts for Express and Fastify
   - Install required dependencies
   - Start both services
   - Setup cron jobs for automatic restart
   - Test connectivity

6. Once complete, your site should be accessible without 503 errors

### Checking Production Logs

If issues persist, check the following log files:

```
# Express server log
cat ~/freshshare1.3/express.log

# Fastify backend log
cat ~/freshshare1.3/fastify-backend/fastify.log

# Apache error log
cat ~/logs/error_log
```

## Manual Configuration

If you need to manually configure the services:

### Apache Proxy (.htaccess)

For proper proxying between Apache and Node.js services, ensure your `public_html/.htaccess` contains:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # API requests go to Fastify backend
  RewriteRule ^api/(.*)$ http://localhost:8080/$1 [P,L]
  
  # Send all other requests to Express frontend
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ http://localhost:3001/$1 [P,L]
</IfModule>
```

### Express Environment Variables

Essential environment variables for Express server:

```
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb://127.0.0.1:27017/myfrovov_freshshare
MONGODB_SSL=false
FASTIFY_BACKEND_URL=http://localhost:8080
JWT_SECRET=your-secret-key
BASE_URL=
```

### Fastify Environment Variables

Essential environment variables for Fastify backend:

```
PORT=8080
NODE_ENV=production
DATABASE_URL=postgresql://myfrovov_freshshare_user:password@localhost:5432/myfrovov_freshshare
DATABASE_SSL=false
```

## Deploying the Fix to Production

To deploy the fix scripts to production:

1. Update your local files using the provided scripts
2. Add them to your deployment using the `deploy-to-github.bat` script
3. Push to GitHub which will trigger the deployment workflow
4. SSH into the server and run the production fix script

## Additional Diagnostic Tools

FreshShare includes additional tools for diagnosing 503 errors:

- `diagnose-production.js`: Checks database connections, processes, and logs
- `test-connection.js`: Tests connectivity to Express and Fastify services
- `mongodb-bypass.js`: Provides MongoDB connection fallbacks

## Contact Support

If you continue to experience 503 errors after following this guide, please contact support with the following information:

1. Output from running the fix script
2. Content of express.log and fastify.log
3. Any error messages from Apache logs
4. Results from running `diagnose-production.js`
