# FreshShare cPanel Production Fix Guide

This guide provides steps to fix 503 errors in your FreshShare production environment on cPanel.

## Quick Diagnostic

Run these commands to diagnose issues:

```bash
# Check Node.js installation
which node
node -v
npm -v

# Check running processes
ps aux | grep node

# Check port usage
netstat -tulpn | grep -E '3001|8080'

# Check Apache error logs
tail -100 /var/log/apache2/error_log
```

## Production Fix Steps

### 1. Kill Existing Processes

```bash
pkill -f "node server.js"
pkill -f "node proxy-server.js"
```

### 2. Set Up Node.js Path

```bash
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH
```

### 3. Verify Required Files

```bash
# Check Express server
if [ ! -f "$HOME/public_html/server.js" ]; then
  echo "ERROR: server.js is missing in public_html"
  exit 1
fi

# Check Fastify backend
if [ ! -f "$HOME/fastify-backend/server.ts" ]; then
  echo "ERROR: server.ts is missing in fastify-backend"
  exit 1
fi
```

### 4. Create Production Startup Scripts

#### Express Server (~/public_html/start-express.sh)

```bash
#!/bin/bash
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH
export NODE_ENV=production
export PORT=3001
export FASTIFY_BACKEND_URL=http://localhost:8080

cd $HOME/public_html

# Check for dependencies
if [ ! -d "node_modules" ] || [ ! -d "node_modules/express" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the server
node server.js > express.log 2>&1 &
echo "Express server started on port 3001"
```

#### Fastify Backend (~/fastify-backend/start-fastify.sh)

```bash
#!/bin/bash
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH
export NODE_ENV=production
export PORT=8080

cd $HOME/fastify-backend

# Check for dependencies
if [ ! -d "node_modules" ] || [ ! -d "node_modules/fastify" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the server
npx ts-node server.ts > fastify.log 2>&1 &
echo "Fastify backend started on port 8080"
```

### 5. Make Scripts Executable

```bash
chmod +x ~/public_html/start-express.sh
chmod +x ~/fastify-backend/start-fastify.sh
```

### 6. Start Services

```bash
cd ~/fastify-backend
./start-fastify.sh
sleep 5
cd ~/public_html
./start-express.sh
```

### 7. Verify Services

```bash
# Check if servers are running
ps aux | grep node

# Check logs for errors
tail -f ~/fastify-backend/fastify.log
tail -f ~/public_html/express.log
```

### 8. Configure Apache

Create or update your `.htaccess` file:

```bash
cat > ~/public_html/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Don't rewrite files or directories
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]
    
    # Proxy everything else to Node.js
    RewriteRule ^ http://localhost:3001%{REQUEST_URI} [P,L]
</IfModule>

<IfModule mod_proxy.c>
    ProxyPreserveHost On
    ProxyTimeout 600
    Timeout 600
</IfModule>
EOF
```

### 9. Set Up Automatic Restart

1. Go to cPanel > Advanced > Cron Jobs
2. Add these cron jobs:

```bash
@reboot ~/fastify-backend/start-fastify.sh
@reboot sleep 10 && ~/public_html/start-express.sh
```

## Troubleshooting

### Common Issues

1. **"Command not found" errors**
   - Verify Node.js path: `which node`
   - Try alternative paths like `$HOME/nodevenv/freshshare1.3/16/bin`

2. **"EADDRINUSE" errors**
   - Check for processes using ports: `netstat -tulpn | grep -E '3001|8080'`
   - Kill conflicting processes: `kill -9 [PID]`

3. **Missing dependencies**
   - Run: `cd ~/public_html && npm install`
   - Run: `cd ~/fastify-backend && npm install`

4. **"Cannot find module" errors**
   - Check specific module: `npm list [module-name]`
   - Install missing module: `npm install [module-name]`

5. **TypeScript errors**
   - Install ts-node: `npm install -g ts-node typescript`

### Checking Logs

Monitor logs for real-time errors:

```bash
tail -f ~/public_html/express.log
tail -f ~/fastify-backend/fastify.log
```

## Advanced 503 Error Fixes

### Fix 1: Using the Proxy Server

If the main Express server is having issues, you can use the standalone proxy server:

```bash
cd ~/public_html

# Create proxy server startup script
cat > ~/public_html/start-proxy.sh << 'EOF'
#!/bin/bash
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH
export NODE_ENV=production
export PORT=3001
export FASTIFY_BACKEND_URL=http://localhost:8080

cd $HOME/public_html

# Check for dependencies
if [ ! -d "node_modules/http-proxy-middleware" ]; then
  echo "Installing proxy dependencies..."
  npm install http-proxy-middleware express
fi

# Start the proxy server
node proxy-server.js > proxy.log 2>&1 &
echo "Proxy server started on port 3001"
EOF

chmod +x ~/public_html/start-proxy.sh
./start-proxy.sh
```

### Fix 2: Comprehensive Fix Script

Run this comprehensive fix script to address all common 503 error causes:

```bash
cd ~/public_html

# Download the comprehensive fix script if not present
if [ ! -f "comprehensive-503-fix.sh" ]; then
  curl -o comprehensive-503-fix.sh https://raw.githubusercontent.com/Ch3fC0d3/FreshShare1.3/restore_branch/comprehensive-503-fix.sh
  chmod +x comprehensive-503-fix.sh
fi

# Run the fix script
./comprehensive-503-fix.sh
```

### Fix 3: Check Connection Test

Run the connection test script to diagnose specific connectivity issues:

```bash
cd ~/public_html

# Download the connection test script if not present
if [ ! -f "connection-test.js" ]; then
  curl -o connection-test.js https://raw.githubusercontent.com/Ch3fC0d3/FreshShare1.3/restore_branch/connection-test.js
fi

# Run the connection test
node connection-test.js
```

## Environment Variable Setup

### Express Server Environment

Create a proper `.env` file for Express:

```bash
cat > ~/public_html/.env << 'EOF'
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/FreshShareDB
MONGODB_DB=FreshShareDB
PORT=3001
JWT_SECRET=your-jwt-secret-key
FASTIFY_BACKEND_URL=http://localhost:8080
NODE_ENV=production
EOF
```

### Fastify Backend Environment

Create a proper `.env` file for Fastify:

```bash
cat > ~/fastify-backend/.env << 'EOF'
PORT=8080
NODE_ENV=production
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/FreshShareDB
JWT_SECRET=your-jwt-secret-key
EOF
```

## Monitoring and Recovery

### Automatic Health Check

Create a health check script that runs periodically:

```bash
cat > ~/public_html/health-check.sh << 'EOF'
#!/bin/bash
# Health check and auto-recovery script

# Check Express server
EXPRESS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/)
if [ "$EXPRESS_RESPONSE" != "200" ]; then
  echo "[$(date)] Express server not responding. Restarting..." >> ~/health-check.log
  pkill -f "node server.js" || true
  cd ~/public_html
  ./start-express.sh
fi

# Check Fastify backend
FASTIFY_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
if [ "$FASTIFY_RESPONSE" != "200" ]; then
  echo "[$(date)] Fastify backend not responding. Restarting..." >> ~/health-check.log
  pkill -f "node.*server.ts" || true
  cd ~/fastify-backend
  ./start-fastify.sh
fi
EOF

chmod +x ~/public_html/health-check.sh

# Add to crontab to run every 5 minutes
(crontab -l 2>/dev/null || echo "") | { cat; echo "*/5 * * * * ~/public_html/health-check.sh"; } | crontab -
```

### Deployment Status Check

Run this script to get a comprehensive status report of your deployment:

```bash
cd ~/public_html

# Download the deployment status check script if not present
if [ ! -f "check-deployment-status.js" ]; then
  curl -o check-deployment-status.js https://raw.githubusercontent.com/Ch3fC0d3/FreshShare1.3/restore_branch/check-deployment-status.js
fi

# Run the status check
node check-deployment-status.js
```

This script will provide detailed information about your deployment status and help identify specific issues causing the 503 error.
