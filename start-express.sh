#!/bin/bash

# Startup script for Express server in production environment
# For use with cPanel Node.js App deployment

# Set environment variables
cd "$(dirname "$0")"
export NODE_ENV=production
export PATH=/opt/cpanel/ea-nodejs18/bin:$PATH
export NODE_PATH=/opt/cpanel/ea-nodejs18/lib/node_modules
export PORT=3001

# Log startup
echo "Starting Express server..."

# Ensure we're in the correct directory
cd "$HOME/public_html"

# Copy production env file if it exists and .env doesn't
if [ -f ".env.production" ] && [ ! -f ".env" ]; then
  cp .env.production .env
  echo "Copied .env.production to .env"
fi

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  /opt/cpanel/ea-nodejs18/bin/npm install --production
fi

# Start the server
/opt/cpanel/ea-nodejs18/bin/node server.js > express.log 2>&1 &

echo "Express server started in background. Check express.log for output."
