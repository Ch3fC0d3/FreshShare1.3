#!/bin/bash
# Production startup script with proper process management for Fastify backend

set -e

# Ensure we run from this script's directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Activate cPanel Node.js environment so cron/manual runs have node in PATH
if [ -f "$HOME/nodevenv/freshshare1.3/18/bin/activate" ]; then
  # shellcheck disable=SC1090
  source "$HOME/nodevenv/freshshare1.3/18/bin/activate"
else
  ACTIVATE_FILE=$(find "$HOME/nodevenv" -type f -name activate 2>/dev/null | head -1)
  if [ -n "$ACTIVATE_FILE" ]; then
    # shellcheck disable=SC1090
    source "$ACTIVATE_FILE"
  else
    for p in "/opt/cpanel/ea-nodejs18/bin" "/opt/cpanel/ea-nodejs20/bin"; do
      if [ -x "$p/node" ]; then export PATH="$p:$PATH"; fi
    done
  fi
fi

# Resolve node
NODE_BIN=$(which node 2>/dev/null || true)
if [ -z "$NODE_BIN" ]; then
  echo "ERROR: node not found in PATH; cannot start Fastify backend"; exit 1
fi

# Set environment
export NODE_ENV=production

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
nohup "$NODE_BIN" server.js > fastify.log 2>&1 &

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
      echo "ERROR: Server running but didn't create status file. Recent logs:"
      tail -n 200 fastify.log || true
      exit 1
    fi
  fi
else
  echo "ERROR: Server failed to start properly. Recent logs:"
  tail -n 200 fastify.log || true
  exit 1
fi
