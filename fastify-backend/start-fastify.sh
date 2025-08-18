#!/bin/bash

# Startup script for Fastify backend in production environment
# For use with cPanel Node.js App deployment

# Ensure we're in the correct directory
cd "$HOME/fastify-backend"

# Copy production env file if it exists and .env doesn't
if [ -f ".env.production" ] && [ ! -f ".env" ]; then
  cp .env.production .env
  echo "Copied .env.production to .env"
fi

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install --production
  
  # Install TypeScript dependencies globally if not already available
  if ! command -v ts-node &> /dev/null; then
    echo "Installing TypeScript dependencies..."
    npm install -g ts-node typescript
  fi
  
  # Install pg module if not already installed
  if ! npm list pg | grep -q pg; then
    echo "Installing pg module..."
    npm install pg
  fi
fi

# Initialize database if needed
if [ "$INIT_DB" = "true" ] || [ ! -f ".db_initialized" ]; then
  echo "Initializing PostgreSQL database..."
  node db-init.js
  
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
NODE_ENV=production node --loader ts-node/esm server.ts
