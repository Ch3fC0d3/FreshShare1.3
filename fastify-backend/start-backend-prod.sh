#!/bin/bash
# Production startup script with proper process management for Fastify backend

# Print commands as they execute and exit on any error
set -ex

# Set environment
export NODE_ENV=production

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Kill any existing processes
pkill -f "node server.js" || echo "No existing processes found"

# Load environment variables from .env file
if [ -f ".env" ]; then
  # Export all non-comment lines from .env
  set -a
  source .env
  set +a
  echo "Environment loaded from .env file"
fi

# Verify required variables
echo "Using PORT: ${PORT:-8080}"
echo "Using NODE_ENV: ${NODE_ENV:-production}"

# Check if database URL is defined
if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL is not set in .env file!"
  echo "Using default postgres://localhost:5432/freshshare"
fi

# Start the server in background with proper detachment
echo "Starting Fastify backend server..."
node server.js > fastify.log 2>&1 &

# Save PID
PID=$!
echo $PID > .fastify.pid
echo "Server started with PID: $PID"

# Wait briefly and verify process is running
sleep 5
if kill -0 $PID 2>/dev/null; then
  echo "Server is running with PID: $PID"
  
  # Check for server_running status file
  if [ -f ".server_running" ]; then
    echo "Server startup successful:"
    cat .server_running
    exit 0
  else
    echo "WARNING: Process is running but .server_running file not created yet."
    echo "Waiting additional time..."
    sleep 5
    if [ -f ".server_running" ]; then
      echo "Server startup successful:"
      cat .server_running
      exit 0
    else
      echo "ERROR: Server running but didn't create status file. Check logs:"
      cat fastify.log
      exit 1
    fi
  fi
else
  echo "ERROR: Server failed to start properly. Check logs:"
  cat fastify.log
  exit 1
fi
