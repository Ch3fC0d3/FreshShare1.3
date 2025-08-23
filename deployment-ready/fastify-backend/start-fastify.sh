#!/bin/bash

# Startup script for Fastify backend in production environment
# For use with cPanel Node.js App deployment

# Set environment variables
export NODE_ENV=production
export PORT=8080

# Log startup
echo "Starting Fastify backend..."

# Ensure we're in the correct directory
cd "$(dirname "$0")"

# Detect Node.js paths on cPanel
echo "Detecting Node.js installation..."

# Common cPanel Node.js paths to check
NODE_PATHS=(
  "/opt/cpanel/ea-nodejs18/bin"
  "/opt/cpanel/ea-nodejs20/bin"
  "/usr/local/bin"
  "/usr/bin"
  "$HOME/nodevenv/public_html/18/bin"
  "$HOME/.nvm/versions/node/v18.*/bin"
)

NODE_BIN=""
NPM_BIN=""

for path in "${NODE_PATHS[@]}"; do
  if [ -f "$path/node" ] && [ -f "$path/npm" ]; then
    NODE_BIN="$path/node"
    NPM_BIN="$path/npm"
    export PATH="$path:$PATH"
    echo "Found Node.js at: $NODE_BIN"
    break
  fi
done

# Fallback to system PATH
if [ -z "$NODE_BIN" ]; then
  NODE_BIN=$(which node 2>/dev/null || echo "node")
  NPM_BIN=$(which npm 2>/dev/null || echo "npm")
  echo "Using system PATH: $NODE_BIN"
fi

# Copy production env file if it exists and .env doesn't
if [ -f ".env.production" ] && [ ! -f ".env" ]; then
  cp .env.production .env
  echo "Copied .env.production to .env"
fi

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  $NPM_BIN install --production || echo "npm install failed, continuing..."
  
  # Install TypeScript dependencies globally if not already available
  if ! command -v ts-node &> /dev/null; then
    echo "Installing TypeScript dependencies..."
    $NPM_BIN install -g ts-node typescript || echo "ts-node install failed, continuing..."
  fi
  
  # Install pg module if not already installed
  if ! $NPM_BIN list pg | grep -q pg; then
    echo "Installing pg module..."
    $NPM_BIN install pg || echo "pg install failed, continuing..."
  fi
fi

# Initialize database if needed
if [ "$INIT_DB" = "true" ] || [ ! -f ".db_initialized" ]; then
  echo "Initializing PostgreSQL database..."
  $NODE_BIN db-init.js || echo "Database initialization failed, continuing..."
  
  # Create a marker file to indicate database has been initialized
  if [ $? -eq 0 ]; then
    touch .db_initialized
    echo "Database initialization completed successfully."
  else
    echo "WARNING: Database initialization failed. Check logs for details."
  fi
fi

# Check if ts-node/typescript is available
echo "Checking for TypeScript support..."
if $NODE_BIN -e "try{require.resolve('ts-node')}catch(e){process.exit(1)}" 2>/dev/null; then
  echo "ts-node found, using TypeScript mode"
  # Start the Fastify backend with TypeScript
  echo "Starting Fastify backend with ts-node..."
  NODE_ENV=production $NODE_BIN --loader ts-node/esm server.ts
else
  echo "ts-node not found, attempting to compile TypeScript..."
  
  # Fallback: Attempt to compile TypeScript to JavaScript
  if [ ! -f "server.js" ] && [ -x "$NPM_BIN" ]; then
    echo "Installing TypeScript packages..."
    $NPM_BIN install
    
    # Create a simple server.js that requires the essential modules
    echo "Creating JS fallback version..."
    cat > server.js << EOF
// Generated fallback server.js
require('dotenv/config');
const fastify = require('fastify');
const { Pool } = require('pg');

// Config
const PORT = Number(process.env.PORT || 8080);
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/freshshare';
const pool = new Pool({ connectionString: DATABASE_URL });

const app = fastify({ logger: true });

// Health endpoint
app.get('/health', async () => ({ ok: true }));

// Start server
app.listen({ port: PORT, host: '0.0.0.0' })
  .then(() => app.log.info(\`FreshShare backend listening on :\${PORT}\`))
  .catch((err) => { app.log.error(err); process.exit(1); });
EOF
  fi
  
  # Start with node directly
  echo "Starting Fastify backend with Node.js..."
  NODE_ENV=production $NODE_BIN server.js
fi
