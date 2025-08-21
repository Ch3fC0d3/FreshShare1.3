#!/bin/bash
# FreshShare One-Click Deployment Script
# This script automates the deployment of the Node.js-only solution to your production server

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Banner
echo -e "${GREEN}"
echo "=================================================="
echo "  FreshShare One-Click Deployment Script"
echo "=================================================="
echo -e "${NC}"

# Check if running on the production server
echo -e "${YELLOW}Checking environment...${NC}"
if [ ! -d "$HOME/public_html" ]; then
  echo -e "${RED}Error: This script must be run on your production server with a ~/public_html directory.${NC}"
  exit 1
fi

# Create directories if they don't exist
echo -e "${YELLOW}Creating directory structure...${NC}"
mkdir -p ~/public_html
mkdir -p ~/fastify-backend

# Check if Node.js is installed
echo -e "${YELLOW}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js is not installed. Please install Node.js v14+ before continuing.${NC}"
  exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d '.' -f 1)
if [ "$NODE_MAJOR" -lt 14 ]; then
  echo -e "${RED}Error: Node.js version 14+ is required. Current version: $NODE_VERSION${NC}"
  exit 1
fi

# Create Express server environment file
echo -e "${YELLOW}Creating Express server environment file...${NC}"
cat > ~/public_html/.env << EOL
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freshshare
JWT_SECRET=your-jwt-secret-key
FASTIFY_BACKEND_URL=http://localhost:8080
EOL

# Create Fastify backend environment file
echo -e "${YELLOW}Creating Fastify backend environment file...${NC}"
cat > ~/fastify-backend/.env << EOL
PORT=8080
NODE_ENV=production
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/freshshare
JWT_SECRET=your-jwt-secret-key
EOL

# Create Express startup script
echo -e "${YELLOW}Creating Express startup script...${NC}"
cat > ~/public_html/start-express.sh << EOL
#!/bin/bash
export PATH=\$HOME/nodevenv/freshshare1.3/14/bin:\$PATH
cd \$HOME/public_html

# Load environment variables
if [ -f ".env" ]; then
  export \$(grep -v '^#' .env | xargs)
fi

# Check for dependencies
if [ ! -d "node_modules" ] || [ ! -d "node_modules/express" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the server
echo "Starting Express server on port \$PORT..."
node server.js > express.log 2>&1 &
echo \$! > express.pid
echo "Express server started with PID \$(cat express.pid)"
EOL

# Create Fastify startup script
echo -e "${YELLOW}Creating Fastify startup script...${NC}"
cat > ~/fastify-backend/start-fastify.sh << EOL
#!/bin/bash
export PATH=\$HOME/nodevenv/freshshare1.3/14/bin:\$PATH
cd \$HOME/fastify-backend

# Load environment variables
if [ -f ".env" ]; then
  export \$(grep -v '^#' .env | xargs)
fi

# Check for dependencies
if [ ! -d "node_modules" ] || [ ! -d "node_modules/fastify" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the server
echo "Starting Fastify backend on port \$PORT..."
npx ts-node server.ts > fastify.log 2>&1 &
echo \$! > fastify.pid
echo "Fastify backend started with PID \$(cat fastify.pid)"
EOL

# Create cron job setup script
echo -e "${YELLOW}Creating cron job setup script...${NC}"
cat > ~/public_html/setup-cron-jobs.sh << EOL
#!/bin/bash
# Setup cron jobs for automatic restart of FreshShare services

echo "Setting up cron jobs for automatic restart..."

# Remove any existing cron jobs for these services to avoid duplicates
(crontab -l 2>/dev/null || echo "") | grep -v "start-fastify\\.sh\\|start-express\\.sh" > temp_cron

# Add reboot cron jobs
echo "@reboot ~/fastify-backend/start-fastify.sh" >> temp_cron
echo "@reboot sleep 10 && ~/public_html/start-express.sh" >> temp_cron

# Add monitoring cron jobs (every 5 minutes)
echo "*/5 * * * * if ! pgrep -f \\"node.*server.ts\\" > /dev/null; then cd ~/fastify-backend && ./start-fastify.sh; fi" >> temp_cron
echo "*/5 * * * * if ! pgrep -f \\"node server.js\\" > /dev/null; then cd ~/public_html && ./start-express.sh; fi" >> temp_cron

# Install the new crontab
crontab temp_cron
rm temp_cron

echo "Cron jobs installed successfully!"
EOL

# Set execute permissions
echo -e "${YELLOW}Setting execute permissions on scripts...${NC}"
chmod +x ~/public_html/start-express.sh
chmod +x ~/fastify-backend/start-fastify.sh
chmod +x ~/public_html/setup-cron-jobs.sh

# Prompt for MongoDB connection string
echo -e "${YELLOW}Please enter your MongoDB Atlas connection string:${NC}"
read -p "MongoDB URI: " mongodb_uri
if [ -n "$mongodb_uri" ]; then
  sed -i "s|mongodb+srv://username:password@cluster.mongodb.net/freshshare|$mongodb_uri|g" ~/public_html/.env
  sed -i "s|mongodb+srv://username:password@cluster.mongodb.net/freshshare|$mongodb_uri|g" ~/fastify-backend/.env
  echo -e "${GREEN}MongoDB connection string updated.${NC}"
fi

# Prompt for JWT secret
echo -e "${YELLOW}Please enter a strong JWT secret key:${NC}"
read -p "JWT Secret: " jwt_secret
if [ -n "$jwt_secret" ]; then
  sed -i "s|your-jwt-secret-key|$jwt_secret|g" ~/public_html/.env
  sed -i "s|your-jwt-secret-key|$jwt_secret|g" ~/fastify-backend/.env
  echo -e "${GREEN}JWT secret key updated.${NC}"
fi

# Install dependencies
echo -e "${YELLOW}Installing Express server dependencies...${NC}"
cd ~/public_html
npm install express http-proxy-middleware jsonwebtoken mongoose cors ejs dotenv

echo -e "${YELLOW}Installing Fastify backend dependencies...${NC}"
cd ~/fastify-backend
npm install fastify @fastify/cors @fastify/jwt dotenv ts-node typescript @types/node

# Setup cron jobs
echo -e "${YELLOW}Setting up cron jobs...${NC}"
bash ~/public_html/setup-cron-jobs.sh

# Start services
echo -e "${YELLOW}Starting Fastify backend...${NC}"
cd ~/fastify-backend
./start-fastify.sh

echo -e "${YELLOW}Starting Express server...${NC}"
cd ~/public_html
./start-express.sh

# Verify services are running
echo -e "${YELLOW}Verifying services...${NC}"
sleep 5
EXPRESS_RUNNING=$(pgrep -f "node server.js" | wc -l)
FASTIFY_RUNNING=$(pgrep -f "node.*server.ts" | wc -l)

if [ "$EXPRESS_RUNNING" -gt 0 ] && [ "$FASTIFY_RUNNING" -gt 0 ]; then
  echo -e "${GREEN}Success! Both services are running.${NC}"
  echo -e "${GREEN}Express server: http://localhost:3001${NC}"
  echo -e "${GREEN}Fastify backend: http://localhost:8080${NC}"
else
  echo -e "${RED}Warning: One or both services may not be running.${NC}"
  echo -e "${YELLOW}Check the logs for errors:${NC}"
  echo "  tail -f ~/public_html/express.log"
  echo "  tail -f ~/fastify-backend/fastify.log"
fi

echo -e "${GREEN}"
echo "=================================================="
echo "  FreshShare Deployment Complete"
echo "=================================================="
echo -e "${NC}"
echo "If you encounter any issues, please refer to the EMERGENCY_FIX_GUIDE.md"
