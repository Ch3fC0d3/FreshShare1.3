# FreshShare 503 Error Fix Guide

## Common Causes of 503 Errors

1. **Services not running** - Fastify or Express services failed to start
2. **Port conflicts** - Configured ports are in use or blocked
3. **Database connection issues** - PostgreSQL connection failing
4. **Environment configuration** - Missing or incorrect environment variables
5. **Permission problems** - Script execution or file access issues

## Step-by-Step Fix

### 1. Check Service Status

SSH into your cPanel server and check if services are running:

```bash
# Check for running Node.js processes
ps aux | grep node

# Check if ports are in use
netstat -tulpn | grep -E '3001|8080'
```

### 2. Check Log Files

```bash
# Express server logs
cat ~/public_html/express.log

# Fastify backend logs
cat ~/public_html/fastify-backend/fastify.log
```

### 3. Restart Services

```bash
# Kill existing processes if needed
pkill -f "node server.js"
pkill -f "node --loader ts-node/esm server.ts"

# Restart Express server
cd ~/public_html
nohup ./start-express.sh > express.log 2>&1 &

# Restart Fastify backend
cd ~/public_html/fastify-backend
nohup ./start-fastify.sh > fastify.log 2>&1 &
```

### 4. Verify Environment Files

Make sure both `.env` files exist and contain correct values:

```bash
# Express .env
cat ~/public_html/.env

# Fastify .env
cat ~/public_html/fastify-backend/.env
```

### 5. Check Database Initialization

```bash
# Check if database initialization marker exists
ls -la ~/public_html/fastify-backend/.db_initialized

# Force database initialization if needed
cd ~/public_html/fastify-backend
node db-init.js
touch .db_initialized
```

### 6. Verify File Permissions

```bash
# Make sure scripts are executable
chmod +x ~/public_html/start-express.sh
chmod +x ~/public_html/fastify-backend/start-fastify.sh

# Check ownership
ls -la ~/public_html/start-express.sh
ls -la ~/public_html/fastify-backend/start-fastify.sh
```

### 7. Test Connectivity

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
