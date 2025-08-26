# FreshShare cPanel Emergency Fix Guide

This guide provides quick steps to fix 503 errors in your FreshShare application on cPanel.

## Automated Conflict Detection

**NEW**: For comprehensive conflict detection and automated resolution, run:

```bash
./detect-conflicts.sh
```

This tool will detect and help resolve:
- Git merge conflicts
- Service/port conflicts  
- Path configuration issues
- Environment problems
- Permission conflicts

For detailed resolution steps, see: `CONFLICT_RESOLUTION_GUIDE.md`

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
```

## Emergency Fix Steps

### 1. Kill Existing Processes

```bash
pkill -f "node server.js"
pkill -f "node proxy-server.js"
```

### 2. Set Up Node.js Path

```bash
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH
```

### 3. Set Up Environment Variables

Create a `.env` file for the Fastify backend:

```bash
cat > ~/fastify-backend/.env << 'EOF'
PORT=8080
NODE_ENV=production
# Add your MongoDB connection string here
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/freshshare?retryWrites=true&w=majority
JWT_SECRET=your-jwt-secret-key
EOF
```

Create a `config-temp.js` file for the Express server:

```bash
cat > ~/public_html/config-temp.js << 'EOF'
process.env.MONGODB_URI = "mongodb+srv://username:password@cluster.mongodb.net/freshshare?retryWrites=true&w=majority";
process.env.JWT_SECRET = "your-jwt-secret-key";
process.env.FASTIFY_BACKEND_URL = "http://localhost:8080";
EOF
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

### 8. Set Up Automatic Restart

1. Go to cPanel > Advanced > Cron Jobs
2. Add these cron jobs:

```bash
@reboot ~/fastify-backend/start-fastify.sh
@reboot sleep 10 && ~/public_html/start-express.sh
```

## Required Files

Ensure these files exist in your environment:

1. `~/public_html/server.js` - Main Express server application with proxy configuration
2. `~/fastify-backend/server.ts` - Fastify backend server
3. `~/public_html/middleware/authJwt.js` - Authentication middleware
4. `~/public_html/config/auth.config.js` - JWT authentication configuration

## Express Proxy Configuration

Verify your Express server has the correct proxy middleware configuration in `server.js`:

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
      // Handle request body forwarding
      if (!req.body || !Object.keys(req.body).length) return;
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
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

## Troubleshooting

### Common Issues

1. **"Command not found" errors**
   - Verify Node.js path: `which node`
   - Try alternative paths like `$HOME/nodevenv/freshshare1.3/16/bin`
   - Check if Node.js is installed: `ls -la $HOME/nodevenv/`

2. **"EADDRINUSE" errors**
   - Check for processes using ports: `netstat -tulpn | grep -E '3001|8080'`
   - Kill conflicting processes: `kill -9 [PID]`

3. **503 Service Unavailable errors**
   - Check Express and Fastify logs: `tail -100 ~/public_html/express.log ~/fastify-backend/fastify.log`
   - Verify both servers are running: `ps aux | grep node`
   - Check proxy configuration in server.js
   - Verify network connectivity between Express and Fastify: `curl -v http://localhost:8080/health`

4. **Missing dependencies**
   - Run: `cd ~/public_html && npm install`
   - Run: `cd ~/fastify-backend && npm install`
   - Check specific module: `npm list [module-name]`

5. **TypeScript errors**
   - Install ts-node: `npm install -g ts-node typescript`
   - Check TypeScript version: `npx tsc --version`

6. **Permission issues**
   - Fix script permissions: `chmod +x ~/public_html/*.sh ~/fastify-backend/*.sh`
   - Check file ownership: `ls -la ~/public_html/`

### Checking Logs

Monitor logs for real-time errors:

```bash
tail -f ~/public_html/express.log
tail -f ~/fastify-backend/fastify.log
```

### Testing Connectivity

Test if servers are accessible:

```bash
# Test Express server
curl -v http://localhost:3001

# Test Fastify backend
curl -v http://localhost:8080/health

# Test through Express
curl -v http://yourdomain.com
```

### Emergency Restart

If all else fails, try a complete restart:

```bash
# Kill all Node processes
pkill -f node

# Clear port 3001 and 8080 if needed
fuser -k 3001/tcp
fuser -k 8080/tcp

# Restart services
cd ~/fastify-backend
./start-fastify.sh
sleep 5
cd ~/public_html
./start-express.sh

## Full Recovery

Once the emergency fix is working, follow the complete setup in `cPanel-NODE-SETUP.md` to restore full functionality.

## Mock Server Approach

If you need an immediate fix while troubleshooting the main application, you can deploy a simple mock server:

### 1. Create Mock Fastify Server

```bash
cat > ~/public_html/mock-fastify-server.js << 'EOF'
const fastify = require('fastify')({ logger: true });

// CORS setup
fastify.register(require('@fastify/cors'), {
  origin: '*',
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Mock API endpoints
fastify.get('/api/*', async (request) => {
  return {
    success: true,
    message: 'Mock API response',
    path: request.url,
    timestamp: new Date().toISOString()
  };
});

fastify.post('/api/*', async (request) => {
  return {
    success: true,
    message: 'Data received',
    body: request.body,
    timestamp: new Date().toISOString()
  };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
    console.log(`Mock server running on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
EOF
```

### 2. Create Mock Express Server

```bash
cat > ~/public_html/mock-express-server.js << 'EOF'
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Proxy middleware for API requests
app.use('/api/pack', createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true,
  pathRewrite: { '^/api/pack': '' },
  onProxyReq: (proxyReq, req) => {
    console.log(`Proxying ${req.method} ${req.url} to backend`);
  }
}));

// Basic routes
app.get('/', (req, res) => {
  res.send('<h1>FreshShare Mock Server</h1><p>Server is running in emergency mode</p>');
});

app.get('/status', (req, res) => {
  res.json({ status: 'online', mode: 'emergency', time: new Date() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mock Express server running on port ${PORT}`);
});
EOF
```

### 3. Create Mock Server Startup Script

```bash
cat > ~/public_html/start-mock-servers.sh << 'EOF'
#!/bin/bash
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH
export NODE_ENV=production

cd $HOME/public_html

# Install required packages if missing
if [ ! -d "node_modules/http-proxy-middleware" ] || [ ! -d "node_modules/@fastify/cors" ]; then
  echo "Installing required packages..."
  npm install http-proxy-middleware @fastify/cors fastify express
fi

# Kill any existing Node processes
pkill -f "node mock-fastify-server.js" || true
pkill -f "node mock-express-server.js" || true

# Start mock Fastify server
node mock-fastify-server.js > mock-fastify.log 2>&1 &
echo "Mock Fastify server started"

# Wait for Fastify to initialize
sleep 3

# Start mock Express server
node mock-express-server.js > mock-express.log 2>&1 &
echo "Mock Express server started"

# Show running processes
ps aux | grep node
EOF

chmod +x ~/public_html/start-mock-servers.sh
```

### 4. Run the Mock Servers

```bash
cd ~/public_html
./start-mock-servers.sh
```

This will provide a minimal working environment while you troubleshoot the main application issues.
