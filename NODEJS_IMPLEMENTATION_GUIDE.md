# Node.js-only Implementation Guide

This guide provides step-by-step instructions for implementing the Node.js-only solution to fix 503 Service Unavailable errors in production.

## Prerequisites

- cPanel hosting with Node.js support (v14+)
- SSH access to your hosting account
- MongoDB Atlas account (for database)
- FTP access for file uploads

## Implementation Steps

### 1. Prepare Local Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/Ch3fC0d3/FreshShare1.3.git
   cd FreshShare1.3
   ```

2. Install dependencies:
   ```bash
   npm install
   cd fastify-backend && npm install
   ```

3. Configure environment files:
   - Create `.env` in the root directory
   - Create `.env` in the `fastify-backend` directory

### 2. Configure Express Server

1. Update `server.js` to include the proxy middleware:

```javascript
// Add these imports at the top
const { createProxyMiddleware } = require('http-proxy-middleware');
const authJwt = require('./middleware/authJwt');

// Add this configuration before app.listen()
// Reverse proxy to Fastify backend (secured)
const FASTIFY_BACKEND_URL = process.env.FASTIFY_BACKEND_URL || 'http://localhost:8080';
app.use(
  '/api/pack',
  authJwt.verifyToken,
  createProxyMiddleware({
    target: FASTIFY_BACKEND_URL,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      // Forward JSON body
      if (req.body && req.method === 'POST') {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    }
  })
);
```

2. Add http-proxy-middleware to dependencies:
   ```bash
   npm install http-proxy-middleware --save
   ```

### 3. Create Startup Scripts

1. Create `start-express.sh` in the root directory:

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

2. Create `start-fastify.sh` in the `fastify-backend` directory:

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

3. Make scripts executable:
   ```bash
   chmod +x start-express.sh
   chmod +x fastify-backend/start-fastify.sh
   ```

### 4. Set Up Cron Jobs

Create `setup-cron-jobs.sh` in the root directory:

```bash
#!/bin/bash
# Setup cron jobs for automatic restart of FreshShare services

echo "Setting up cron jobs for automatic restart..."

# Remove any existing cron jobs for these services to avoid duplicates
(crontab -l 2>/dev/null || echo "") | grep -v "start-fastify\\.sh\\|start-express\\.sh" > temp_cron

# Add reboot cron jobs
echo "@reboot ~/fastify-backend/start-fastify.sh" >> temp_cron
echo "@reboot sleep 10 && ~/public_html/start-express.sh" >> temp_cron

# Add monitoring cron jobs (every 5 minutes)
echo "*/5 * * * * if ! pgrep -f \"node.*server.ts\" > /dev/null; then cd ~/fastify-backend && ./start-fastify.sh; fi" >> temp_cron
echo "*/5 * * * * if ! pgrep -f \"node server.js\" > /dev/null; then cd ~/public_html && ./start-express.sh; fi" >> temp_cron

# Install the new crontab
crontab temp_cron
rm temp_cron

echo "Cron jobs installed successfully!"
```

### 5. Deploy to Production

1. Upload files to your hosting:
   - Express files to `~/public_html/`
   - Fastify files to `~/fastify-backend/`

2. Set up environment files:
   - Express `.env` in `~/public_html/`:
     ```
     PORT=3001
     NODE_ENV=production
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freshshare
     JWT_SECRET=your-jwt-secret-key
     FASTIFY_BACKEND_URL=http://localhost:8080
     ```

   - Fastify `.env` in `~/fastify-backend/`:
     ```
     PORT=8080
     NODE_ENV=production
     DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/freshshare
     JWT_SECRET=your-jwt-secret-key
     ```

3. Make scripts executable:
   ```bash
   chmod +x ~/public_html/start-express.sh
   chmod +x ~/fastify-backend/start-fastify.sh
   chmod +x ~/public_html/setup-cron-jobs.sh
   ```

4. Set up cron jobs:
   ```bash
   bash ~/public_html/setup-cron-jobs.sh
   ```

5. Start services:
   ```bash
   cd ~/fastify-backend && ./start-fastify.sh
   cd ~/public_html && ./start-express.sh
   ```

### 6. Verify Deployment

1. Check if services are running:
   ```bash
   ps aux | grep node
   ```

2. Check logs for errors:
   ```bash
   tail -f ~/public_html/express.log
   tail -f ~/fastify-backend/fastify.log
   ```

3. Test the website in a browser

4. Run diagnostic script if needed:
   ```bash
   node ~/public_html/diagnose-nodejs-production.js
   ```

## Troubleshooting

### Common Issues

1. **Services not starting**
   - Check Node.js version: `node -v`
   - Verify script permissions: `ls -la *.sh`
   - Check for dependency issues: `npm list --depth=0`

2. **503 errors persist**
   - Verify both services are running
   - Check port configuration in `.env` files
   - Ensure MongoDB connection is valid
   - Review logs for specific errors

3. **MongoDB connection issues**
   - Verify connection string in both `.env` files
   - Check if IP whitelist includes your server IP
   - Test connection with a simple script

4. **Proxy not working**
   - Verify FASTIFY_BACKEND_URL is correct
   - Check Express server logs for proxy errors
   - Ensure http-proxy-middleware is installed

### Emergency Fix

If all else fails, run the comprehensive fix script:

```bash
bash ~/public_html/comprehensive-503-fix.sh
```

## Maintenance

1. **Monitoring services**:
   ```bash
   watch -n 5 "ps aux | grep node"
   ```

2. **Restarting services**:
   ```bash
   pkill -f "node.*server.js" && pkill -f "node.*server.ts"
   cd ~/fastify-backend && ./start-fastify.sh
   cd ~/public_html && ./start-express.sh
   ```

3. **Updating the application**:
   - Stop services: `pkill -f "node.*server.js" && pkill -f "node.*server.ts"`
   - Upload new files
   - Start services again

## Reference

For more detailed information, refer to:
- `NODEJS_SOLUTION_SUMMARY.md` - Overview of the solution
- `EMERGENCY_FIX_GUIDE.md` - Detailed troubleshooting steps
- `DEPLOYMENT_CHECKLIST.md` - Deployment verification list
