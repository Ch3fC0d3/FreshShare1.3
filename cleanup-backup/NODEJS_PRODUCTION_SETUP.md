# FreshShare Node.js-only Production Setup Guide

This guide provides step-by-step instructions for setting up FreshShare in a production environment on cPanel without Apache, using Node.js to handle all routing.

## Quick Start

For a complete production setup, run:

```bash
chmod +x deploy-nodejs-production.sh
./deploy-nodejs-production.sh
```

## Step 1: Configure Node.js Environment

The Node.js environment must be properly configured in cPanel:

1. In cPanel, go to "Setup Node.js App"
2. Create a Node.js environment for your application (Node.js 14+ recommended)
3. Set the application path to your public_html directory
4. Set the Application URL to your domain (e.g., https://yourdomain.com)
5. Set the Application startup file to `server.js`
6. Run the Node.js environment setup script:

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

## Step 5: Set Up Automatic Restart with Cron Jobs

Configure cron jobs to ensure your services restart automatically:

```bash
# Add to crontab
(crontab -l 2>/dev/null || echo "") | grep -v "start-fastify\\.sh\\|start-express\\.sh" > temp_cron
echo "@reboot ~/fastify-backend/start-fastify.sh" >> temp_cron
echo "@reboot sleep 10 && ~/public_html/start-express.sh" >> temp_cron
echo "*/5 * * * * if ! pgrep -f \"node.*server.ts\" > /dev/null; then cd ~/fastify-backend && ./start-fastify.sh; fi" >> temp_cron
echo "*/5 * * * * if ! pgrep -f \"node server.js\" > /dev/null; then cd ~/public_html && ./start-express.sh; fi" >> temp_cron
crontab temp_cron
rm temp_cron
```

## Step 6: Start the Services

Start both services in the correct order:

```bash
cd ~/fastify-backend && ./start-fastify.sh
sleep 5
cd ~/public_html && ./start-express.sh
```

## Step 7: Configure cPanel Application

In cPanel's Node.js Application Manager:

1. Set the application to run in production mode
2. Set the Node.js version to 14 or higher
3. Set the application root to public_html
4. Set the application URL to your domain
5. Set the application startup file to server.js
6. Enable "Run application in the background"

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

5. **Missing dependencies**
   - Solution: Run `npm install` in both directories

6. **Log file errors**
   - Solution: Check logs for specific errors:
     - `tail -f ~/public_html/express.log`
     - `tail -f ~/fastify-backend/fastify.log`

7. **cPanel Node.js application not starting**
   - Solution: Check the application logs in cPanel
   - Make sure the application is set to run in the background

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
chmod +x deploy-nodejs-production.sh
./deploy-nodejs-production.sh
```

This script will:
1. Set up the Node.js environment
2. Create environment files
3. Generate startup scripts
4. Set up cron jobs
5. Start both services

Remember to update the MongoDB connection strings and JWT secrets in both .env files after running the script.
