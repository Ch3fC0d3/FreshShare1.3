#!/bin/bash

# Startup script for Fastify backend in production environment
# For use with cPanel Node.js App deployment

# Set environment variables
export NODE_ENV=production
export PORT=8080
export PATH=/opt/cpanel/ea-nodejs18/bin:$PATH
export NODE_PATH=/opt/cpanel/ea-nodejs18/lib/node_modules

# Log startup
echo "Starting Fastify backend..."

# Ensure we're in the correct directory
cd "$(dirname "$0")"

# Copy production env file if it exists and .env doesn't
if [ -f ".env.production" ] && [ ! -f ".env" ]; then
  cp .env.production .env
  echo "Copied .env.production to .env"
fi

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  /opt/cpanel/ea-nodejs18/bin/npm install --production
  
  # Install TypeScript dependencies globally if not already available
  if ! command -v ts-node &> /dev/null; then
    echo "Installing TypeScript dependencies..."
    /opt/cpanel/ea-nodejs18/bin/npm install -g ts-node typescript
  fi
  
  # Install pg module if not already installed
  if ! /opt/cpanel/ea-nodejs18/bin/npm list pg | grep -q pg; then
    echo "Installing pg module..."
    /opt/cpanel/ea-nodejs18/bin/npm install pg
  fi
fi

# Initialize database if needed
if [ "$INIT_DB" = "true" ] || [ ! -f ".db_initialized" ]; then
  echo "Initializing PostgreSQL database..."
  /opt/cpanel/ea-nodejs18/bin/node db-init.js
  
  # Create a marker file to indicate database has been initialized
  if [ $? -eq 0 ]; then
    touch .db_initialized
    echo "Database initialization completed successfully."
  else
    echo "WARNING: Database initialization failed. Check logs for details."
  fi
fi

# Start the Fastify backend
echo "Starting Fastify backend..."
NODE_ENV=production /opt/cpanel/ea-nodejs18/bin/node --loader ts-node/esm server.ts
