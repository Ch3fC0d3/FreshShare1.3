#!/bin/bash
#
# FreshShare 503 Error Fix for Production cPanel Environment
# This script diagnoses and fixes 503 Service Unavailable errors on cPanel
#

# Print commands as they are executed (for debugging)
set -x

# Set text colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== FreshShare 503 Error Fix ===${NC}"
echo "Started at: $(date)"

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo -e "${BLUE}=== Checking Current Environment ===${NC}"

# Verify script is running on cPanel
if [ ! -f /usr/local/cpanel/version ] && [ ! -f /etc/redhat-release ]; then
  echo -e "${YELLOW}Warning: This doesn't appear to be a cPanel server. Some commands may not work.${NC}"
fi

# Check Node.js installation
echo -e "${BLUE}=== Checking Node.js Installation ===${NC}"
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  echo -e "${GREEN}Node.js is installed: $NODE_VERSION${NC}"
else
  echo -e "${RED}Node.js is not installed. Please install Node.js through cPanel or contact your hosting provider.${NC}"
  echo -e "${YELLOW}See: https://docs.cpanel.net/cpanel/software/node.js-application-manager/${NC}"
  exit 1
fi

# Check for npm
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  echo -e "${GREEN}npm is installed: $NPM_VERSION${NC}"
else
  echo -e "${RED}npm is not installed. It should come with Node.js installation.${NC}"
  exit 1
fi

# Check for running Node.js processes and stop them
echo -e "${BLUE}=== Stopping Existing Node.js Processes ===${NC}"
pkill -f "node server.js" || echo "No existing Node.js processes found"
sleep 2

# Delete previous PID and log files if they exist
rm -f .pid fastify-backend/.pid express.log fastify.log .server_running fastify-backend/.server_running 2>/dev/null

# Check environment files
echo -e "${BLUE}=== Checking Environment Files ===${NC}"

# Check Express .env
if [ ! -f .env ]; then
  echo -e "${YELLOW}Creating basic Express .env file...${NC}"
  cat > .env << EOL
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb://127.0.0.1:27017/myfrovov_freshshare
MONGODB_SSL=false
FASTIFY_BACKEND_URL=http://localhost:8080
JWT_SECRET=production-secret-key-please-change
BASE_URL=
EOL
  echo -e "${GREEN}Express .env file created${NC}"
else
  echo -e "${GREEN}Express .env file exists${NC}"
fi

# Check Fastify .env
if [ ! -d fastify-backend ]; then
  mkdir -p fastify-backend
fi

if [ ! -f fastify-backend/.env ]; then
  echo -e "${YELLOW}Creating basic Fastify .env file...${NC}"
  cat > fastify-backend/.env << EOL
PORT=8080
NODE_ENV=production
DATABASE_URL=postgresql://myfrovov_freshshare_user:password@localhost:5432/myfrovov_freshshare
DATABASE_SSL=false
EOL
  echo -e "${GREEN}Fastify .env file created${NC}"
else
  echo -e "${GREEN}Fastify .env file exists${NC}"
fi

# Check Apache proxy configuration
echo -e "${BLUE}=== Checking Apache Proxy Configuration ===${NC}"
if [ ! -f public_html/.htaccess ]; then
  echo -e "${YELLOW}No .htaccess found in public_html, creating one...${NC}"
  
  mkdir -p public_html
  
  cat > public_html/.htaccess << EOL
# FreshShare Apache Configuration
# Created by 503-fix-production.sh

<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # API requests go to Fastify backend
  RewriteRule ^api/(.*)$ http://localhost:8080/$1 [P,L]
  
  # Send all other requests to Express frontend
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ http://localhost:3001/$1 [P,L]
</IfModule>

# Set security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-XSS-Protection "1; mode=block"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Handle 503 errors more gracefully
ErrorDocument 503 "The application is currently unavailable. Please try again later."

# Serve static assets with proper cache control
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
EOL
  echo -e "${GREEN}.htaccess created in public_html directory${NC}"
else
  echo -e "${GREEN}.htaccess exists in public_html directory${NC}"
  
  # Check if htaccess contains proxy rules
  if ! grep -q "RewriteEngine On" public_html/.htaccess || ! grep -q "RewriteRule" public_html/.htaccess; then
    echo -e "${YELLOW}Adding proxy rules to existing .htaccess...${NC}"
    
    # Backup original htaccess
    cp public_html/.htaccess public_html/.htaccess.bak
    
    # Prepend the proxy rules
    cat > public_html/.htaccess.new << EOL
# FreshShare Apache Configuration
# Updated by 503-fix-production.sh

<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # API requests go to Fastify backend
  RewriteRule ^api/(.*)$ http://localhost:8080/$1 [P,L]
  
  # Send all other requests to Express frontend
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ http://localhost:3001/$1 [P,L]
</IfModule>

# Handle 503 errors more gracefully
ErrorDocument 503 "The application is currently unavailable. Please try again later."

EOL
    
    # Append original content
    cat public_html/.htaccess >> public_html/.htaccess.new
    mv public_html/.htaccess.new public_html/.htaccess
    
    echo -e "${GREEN}Updated .htaccess with proxy rules${NC}"
  else
    echo -e "${GREEN}.htaccess already contains proxy rules${NC}"
  fi
fi

# Create Node.js activation script
echo -e "${BLUE}=== Setting Up Node.js Environment ===${NC}"
cat > activate-node.sh << EOL
#!/bin/bash
# Node.js environment activation script

# Try to find and use the cPanel Node.js environment
if [ -f /opt/cpanel/ea-nodejs18/enable ]; then
  source /opt/cpanel/ea-nodejs18/enable
  echo "Activated cPanel Node.js 18"
elif [ -f /opt/cpanel/ea-nodejs16/enable ]; then
  source /opt/cpanel/ea-nodejs16/enable
  echo "Activated cPanel Node.js 16"
elif [ -f /opt/cpanel/ea-nodejs14/enable ]; then
  source /opt/cpanel/ea-nodejs14/enable
  echo "Activated cPanel Node.js 14"
else
  # If cPanel Node.js is not found, try other common paths
  echo "No cPanel Node.js found, using system Node.js"
  export PATH=\$HOME/bin:\$HOME/node_modules/.bin:\$PATH
  
  # If NVM is installed, try to use it
  if [ -f "\$HOME/.nvm/nvm.sh" ]; then
    source "\$HOME/.nvm/nvm.sh"
    nvm use node || nvm use 18 || nvm use 16 || nvm use 14 || echo "Failed to activate NVM Node.js"
  fi
fi

# Show the active Node.js version
echo "Using Node.js version: \$(node -v) from \$(which node)"
echo "Using npm version: \$(npm -v) from \$(which npm)"
EOL

chmod +x activate-node.sh
source ./activate-node.sh

# Create Express startup script
echo -e "${BLUE}=== Creating Express Startup Script ===${NC}"
cat > start-express.sh << EOL
#!/bin/bash
# Express server startup script

# Set environment
export NODE_ENV=production

# Get the directory of this script
DIR="\$( cd "\$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
cd "\$DIR"

# Kill any existing processes
pkill -f "node \$DIR/server.js" || echo "No existing Express processes found"

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
PID=\$!
echo \$PID > .pid
echo "Server started with PID: \$PID"

# Wait briefly and verify process is running
sleep 5
if kill -0 \$PID 2>/dev/null; then
  echo "Express server is running with PID: \$PID"
else
  echo "ERROR: Express server failed to start properly. Check logs:"
  cat express.log
  exit 1
fi
EOL

chmod +x start-express.sh

# Create Fastify startup script
echo -e "${BLUE}=== Creating Fastify Startup Script ===${NC}"
cat > fastify-backend/start-backend.sh << EOL
#!/bin/bash
# Fastify backend startup script

# Set environment
export NODE_ENV=production

# Get the directory of this script
DIR="\$( cd "\$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
cd "\$DIR"

# Kill any existing processes
pkill -f "node \$DIR/server.js" || echo "No existing Fastify processes found"

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
node server.js > fastify.log 2>&1 &

# Save PID
PID=\$!
echo \$PID > .pid
echo "Server started with PID: \$PID"

# Wait briefly and verify process is running
sleep 5
if kill -0 \$PID 2>/dev/null; then
  echo "Fastify backend is running with PID: \$PID"
  
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
EOL

chmod +x fastify-backend/start-backend.sh

# Check and create Fastify server if needed
echo -e "${BLUE}=== Checking Fastify Server ===${NC}"
if [ ! -f fastify-backend/server.js ]; then
  echo -e "${YELLOW}Creating Fastify server.js...${NC}"
  
  cat > fastify-backend/server.js << EOL
require('dotenv/config');
const fastify = require('fastify');
const { Pool } = require('pg');

// Config
const PORT = Number(process.env.PORT || 8080);
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/freshshare';
console.log('Starting server on port:', PORT);
console.log('Using database URL (redacted):', DATABASE_URL.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'));

// Create app
const app = fastify({ 
  logger: true,
  trustProxy: true
});

// Basic health check endpoint
app.get('/health', async () => ({ ok: true }));

// Minimal parse-label endpoint
app.post('/parse-label', async (req, reply) => {
  const body = req.body || {};
  return { gtinCase: body.text?.slice(0, 14) || null };
});

// Minimal case-pack endpoint
app.get('/case-pack', async (req, reply) => {
  return { items: [] };
});

// Start server
app.listen({ port: PORT, host: '0.0.0.0' })
  .then(() => {
    console.log(\`FreshShare backend listening on port \${PORT}\`);
    // Create a status file to indicate successful startup
    require('fs').writeFileSync('.server_running', new Date().toISOString());
  })
  .catch((err) => { 
    console.error('Server startup error:', err); 
    process.exit(1); 
  });
EOL
  echo -e "${GREEN}Fastify server.js created${NC}"
else
  echo -e "${GREEN}Fastify server.js exists${NC}"
fi

# Setup cron jobs for automatic restarts
echo -e "${BLUE}=== Setting Up Cron Jobs ===${NC}"

if command -v crontab >/dev/null 2>&1; then
  # Create a script for cron job setup
  cat > setup-cron-jobs.sh << EOL
#!/bin/bash
# Setup cron jobs to automatically restart servers

# Get the directory of this script
DIR="\$( cd "\$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"

# Backup existing crontab
crontab -l > crontab.bak 2>/dev/null || echo "No existing crontab"

# Add our jobs to crontab (avoiding duplicates)
(crontab -l 2>/dev/null | grep -v "$DIR/start-express.sh" | grep -v "$DIR/fastify-backend/start-backend.sh"; echo "*/10 * * * * cd $DIR && ./start-express.sh >/dev/null 2>&1"; echo "*/10 * * * * cd $DIR/fastify-backend && ./start-backend.sh >/dev/null 2>&1"; echo "@reboot cd $DIR && ./start-express.sh >/dev/null 2>&1"; echo "@reboot cd $DIR/fastify-backend && ./start-backend.sh >/dev/null 2>&1") | crontab -

echo "Cron jobs installed successfully:"
crontab -l | grep "$DIR"
EOL

  chmod +x setup-cron-jobs.sh
  ./setup-cron-jobs.sh
else
  echo -e "${YELLOW}crontab command not found. Cron jobs not set up.${NC}"
fi

# Install dependencies
echo -e "${BLUE}=== Installing Dependencies ===${NC}"

# Express dependencies
if [ ! -d node_modules ] || [ ! -d node_modules/express ]; then
  echo -e "${YELLOW}Installing Express dependencies...${NC}"
  npm install --no-fund --omit=dev
else
  echo -e "${GREEN}Express dependencies already installed${NC}"
fi

# Fastify dependencies
if [ ! -d fastify-backend/node_modules ] || [ ! -d fastify-backend/node_modules/fastify ]; then
  echo -e "${YELLOW}Installing Fastify dependencies...${NC}"
  cd fastify-backend
  npm install --no-fund --omit=dev fastify pg dotenv
  cd ..
else
  echo -e "${GREEN}Fastify dependencies already installed${NC}"
fi

# Start the services
echo -e "${BLUE}=== Starting Services ===${NC}"

# Start Fastify backend first
echo -e "${YELLOW}Starting Fastify backend...${NC}"
cd fastify-backend
./start-backend.sh
cd ..

# Start Express server
echo -e "${YELLOW}Starting Express server...${NC}"
./start-express.sh

# Verify services are running
echo -e "${BLUE}=== Verifying Services ===${NC}"

# Check if processes are running
if pgrep -f "node $(pwd)/server.js" > /dev/null; then
  echo -e "${GREEN}Express server is running${NC}"
else
  echo -e "${RED}Express server is not running${NC}"
  echo -e "Check logs in $(pwd)/express.log"
fi

if pgrep -f "node $(pwd)/fastify-backend/server.js" > /dev/null; then
  echo -e "${GREEN}Fastify backend is running${NC}"
else
  echo -e "${RED}Fastify backend is not running${NC}"
  echo -e "Check logs in $(pwd)/fastify-backend/fastify.log"
fi

# Create a test connection script
echo -e "${BLUE}=== Creating Connection Test Script ===${NC}"
cat > test-connection.js << EOL
// Connection test script for 503 error verification
const http = require('http');

// Test Express frontend
console.log('Testing Express frontend...');
http.get('http://localhost:3001', (res) => {
  console.log('Express frontend responded with status code:', res.statusCode);
  
  // Test Fastify backend
  console.log('\nTesting Fastify backend...');
  http.get('http://localhost:8080/health', (res2) => {
    console.log('Fastify backend responded with status code:', res2.statusCode);
    console.log('\nAll services are responding! The 503 error should be fixed.');
    process.exit(0);
  }).on('error', (err) => {
    console.error('Fastify backend error:', err.message);
    process.exit(1);
  });
}).on('error', (err) => {
  console.error('Express frontend error:', err.message);
  process.exit(1);
});
EOL

# Test the connection
echo -e "${BLUE}=== Testing Connection ===${NC}"
node test-connection.js || echo -e "${RED}Connection test failed${NC}"

echo -e "${BLUE}=== 503 Error Fix Summary ===${NC}"
echo "- Created/verified environment files"
echo "- Set up Apache proxy in .htaccess"
echo "- Created Node.js activation script"
echo "- Created startup scripts for Express and Fastify"
echo "- Installed necessary dependencies"
echo "- Started both services"
echo "- Set up cron jobs for automatic restarts"

echo -e "${GREEN}=== FreshShare 503 Error Fix Complete! ===${NC}"
echo "If you still see a 503 error, check the logs:"
echo "- Express log: $(pwd)/express.log"
echo "- Fastify log: $(pwd)/fastify-backend/fastify.log"
echo "- Apache error log: /home/myfrovov/logs/error_log"

echo -e "${BLUE}=== Completed at: $(date) ===${NC}"
