#!/bin/bash
# Production startup script for Fastify backend

# Set environment
export NODE_ENV=production

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Load environment variables
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "Starting Fastify backend with Node.js CommonJS server"

# Start the server in background and create a PID file
node server.js > fastify.log 2>&1 &
echo $! > .fastify.pid

# Wait briefly to check if process is still running
sleep 3
if kill -0 $(cat .fastify.pid) 2>/dev/null; then
  echo "Fastify backend started successfully with PID: $(cat .fastify.pid)"
  exit 0
else
  echo "ERROR: Fastify backend failed to start properly"
  cat fastify.log
  exit 1
fi
