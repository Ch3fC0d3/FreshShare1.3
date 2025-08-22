#!/bin/bash

# Startup script for Express server in production environment
# For use with cPanel Node.js App deployment

# Set environment variables
cd "$(dirname "$0")"
export NODE_ENV=production
export PORT=3001

# Log startup
echo "Starting Express server..."

# Detect Node.js paths on cPanel
echo "Detecting Node.js installation..."

# Common cPanel Node.js paths to check
NODE_PATHS=(
  "/opt/cpanel/ea-nodejs18/bin"
  "/opt/cpanel/ea-nodejs20/bin"
  "/usr/local/bin"
  "/usr/bin"
  "$HOME/nodevenv/public_html/18/bin"
  "$HOME/.nvm/versions/node/v18.*/bin"
)

NODE_BIN=""
NPM_BIN=""

for path in "${NODE_PATHS[@]}"; do
  if [ -f "$path/node" ] && [ -f "$path/npm" ]; then
    NODE_BIN="$path/node"
    NPM_BIN="$path/npm"
    export PATH="$path:$PATH"
    echo "Found Node.js at: $NODE_BIN"
    break
  fi
done

# Fallback to system PATH
if [ -z "$NODE_BIN" ]; then
  NODE_BIN=$(which node 2>/dev/null || echo "node")
  NPM_BIN=$(which npm 2>/dev/null || echo "npm")
  echo "Using system PATH: $NODE_BIN"
fi

# Ensure we're in the correct directory
cd "$HOME/freshshare1.3"

# Copy production env file if it exists and .env doesn't
if [ -f ".env.production" ] && [ ! -f ".env" ]; then
  cp .env.production .env
  echo "Copied .env.production to .env"
fi

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  $NPM_BIN install --production || echo "npm install failed, continuing..."
fi

# Start the server
$NODE_BIN server.js > express.log 2>&1 &

echo "Express server started in background. Check express.log for output."
