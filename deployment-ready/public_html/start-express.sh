#!/bin/bash

# Startup script for Express server in production environment
# For use with cPanel Node.js App deployment

# Set environment variables
export NODE_ENV=production
export PORT=3001

# Log startup
echo "Starting Express server..."

# Navigate to the project directory
cd "$(dirname "$0")"

# Set path to cPanel Node.js
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH

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
  npm install
fi

# Start the server
node server.js > express.log 2>&1 &

echo "Express server started in background. Check express.log for output."
