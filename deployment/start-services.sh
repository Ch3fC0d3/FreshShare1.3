#!/bin/bash
# Script to start FreshShare services after deployment
# Upload this to your cPanel server and run it to ensure services are properly started

# Text formatting
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting FreshShare Services ===${NC}"

# Directory paths
EXPRESS_DIR="/home/myfrovov/public_html"
FASTIFY_DIR="/home/myfrovov/fastify-backend"

# Install dependencies for Express app
echo -e "\n${BLUE}Installing Express dependencies...${NC}"
cd $EXPRESS_DIR
npm install --production
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Express dependencies installed successfully${NC}"
else
    echo -e "${YELLOW}⚠ Error installing Express dependencies${NC}"
fi

# Install dependencies for Fastify app
echo -e "\n${BLUE}Installing Fastify dependencies...${NC}"
cd $FASTIFY_DIR
npm install --production
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Fastify dependencies installed successfully${NC}"
else
    echo -e "${YELLOW}⚠ Error installing Fastify dependencies${NC}"
fi

# Set proper file permissions
echo -e "\n${BLUE}Setting proper file permissions...${NC}"
chmod -R 755 $EXPRESS_DIR
chmod -R 755 $FASTIFY_DIR
echo -e "${GREEN}✓ File permissions updated${NC}"

# Create .env file for Fastify if it doesn't exist
if [ ! -f "$FASTIFY_DIR/.env" ]; then
    echo -e "\n${BLUE}Creating sample .env for Fastify...${NC}"
    cat > $FASTIFY_DIR/.env << EOL
PORT=8080
DATABASE_URL=postgresql://username:password@localhost:5432/database
# Add other environment variables as needed
EOL
    echo -e "${YELLOW}⚠ Created sample .env file. Update with real credentials!${NC}"
fi

# Start or restart services with PM2
echo -e "\n${BLUE}Starting services with PM2...${NC}"

# First, check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 not found. Installing globally...${NC}"
    npm install -g pm2
fi

# Stop any existing processes
pm2 stop all 2>/dev/null

# Start Express application
echo -e "\n${BLUE}Starting Express application...${NC}"
cd $EXPRESS_DIR
pm2 start server.js --name freshshare-express
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Express application started${NC}"
else
    echo -e "${YELLOW}⚠ Error starting Express application${NC}"
fi

# Start Fastify application
echo -e "\n${BLUE}Starting Fastify application...${NC}"
cd $FASTIFY_DIR
# For TypeScript app, check if we need ts-node or if it's already built
if [ -f "dist/server.js" ]; then
    pm2 start dist/server.js --name freshshare-fastify
elif [ -f "server.ts" ]; then
    # Use ts-node if available, otherwise suggest building
    if command -v npx &> /dev/null; then
        pm2 start "npx ts-node server.ts" --name freshshare-fastify
    else
        echo -e "${YELLOW}⚠ TypeScript found but no build. Run 'npm run build' first${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ No server file found in Fastify directory${NC}"
    exit 1
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Fastify application started${NC}"
else
    echo -e "${YELLOW}⚠ Error starting Fastify application${NC}"
fi

# Save PM2 configuration so it persists across server restarts
pm2 save

echo -e "\n${BLUE}=== Services Started ===${NC}"
pm2 status

echo -e "\n${BLUE}=== Next Steps ===${NC}"
echo "1. Check for any errors in the PM2 logs:"
echo "   pm2 logs"
echo "2. Test your Express application at your domain"
echo "3. Test your Fastify application endpoints"
echo "4. If you encounter 503 errors, run the troubleshoot-503.sh script"
