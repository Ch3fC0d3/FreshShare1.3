# FreshShare Production Setup Guide

This guide provides step-by-step instructions for setting up FreshShare in a production environment on cPanel to prevent 503 Service Unavailable errors.

## Quick Start

For a complete production setup, run:

```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

## Step 1: Configure Node.js Environment

The Node.js environment must be properly configured in cPanel:

1. In cPanel, go to "Setup Node.js App"
2. Create a Node.js environment for your application (Node.js 14+ recommended)
3. Set the application path to your public_html directory
4. Run the Node.js environment setup script:

```bash
chmod +x setup-node-env.sh
./setup-node-env.sh
```

## Step 2: Configure Environment Variables

Both Express and Fastify require specific environment variables:

### Express Server (.env in public_html)

```
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freshshare
JWT_SECRET=your-jwt-secret-key
FASTIFY_BACKEND_URL=http://localhost:8080
```

### Fastify Backend (.env in fastify-backend)

```
PORT=8080
NODE_ENV=production
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/freshshare
JWT_SECRET=your-jwt-secret-key
```

## Step 3: Set Up Startup Scripts

Create and configure startup scripts for both servers:

### Express Startup Script (public_html/start-express.sh)

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

### Fastify Startup Script (fastify-backend/start-fastify.sh)

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

Make both scripts executable:

```bash
chmod +x ~/public_html/start-express.sh
chmod +x ~/fastify-backend/start-fastify.sh
```

## Step 4: Configure Node.js Application Entry Point

Ensure your Express server is configured to handle all routing without relying on Apache. Your `server.js` already has the proxy middleware set up correctly:

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
    // ... other proxy settings
  })
);
```

This configuration allows your Express server to handle all routing and proxy appropriate requests to the Fastify backend.

## Step 5: Set Up Automatic Restart with Cron Jobs

Configure cron jobs to ensure your services restart automatically:

```bash
chmod +x setup-cron-jobs.sh
./setup-cron-jobs.sh
```

This will add the following cron jobs:

1. Start Fastify backend on system reboot
2. Start Express server on system reboot (with 10-second delay)
3. Check every 5 minutes if Fastify backend is running, restart if not
4. Check every 5 minutes if Express server is running, restart if not

## Step 6: Start the Services

Start both services in the correct order:

```bash
cd ~/fastify-backend && ./start-fastify.sh
sleep 5
cd ~/public_html && ./start-express.sh
```

## Troubleshooting 503 Errors

If you encounter 503 errors, run the diagnostic script:

```bash
node diagnose-production.js
```

### Common Issues and Solutions

1. **Node.js not in PATH**
   - Solution: Set up Node.js environment in cPanel or run setup-node-env.sh

2. **Services not running**
   - Solution: Start services with their respective startup scripts

3. **Port conflicts**
   - Solution: Check if ports are already in use with `netstat -tulpn | grep -E '3001|8080'`
   - Kill conflicting processes with `kill -9 <PID>`

4. **MongoDB connection issues**
   - Solution: Verify MongoDB connection strings in .env files
   - Test connection with: `node -e "const mongoose = require('mongoose'); mongoose.connect('your-connection-string').then(() => console.log('Connected!')).catch(err => console.error('Connection error:', err))"`

5. **Apache configuration issues**
   - Solution: Verify mod_proxy and mod_rewrite are enabled
   - Check Apache error logs: `tail -100 /var/log/apache2/error_log`

6. **Missing dependencies**
   - Solution: Run `npm install` in both directories

7. **Log file errors**
   - Solution: Check logs for specific errors:
     - `tail -f ~/public_html/express.log`
     - `tail -f ~/fastify-backend/fastify.log`

## Monitoring and Maintenance

1. **Check if services are running**:
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

4. **Verify cron jobs**:
   ```bash
   crontab -l
   ```

## Complete Production Deployment

For a complete production deployment that handles all the steps above:

```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

This script will:
1. Set up the Node.js environment
2. Create environment files
3. Generate startup scripts
4. Configure Apache
5. Set up cron jobs
6. Start both services

Remember to update the MongoDB connection strings and JWT secrets in both .env files after running the script.
