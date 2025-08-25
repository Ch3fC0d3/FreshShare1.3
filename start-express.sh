#!/bin/bash

# Startup script for Express server in production environment
# For use with cPanel Node.js App deployment

set -e

# Set environment variables
export NODE_ENV=production
export PORT=3001

echo "Starting Express server..."

# Activate the cPanel Node.js environment if available
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

# Resolve node and npm
NODE_BIN=$(which node 2>/dev/null || true)
NPM_BIN=$(which npm 2>/dev/null || true)
echo "Detected NODE_BIN=${NODE_BIN:-missing}"
echo "Detected NPM_BIN=${NPM_BIN:-missing}"
if [ -z "$NODE_BIN" ] || [ -z "$NPM_BIN" ]; then
  echo "ERROR: node or npm not found in PATH; ensure cPanel Node.js app is activated."; exit 1
fi

# Determine project root: prefer repositories/FreshShare1.3 if present
if [ -d "$HOME/repositories/FreshShare1.3" ]; then
  PROJECT_ROOT="$HOME/repositories/FreshShare1.3"
elif [ -d "$HOME/freshshare1.3" ]; then
  PROJECT_ROOT="$HOME/freshshare1.3"
else
  echo "ERROR: Could not find project root in ~/repositories/FreshShare1.3 or ~/freshshare1.3"; exit 1
fi
echo "Using project root: $PROJECT_ROOT"
cd "$PROJECT_ROOT"

# Copy production env file if it exists and .env doesn't
if [ -f ".env.production" ] && [ ! -f ".env" ]; then
  cp .env.production .env
  echo "Copied .env.production to .env"
fi

# Dependency installation is managed by cPanel Node.js App UI.
# Do NOT run npm install here to avoid CloudLinux nodevenv conflicts.
echo "Skipping npm install (managed via cPanel UI)."

# Start the server
nohup "$NODE_BIN" server.js > "$PROJECT_ROOT/express.log" 2>&1 &
echo "Express server started in background (PID $!). Check $PROJECT_ROOT/express.log for output."
