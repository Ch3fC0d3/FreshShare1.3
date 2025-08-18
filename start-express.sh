#!/bin/bash

# Startup script for Express server in production environment
# For use with cPanel Node.js App deployment

# Ensure we're in the correct directory
cd "$HOME/public_html"

# Copy production env file if it exists and .env doesn't
if [ -f ".env.production" ] && [ ! -f ".env" ]; then
  cp .env.production .env
  echo "Copied .env.production to .env"
fi

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install --production
fi

# Start the Express server
echo "Starting Express server..."
NODE_ENV=production node server.js
