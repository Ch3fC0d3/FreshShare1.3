# FreshShare 503 Error Solution Summary (Node.js-only)

This document provides a comprehensive summary of the solution to fix the 503 Service Unavailable error in the FreshShare application deployed on cPanel using a pure Node.js approach without Apache.

## Root Causes of 503 Errors

The 503 Service Unavailable error typically occurs due to:

1. **Node.js processes not running** - The Express and/or Fastify servers are not running or have crashed
2. **Incorrect Node.js environment** - PATH not set correctly or Node.js not installed/configured
3. **Missing startup scripts** - No proper way to start the services automatically
4. **No automatic recovery** - No mechanism to restart services after crashes or server reboots
5. **Configuration issues** - Incorrect proxy setup between Express and Fastify

## Complete Solution Components

### 1. Node.js Environment Setup

The `setup-node-env.sh` script configures the Node.js environment:

```bash
#!/bin/bash
# Find Node.js path
NODE_PATHS=(
  "$HOME/nodevenv/freshshare1.3/14/bin"
  "$HOME/nodevenv/freshshare1.3/16/bin"
  "$HOME/nodevenv/freshshare1.3/18/bin"
  "/opt/cpanel/ea-nodejs14/bin"
  "/opt/cpanel/ea-nodejs16/bin"
  "/opt/cpanel/ea-nodejs18/bin"
)

NODE_PATH=""
for path in "${NODE_PATHS[@]}"; do
  if [ -f "$path/node" ]; then
    NODE_PATH="$path"
    break
  fi
done

if [ -z "$NODE_PATH" ]; then
  echo "ERROR: Could not find Node.js installation"
  echo "Please create a Node.js environment in cPanel before running this script"
  exit 1
fi

export PATH="$NODE_PATH:$PATH"
echo "Using Node.js: $(which node) ($(node -v))"

# Create Express .env file
cat > ~/public_html/.env << EOF
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freshshare
JWT_SECRET=your-jwt-secret-key
FASTIFY_BACKEND_URL=http://localhost:8080
EOF
echo "Created Express .env file at ~/public_html/.env"

# Create Fastify .env file
cat > ~/fastify-backend/.env << EOF
PORT=8080
NODE_ENV=production
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/freshshare
JWT_SECRET=your-jwt-secret-key
EOF
echo "Created Fastify .env file at ~/fastify-backend/.env"

echo "Environment setup complete. Remember to update MongoDB connection strings and JWT secrets."
```

### 2. Startup Scripts

#### Express Startup Script (start-express.sh)

```bash
#!/bin/bash
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH
cd $HOME/public_html

# Load environment variables
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check for dependencies
if [ ! -d "node_modules" ] || [ ! -d "node_modules/express" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the server
echo "Starting Express server on port $PORT..."
node server.js > express.log 2>&1 &
echo $! > express.pid
echo "Express server started with PID $(cat express.pid)"
```

#### Fastify Startup Script (start-fastify.sh)

```bash
#!/bin/bash
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH
cd $HOME/fastify-backend

# Load environment variables
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check for dependencies
if [ ! -d "node_modules" ] || [ ! -d "node_modules/fastify" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the server
echo "Starting Fastify backend on port $PORT..."
npx ts-node server.ts > fastify.log 2>&1 &
echo $! > fastify.pid
echo "Fastify backend started with PID $(cat fastify.pid)"
```

### 3. Automatic Restart with Cron Jobs

The `setup-cron-jobs.sh` script configures automatic restarts:

```bash
#!/bin/bash
# Set up cron jobs for automatic restart of services

# Add cron jobs to restart services on reboot and check every 5 minutes
(crontab -l 2>/dev/null || echo "") | grep -v "start-fastify\\.sh\\|start-express\\.sh" > temp_cron
echo "@reboot ~/fastify-backend/start-fastify.sh" >> temp_cron
echo "@reboot sleep 10 && ~/public_html/start-express.sh" >> temp_cron
echo "*/5 * * * * if ! pgrep -f \"node.*server.ts\" > /dev/null; then cd ~/fastify-backend && ./start-fastify.sh; fi" >> temp_cron
echo "*/5 * * * * if ! pgrep -f \"node server.js\" > /dev/null; then cd ~/public_html && ./start-express.sh; fi" >> temp_cron
crontab temp_cron
rm temp_cron

echo "Cron jobs installed successfully"
echo "Services will automatically restart on reboot and be checked every 5 minutes"
```

### 4. Node.js Proxy Configuration

The Express server is already configured to proxy requests to the Fastify backend:

```javascript
// Reverse proxy to Fastify backend (secured)
const FASTIFY_BACKEND_URL = process.env.FASTIFY_BACKEND_URL || 'http://localhost:8080';
app.use(
  '/api/pack',
  authJwt.verifyToken,
  createProxyMiddleware({
    target: FASTIFY_BACKEND_URL,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: { '^/api/pack': '' },
    onProxyReq: (proxyReq, req, res) => {
      // If body was parsed by express.json/urlencoded, re-send it to the target
      if (!req.body || !Object.keys(req.body).length) return;
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const bodyData = querystring.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      if (!res.headersSent) {
        res.status(502).json({ success: false, message: 'Upstream service unavailable' });
      }
    }
  })
);
```

### 5. Complete Deployment Script

The `deploy-nodejs-production.sh` script performs a complete deployment:

```bash
#!/bin/bash
# FreshShare Production Deployment Script for Node.js-only environment
# This script performs a complete production deployment of FreshShare on cPanel without Apache

echo "========================================="
echo "FreshShare Production Deployment (Node.js only)"
echo "========================================="

# 1. Set up Node.js environment
echo "[1/5] Setting up Node.js environment..."
# Find Node.js path
NODE_PATHS=(
  "$HOME/nodevenv/freshshare1.3/14/bin"
  "$HOME/nodevenv/freshshare1.3/16/bin"
  "$HOME/nodevenv/freshshare1.3/18/bin"
  "/opt/cpanel/ea-nodejs14/bin"
  "/opt/cpanel/ea-nodejs16/bin"
  "/opt/cpanel/ea-nodejs18/bin"
)

NODE_PATH=""
for path in "${NODE_PATHS[@]}"; do
  if [ -f "$path/node" ]; then
    NODE_PATH="$path"
    break
  fi
done

if [ -z "$NODE_PATH" ]; then
  echo "ERROR: Could not find Node.js installation"
  echo "Please create a Node.js environment in cPanel before running this script"
  exit 1
fi

export PATH="$NODE_PATH:$PATH"
echo "Using Node.js: $(which node) ($(node -v))"

# 2. Kill any existing Node.js processes
echo "[2/5] Stopping existing Node.js processes..."
pkill -f "node.*server.js" || true
pkill -f "node.*server.ts" || true
sleep 2

# 3. Set up environment files
echo "[3/5] Creating environment files..."

# Express .env file
cat > ~/public_html/.env << EOF
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freshshare
JWT_SECRET=your-jwt-secret-key
FASTIFY_BACKEND_URL=http://localhost:8080
EOF
echo "Created Express .env file at ~/public_html/.env"

# Fastify .env file
cat > ~/fastify-backend/.env << EOF
PORT=8080
NODE_ENV=production
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/freshshare
JWT_SECRET=your-jwt-secret-key
EOF
echo "Created Fastify .env file at ~/fastify-backend/.env"

# 4. Create startup scripts
echo "[4/5] Creating startup scripts..."

# Express startup script
cat > ~/public_html/start-express.sh << 'EOF'
#!/bin/bash
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH
cd $HOME/public_html

# Load environment variables
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check for dependencies
if [ ! -d "node_modules" ] || [ ! -d "node_modules/express" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the server
echo "Starting Express server on port $PORT..."
node server.js > express.log 2>&1 &
echo $! > express.pid
echo "Express server started with PID $(cat express.pid)"
EOF
chmod +x ~/public_html/start-express.sh
echo "Created Express startup script at ~/public_html/start-express.sh"

# Fastify startup script
cat > ~/fastify-backend/start-fastify.sh << 'EOF'
#!/bin/bash
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH
cd $HOME/fastify-backend

# Load environment variables
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check for dependencies
if [ ! -d "node_modules" ] || [ ! -d "node_modules/fastify" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the server
echo "Starting Fastify backend on port $PORT..."
npx ts-node server.ts > fastify.log 2>&1 &
echo $! > fastify.pid
echo "Fastify backend started with PID $(cat fastify.pid)"
EOF
chmod +x ~/fastify-backend/start-fastify.sh
echo "Created Fastify startup script at ~/fastify-backend/start-fastify.sh"

# 5. Set up cron jobs
echo "[5/5] Setting up cron jobs..."
(crontab -l 2>/dev/null || echo "") | grep -v "start-fastify\\.sh\\|start-express\\.sh" > temp_cron
echo "@reboot ~/fastify-backend/start-fastify.sh" >> temp_cron
echo "@reboot sleep 10 && ~/public_html/start-express.sh" >> temp_cron
echo "*/5 * * * * if ! pgrep -f \"node.*server.ts\" > /dev/null; then cd ~/fastify-backend && ./start-fastify.sh; fi" >> temp_cron
echo "*/5 * * * * if ! pgrep -f \"node server.js\" > /dev/null; then cd ~/public_html && ./start-express.sh; fi" >> temp_cron
crontab temp_cron
rm temp_cron
echo "Cron jobs installed successfully"

# Start services
echo "========================================="
echo "Starting services..."
~/fastify-backend/start-fastify.sh
sleep 5
~/public_html/start-express.sh

echo "========================================="
echo "Production deployment complete!"
echo ""
echo "IMPORTANT: Edit the .env files to update:"
echo "1. MongoDB connection strings in both .env files"
echo "2. JWT secret keys in both .env files"
echo ""
echo "To check if services are running:"
echo "ps aux | grep node"
echo ""
echo "To view logs:"
echo "tail -f ~/public_html/express.log"
echo "tail -f ~/fastify-backend/fastify.log"
echo "========================================="
```

### 6. Diagnostic Tool

The `diagnose-nodejs-production.js` script helps identify and fix issues:

```javascript
// FreshShare Production Diagnostics Tool (Node.js-only version)
// This script checks for common issues that might cause 503 errors
// in a Node.js-only production environment on cPanel.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Helper functions for checking environment, processes, ports, files, etc.
// ... [full code in diagnose-nodejs-production.js]

// Main diagnostic function
async function runDiagnostics() {
  // Checks Node.js installation, services status, ports, startup scripts,
  // environment files, log files, cron jobs, and dependencies
  // ... [full code in diagnose-nodejs-production.js]
}

// Run the diagnostics
runDiagnostics().catch(error => {
  console.error('Diagnostic failed:', error);
});
```

## Deployment Steps

1. **Set up Node.js in cPanel**:
   - Go to cPanel > Setup Node.js App
   - Create a Node.js environment (Node.js 14+ recommended)
   - Set application path to public_html directory

2. **Upload files to server**:
   - Upload all application files to public_html
   - Upload Fastify backend to fastify-backend directory

3. **Run deployment script**:
   ```bash
   chmod +x deploy-nodejs-production.sh
   ./deploy-nodejs-production.sh
   ```

4. **Update environment variables**:
   - Edit ~/public_html/.env and ~/fastify-backend/.env
   - Update MongoDB connection strings
   - Update JWT secrets

5. **Verify deployment**:
   ```bash
   node diagnose-nodejs-production.js
   ```

## Troubleshooting Guide

### Common Issues and Solutions

1. **503 Service Unavailable Error**
   - Check if Node.js processes are running: `ps aux | grep node`
   - Check logs: `tail -f ~/public_html/express.log ~/fastify-backend/fastify.log`
   - Restart services: `~/fastify-backend/start-fastify.sh && sleep 5 && ~/public_html/start-express.sh`

2. **Node.js Not Found**
   - Verify Node.js is installed: `which node`
   - Check PATH: `echo $PATH`
   - Run setup script: `./setup-node-env.sh`

3. **MongoDB Connection Issues**
   - Verify connection strings in .env files
   - Test connection: `node -e "const mongoose = require('mongoose'); mongoose.connect('your-connection-string').then(() => console.log('Connected!')).catch(err => console.error('Connection error:', err))"`

4. **Port Conflicts**
   - Check if ports are in use: `netstat -tulpn | grep -E '3001|8080'`
   - Kill conflicting processes: `kill -9 <PID>`

5. **Startup Script Issues**
   - Check permissions: `ls -la ~/public_html/start-express.sh ~/fastify-backend/start-fastify.sh`
   - Make executable: `chmod +x ~/public_html/start-express.sh ~/fastify-backend/start-fastify.sh`

6. **Services Not Restarting Automatically**
   - Check cron jobs: `crontab -l`
   - Set up cron jobs: `./setup-cron-jobs.sh`

## Monitoring and Maintenance

1. **Check service status**:
   ```bash
   ps aux | grep node
   ```

2. **View logs**:
   ```bash
   tail -f ~/public_html/express.log
   tail -f ~/fastify-backend/fastify.log
   ```

3. **Restart services manually**:
   ```bash
   cd ~/fastify-backend && ./start-fastify.sh
   cd ~/public_html && ./start-express.sh
   ```

4. **Run diagnostics**:
   ```bash
   node diagnose-nodejs-production.js
   ```

## Conclusion

This Node.js-only solution addresses the 503 Service Unavailable error by ensuring:

1. Proper Node.js environment configuration
2. Reliable startup scripts for both Express and Fastify
3. Correct proxy configuration between Express and Fastify
4. Automatic service restarts with cron jobs
5. Comprehensive diagnostics and troubleshooting tools

By implementing this solution, the FreshShare application will maintain reliable uptime in production without relying on Apache.
