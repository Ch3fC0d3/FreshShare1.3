#!/bin/bash
# Express server startup script

# Set environment
export NODE_ENV=production

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Kill any existing processes
pkill -f "node $DIR/server.js" || echo "No existing Express processes found"

# Activate Node.js environment
source ./activate-node.sh

# Load environment variables from .env file
if [ -f ".env" ]; then
  # Export all non-comment lines from .env
  set -a
  source .env
  set +a
  echo "Environment loaded from .env file"
fi

# Start the server in background with proper detachment
echo "Starting Express server..."
node server.js > express.log 2>&1 &

# Save PID
PID=$!
echo $PID > .pid
echo "Server started with PID: $PID"

# Wait briefly and verify process is running
sleep 5
if kill -0 $PID 2>/dev/null; then
  echo "Express server is running with PID: $PID"
else
  echo "ERROR: Express server failed to start properly. Check logs:"
  cat express.log
  exit 1
fi
