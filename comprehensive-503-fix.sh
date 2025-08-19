#!/bin/bash
# Comprehensive 503 Error Fix Script for FreshShare
# This script addresses all common causes of 503 errors in cPanel environments

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  FreshShare 503 Error Fix Script        ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Step 1: Kill any existing Node.js processes
echo -e "\n${YELLOW}Step 1: Stopping existing Node.js processes...${NC}"
pkill -f "node server.js"
pkill -f "node proxy-server.js"
pkill -f "node.*fastify"
echo -e "${GREEN}✓ All Node.js processes stopped${NC}"

# Step 2: Set up Node.js path
echo -e "\n${YELLOW}Step 2: Setting up Node.js environment...${NC}"
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH

# Check Node.js installation
NODE_VERSION=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
  echo -e "${RED}✗ Node.js not found in PATH${NC}"
  echo -e "${YELLOW}Trying alternative Node.js paths...${NC}"
  
  # Try different Node.js versions in cPanel
  for VERSION in 14 16 18; do
    if [ -d "$HOME/nodevenv/freshshare1.3/$VERSION/bin" ]; then
      export PATH=$HOME/nodevenv/freshshare1.3/$VERSION/bin:$PATH
      NODE_VERSION=$(node -v 2>/dev/null)
      if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Found Node.js $NODE_VERSION in $HOME/nodevenv/freshshare1.3/$VERSION/bin${NC}"
        break
      fi
    fi
  done
  
  # If still not found
  if [ -z "$NODE_VERSION" ]; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js via cPanel first.${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✓ Using Node.js $NODE_VERSION${NC}"
fi

# Step 3: Check directory structure
echo -e "\n${YELLOW}Step 3: Checking directory structure...${NC}"
if [ ! -d "$HOME/public_html" ]; then
  echo -e "${RED}✗ public_html directory not found${NC}"
  exit 1
fi

if [ ! -d "$HOME/fastify-backend" ]; then
  echo -e "${YELLOW}! fastify-backend directory not found, creating it...${NC}"
  mkdir -p $HOME/fastify-backend
fi

# Step 4: Set up environment variables
echo -e "\n${YELLOW}Step 4: Setting up environment variables...${NC}"

# Create .env for Fastify backend
echo -e "${BLUE}Creating .env file for Fastify backend...${NC}"
cat > $HOME/fastify-backend/.env << 'EOF'
PORT=8080
NODE_ENV=production
# Add your MongoDB connection string here
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/freshshare?retryWrites=true&w=majority
JWT_SECRET=your-jwt-secret-key
EOF
echo -e "${GREEN}✓ Created Fastify .env file${NC}"

# Create config-temp.js for Express
echo -e "${BLUE}Creating config-temp.js for Express server...${NC}"
cat > $HOME/public_html/config-temp.js << 'EOF'
process.env.MONGODB_URI = "mongodb+srv://username:password@cluster.mongodb.net/freshshare?retryWrites=true&w=majority";
process.env.JWT_SECRET = "your-jwt-secret-key";
process.env.FASTIFY_BACKEND_URL = "http://localhost:8080";
EOF
echo -e "${GREEN}✓ Created config-temp.js file${NC}"
echo -e "${YELLOW}! Please edit these files with your actual MongoDB credentials${NC}"

# Step 5: Create startup scripts
echo -e "\n${YELLOW}Step 5: Creating startup scripts...${NC}"

# Express server startup script
echo -e "${BLUE}Creating Express server startup script...${NC}"
cat > $HOME/public_html/start-express.sh << 'EOF'
#!/bin/bash
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH
export NODE_ENV=production
export PORT=3001
export FASTIFY_BACKEND_URL=http://localhost:8080

cd $HOME/public_html

# Check for dependencies
if [ ! -d "node_modules" ] || [ ! -d "node_modules/express" ]; then
  echo "Installing dependencies..."
  npm install express http-proxy-middleware cookie-parser jsonwebtoken
fi

# Start the server
node server.js > express.log 2>&1 &
echo "Express server started on port 3001"
EOF
echo -e "${GREEN}✓ Created Express startup script${NC}"

# Fastify backend startup script
echo -e "${BLUE}Creating Fastify backend startup script...${NC}"
cat > $HOME/fastify-backend/start-fastify.sh << 'EOF'
#!/bin/bash
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH
export NODE_ENV=production
export PORT=8080

cd $HOME/fastify-backend

# Check for dependencies
if [ ! -d "node_modules" ] || [ ! -d "node_modules/fastify" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Check if we have TypeScript files
if [ -f "server.ts" ]; then
  echo "Starting TypeScript server..."
  npx ts-node server.ts > fastify.log 2>&1 &
elif [ -f "server.js" ]; then
  echo "Starting JavaScript server..."
  node server.js > fastify.log 2>&1 &
else
  echo "Error: No server.ts or server.js found!"
  exit 1
fi

echo "Fastify backend started on port 8080"
EOF
echo -e "${GREEN}✓ Created Fastify startup script${NC}"

# Step 6: Make scripts executable
echo -e "\n${YELLOW}Step 6: Setting executable permissions...${NC}"
chmod +x $HOME/public_html/start-express.sh
chmod +x $HOME/fastify-backend/start-fastify.sh
echo -e "${GREEN}✓ Set executable permissions${NC}"

# Step 7: Configure Apache
echo -e "\n${YELLOW}Step 7: Configuring Apache...${NC}"
cat > $HOME/public_html/.htaccess << 'EOF'
# Enable mod_rewrite and mod_proxy
RewriteEngine On
ProxyPreserveHost On
ProxyTimeout 600
Timeout 600

# Set the base for rewrite rules
RewriteBase /

# Don't rewrite files or directories
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Proxy API requests to Fastify backend
RewriteRule ^api/pack/(.*)$ http://localhost:8080/$1 [P,L]

# Maintain JWT authentication
RewriteCond %{HTTP:Authorization} ^(.*)
RewriteRule .* - [e=HTTP_AUTHORIZATION:%1]

# Proxy everything else to Express server
RewriteRule ^(.*)$ http://localhost:3001/$1 [P,L]

# Set security headers
<IfModule mod_headers.c>
    Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; img-src 'self' data: blob:; font-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net;"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Enable CORS
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    Header set Access-Control-Allow-Credentials "true"
</IfModule>

# Handle OPTIONS requests for CORS preflight
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
EOF
echo -e "${GREEN}✓ Created .htaccess file${NC}"

# Step 8: Start services
echo -e "\n${YELLOW}Step 8: Starting services...${NC}"
echo -e "${BLUE}Starting Fastify backend...${NC}"
cd $HOME/fastify-backend
./start-fastify.sh
sleep 5

echo -e "${BLUE}Starting Express server...${NC}"
cd $HOME/public_html
./start-express.sh
sleep 3

# Step 9: Verify services
echo -e "\n${YELLOW}Step 9: Verifying services...${NC}"
FASTIFY_RUNNING=$(ps aux | grep -v grep | grep -c "server.ts\|server.js")
EXPRESS_RUNNING=$(ps aux | grep -v grep | grep -c "server.js")

if [ $FASTIFY_RUNNING -gt 0 ] && [ $EXPRESS_RUNNING -gt 0 ]; then
  echo -e "${GREEN}✓ Both services are running!${NC}"
else
  echo -e "${RED}✗ One or both services failed to start. Checking logs...${NC}"
  echo -e "\n${BLUE}Fastify log:${NC}"
  tail -20 $HOME/fastify-backend/fastify.log
  echo -e "\n${BLUE}Express log:${NC}"
  tail -20 $HOME/public_html/express.log
fi

# Step 10: Set up cron jobs
echo -e "\n${YELLOW}Step 10: Setting up automatic restart...${NC}"
CRON_FILE=$(mktemp)
crontab -l > $CRON_FILE 2>/dev/null || true
if ! grep -q "start-fastify.sh" $CRON_FILE; then
  echo "@reboot $HOME/fastify-backend/start-fastify.sh" >> $CRON_FILE
  echo "@reboot sleep 10 && $HOME/public_html/start-express.sh" >> $CRON_FILE
  crontab $CRON_FILE
  echo -e "${GREEN}✓ Added cron jobs for automatic restart${NC}"
else
  echo -e "${YELLOW}! Cron jobs already exist${NC}"
fi
rm $CRON_FILE

# Step 11: Create connection test script
echo -e "\n${YELLOW}Step 11: Creating connection test script...${NC}"
cat > $HOME/public_html/test-connection.js << 'EOF'
const http = require('http');

console.log('Testing connections...');

// Test Express server
console.log('\nTesting Express server (localhost:3001)...');
http.get('http://localhost:3001/', (res) => {
  console.log(`Express status: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`Express response: ${chunk.toString().substring(0, 100)}...`);
  });
}).on('error', (err) => {
  console.error(`Express error: ${err.message}`);
});

// Test Fastify backend
console.log('\nTesting Fastify backend (localhost:8080)...');
http.get('http://localhost:8080/health', (res) => {
  console.log(`Fastify status: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`Fastify response: ${chunk.toString()}`);
  });
}).on('error', (err) => {
  console.error(`Fastify error: ${err.message}`);
});

// Test proxy forwarding
console.log('\nTesting proxy forwarding (localhost:3001/api/pack/health)...');
http.get('http://localhost:3001/api/pack/health', (res) => {
  console.log(`Proxy status: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`Proxy response: ${chunk.toString()}`);
  });
}).on('error', (err) => {
  console.error(`Proxy error: ${err.message}`);
});
EOF
echo -e "${GREEN}✓ Created connection test script${NC}"

# Final summary
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${GREEN}FreshShare 503 Error Fix Complete!${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "\n${YELLOW}What to do next:${NC}"
echo -e "1. Edit the MongoDB connection strings in:"
echo -e "   - $HOME/fastify-backend/.env"
echo -e "   - $HOME/public_html/config-temp.js"
echo -e "2. Test the connection: ${BLUE}cd $HOME/public_html && node test-connection.js${NC}"
echo -e "3. Check server logs if issues persist:"
echo -e "   - ${BLUE}tail -f $HOME/fastify-backend/fastify.log${NC}"
echo -e "   - ${BLUE}tail -f $HOME/public_html/express.log${NC}"
echo -e "4. Check Apache error logs: ${BLUE}tail -100 /var/log/apache2/error_log${NC}"
echo -e "\n${GREEN}If you still see 503 errors, please contact support with these logs.${NC}"
