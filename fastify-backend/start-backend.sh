#!/bin/bash
# Fastify backend startup script

# Set environment
export NODE_ENV=production

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Kill any existing processes
# Kill the TypeScript process specifically to avoid conflicts with the main express server
pkill -f "server.ts" || echo "No existing Fastify processes found"

# Activate Node.js environment
source ../activate-node.sh

# Load environment variables from .env file
if [ -f ".env" ]; then
  # Export all non-comment lines from .env
  set -a
  source .env
  set +a
  echo "Environment loaded from .env file"
fi

# Start the server in background with proper detachment
echo "Starting Fastify backend..."
# Use ts-node loader to run the TypeScript source directly, as defined in package.json
node --loader ts-node/esm server.ts > fastify.log 2>&1 &

# Save PID
PID=$!
echo $PID > .pid
echo "Server started with PID: $PID"

# Wait briefly and verify process is running
sleep 5
if kill -0 $PID 2>/dev/null; then
  echo "Fastify backend is running with PID: $PID"

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
  echo "ERROR: Fastify backend failed to start properly. Check logs:"
  cat fastify.log
  exit 1
fi
