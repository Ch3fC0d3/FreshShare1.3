# FreshShare 503 Error Fix Guide for cPanel

## Common Causes of 503 Errors

1. **Services not running** - Fastify or Express services failed to start
2. **Port conflicts** - Configured ports are in use or blocked
3. **Database connection issues** - PostgreSQL connection failing
4. **Environment configuration** - Missing or incorrect environment variables
5. **Permission problems** - Script execution or file access issues
6. **Node.js path issues** - Incorrect Node.js paths in cPanel environment

## Step-by-Step Fix

### 1. Verify Node.js Environment

Check if Node.js is properly installed and running:

```bash
node -v
npm -v
ps aux | grep node
```

### 2. Check Express and Fastify Processes

Verify if both Express and Fastify processes are running:

```bash
ps aux | grep node
```

If not running, start them:

```bash
# Start Fastify first
cd ~/fastify-backend
./start-fastify.sh

# Then start Express
cd ~/public_html
./start-express.sh
```

### 3. Check Express Proxy Configuration

Verify that Express is properly forwarding API requests to Fastify backend:

```bash
grep -A 10 "Reverse proxy to Fastify backend" ~/public_html/server.js
```

Check Express and Fastify logs:

```bash
cat ~/public_html/express.log
cat ~/fastify-backend/fastify.log
```

### 4. Restart Services

```bash
# Kill existing processes if needed
pkill -f "node server.js"
pkill -f "node --loader ts-node/esm server.ts"
cd ~/fastify-backend
# Set Node.js path for cPanel environment
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH

# Restart Express server
cd ~/public_html
chmod +x start-express.sh
nohup ./start-express.sh > express.log 2>&1 &

# Restart Fastify backend
cd ~/fastify-backend
chmod +x start-fastify.sh
nohup ./start-fastify.sh > fastify.log 2>&1 &

# Check if services started
sleep 5
ps aux | grep node
```

### 5. Verify Environment Files

Make sure both `.env` files exist and contain correct values:

```bash
# Express .env
cat ~/public_html/.env

# Fastify .env
cat ~/public_html/fastify-backend/.env
```

### 6. Check Database Initialization

```bash
# Check if database initialization marker exists
ls -la ~/public_html/fastify-backend/.db_initialized

# Force database initialization if needed
cd ~/public_html/fastify-backend
node db-init.js
touch .db_initialized
```

### 7. Verify File Permissions

```bash
# Make sure scripts are executable
chmod +x ~/public_html/start-express.sh
chmod +x ~/public_html/fastify-backend/start-fastify.sh

# Check ownership
ls -la ~/public_html/start-express.sh
ls -la ~/public_html/fastify-backend/start-fastify.sh
```

### 8. Test Connectivity

```bash
# Test Fastify backend directly
curl http://localhost:8080/health

# Test Express server
curl http://localhost:3001
```

## Using the Diagnostic Script

Upload the `check-deployment-status.js` script to your server and run:

```bash
cd ~/public_html
node check-deployment-status.js
```

This will provide detailed information about your deployment status and help identify the specific issue causing the 503 error.

## Quick Fix for Testing

If you need a quick solution to verify your setup, try running the mock server:

```bash
cd ~/public_html
node mock-fastify-server.js &
node -r ./config-temp.js proxy-server.js &
```

This will create a simple mock backend and proxy server to test if the basic architecture works.

## Emergency Fix for cPanel

If you're experiencing 503 errors in cPanel and the standard fixes aren't working, try this emergency fix:

```bash
# Set Node.js path for cPanel environment
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH

# Create simplified startup scripts
cat > ~/public_html/cpanel-start.sh << 'EOF'
#!/bin/bash
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH
export NODE_ENV=production
export PORT=3001
cd ~/public_html
node proxy-server.js > proxy.log 2>&1 &
echo "Proxy server started"
EOF

cat > ~/public_html/cpanel-mock.sh << 'EOF'
#!/bin/bash
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH
export NODE_ENV=production
export PORT=8080
cd ~/public_html
node mock-fastify-server.js > mock.log 2>&1 &
echo "Mock server started"
EOF

# Make scripts executable
chmod +x ~/public_html/cpanel-start.sh
chmod +x ~/public_html/cpanel-mock.sh

# Start the servers
cd ~/public_html
./cpanel-mock.sh
sleep 3
./cpanel-start.sh

# Verify servers are running
ps aux | grep node
```

This simplified approach uses the mock server and proxy server to get your site back online quickly.

## CORS Configuration in Express

```javascript
// CORS configuration in Express server.js
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Proxy API requests to Fastify backend
app.use('/api/pack', createProxyMiddleware({
  target: FASTIFY_BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {'^/api/pack': ''}
}));
```

## Express Static File Handling

```javascript
// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// For any other routes, serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

## Monitoring and Logging

```bash
# Check Express logs
tail -f ~/public_html/express.log

# Check Fastify logs
tail -f ~/fastify-backend/fastify.log

# Monitor running processes
watch -n 5 "ps aux | grep node"
```

## Setting Up Cron Jobs for Automatic Restart

To ensure your application restarts after server reboots or crashes, set up cron jobs:

### 1. Via cPanel Interface

1. Log in to cPanel
2. Navigate to Advanced > Cron Jobs
3. Add the following cron jobs:

```bash
@reboot ~/public_html/fastify-backend/start-fastify.sh
@reboot sleep 10 && ~/public_html/start-express.sh
# Add monitoring job to restart if crashed
*/10 * * * * if ! pgrep -f "node.*server.ts" > /dev/null; then cd ~/public_html/fastify-backend && ./start-fastify.sh; fi
*/10 * * * * if ! pgrep -f "node server.js" > /dev/null; then cd ~/public_html && ./start-express.sh; fi
```

### 2. Via SSH Command Line

```bash
# Open crontab for editing
crontab -e

# Add these lines
@reboot ~/public_html/fastify-backend/start-fastify.sh
@reboot sleep 10 && ~/public_html/start-express.sh
*/10 * * * * if ! pgrep -f "node.*server.ts" > /dev/null; then cd ~/public_html/fastify-backend && ./start-fastify.sh; fi
*/10 * * * * if ! pgrep -f "node server.js" > /dev/null; then cd ~/public_html && ./start-express.sh; fi
```

## Monitoring and Maintaining Your Deployment

To ensure your application stays up and running:

1. **Set up regular log rotation**:

```bash
cat > ~/public_html/rotate-logs.sh << 'EOF'
#!/bin/bash
# Rotate logs to prevent them from growing too large

cd ~/public_html

# Express logs
if [ -f "express.log" ] && [ $(stat -c%s "express.log") -gt 10485760 ]; then
  mv express.log express.log.old
  touch express.log
  echo "Rotated Express logs at $(date)" >> express.log
fi

# Fastify logs
if [ -f "fastify-backend/fastify.log" ] && [ $(stat -c%s "fastify-backend/fastify.log") -gt 10485760 ]; then
  mv fastify-backend/fastify.log fastify-backend/fastify.log.old
  touch fastify-backend/fastify.log
  echo "Rotated Fastify logs at $(date)" >> fastify-backend/fastify.log
fi
EOF

chmod +x ~/public_html/rotate-logs.sh

# Add to crontab
crontab -l | { cat; echo "0 0 * * * ~/public_html/rotate-logs.sh"; } | crontab -
```

1. **Create a health check script**:

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
  cd ~/public_html/fastify-backend
  ./start-fastify.sh
fi
EOF

chmod +x ~/public_html/health-check.sh

# Add to crontab
crontab -l | { cat; echo "*/5 * * * * ~/public_html/health-check.sh"; } | crontab -
```

By implementing these additional configurations, you'll have a more robust setup that can automatically recover from many common issues that cause 503 errors.
