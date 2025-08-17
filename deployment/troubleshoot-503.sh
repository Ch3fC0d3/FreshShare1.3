#!/bin/bash
# Troubleshooting script for 503 Service Unavailable errors
# Run this script on your cPanel server

# Text formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== FreshShare Deployment Troubleshooting ===${NC}"
echo "This script will help identify common issues causing 503 errors"
echo ""

# Check Node.js version
echo -e "${BLUE}Checking Node.js version:${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js is installed: $NODE_VERSION${NC}"
    if [[ $NODE_VERSION == v1[8-9]* || $NODE_VERSION == v2* ]]; then
        echo -e "${GREEN}✓ Node.js version is compatible${NC}"
    else
        echo -e "${RED}✗ Node.js version may be incompatible. Recommended: v18+${NC}"
    fi
else
    echo -e "${RED}✗ Node.js is not installed or not in PATH${NC}"
fi

# Check if PM2 is installed
echo -e "\n${BLUE}Checking process manager:${NC}"
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}✓ PM2 is installed${NC}"
    echo -e "${BLUE}Running processes:${NC}"
    pm2 list
    
    echo -e "\n${BLUE}Checking for Express application logs:${NC}"
    if pm2 describe freshshare-express &> /dev/null; then
        echo -e "${YELLOW}Last 10 log lines from Express app:${NC}"
        pm2 logs freshshare-express --lines 10 --nostream
    else
        echo -e "${RED}✗ Express application (freshshare-express) is not running in PM2${NC}"
    fi
    
    echo -e "\n${BLUE}Checking for Fastify application logs:${NC}"
    if pm2 describe freshshare-fastify &> /dev/null; then
        echo -e "${YELLOW}Last 10 log lines from Fastify app:${NC}"
        pm2 logs freshshare-fastify --lines 10 --nostream
    else
        echo -e "${RED}✗ Fastify application (freshshare-fastify) is not running in PM2${NC}"
    fi
else
    echo -e "${RED}✗ PM2 is not installed. Install it with: npm install -g pm2${NC}"
fi

# Check application directories
echo -e "\n${BLUE}Checking application directories:${NC}"

# Express app directory
EXPRESS_DIR="/home/myfrovov/public_html"
if [ -d "$EXPRESS_DIR" ]; then
    echo -e "${GREEN}✓ Express application directory exists${NC}"
    if [ -f "$EXPRESS_DIR/server.js" ]; then
        echo -e "${GREEN}✓ server.js file exists${NC}"
    else
        echo -e "${RED}✗ server.js file is missing${NC}"
    fi
    
    if [ -f "$EXPRESS_DIR/package.json" ]; then
        echo -e "${GREEN}✓ package.json file exists${NC}"
    else
        echo -e "${RED}✗ package.json file is missing${NC}"
    fi
else
    echo -e "${RED}✗ Express application directory doesn't exist${NC}"
fi

# Fastify app directory
FASTIFY_DIR="/home/myfrovov/fastify-backend"
if [ -d "$FASTIFY_DIR" ]; then
    echo -e "${GREEN}✓ Fastify application directory exists${NC}"
    if [ -f "$FASTIFY_DIR/server.ts" ]; then
        echo -e "${GREEN}✓ server.ts file exists${NC}"
    else
        echo -e "${RED}✗ server.ts file is missing${NC}"
    fi
    
    if [ -f "$FASTIFY_DIR/.env" ]; then
        echo -e "${GREEN}✓ .env file exists${NC}"
    else
        echo -e "${YELLOW}⚠ .env file is missing - environment variables may not be set${NC}"
    fi
else
    echo -e "${RED}✗ Fastify application directory doesn't exist${NC}"
fi

# Check port availability
echo -e "\n${BLUE}Checking port usage:${NC}"
EXPRESS_PORT=80 # Default HTTP port
FASTIFY_PORT=8080 # Default Fastify port

# Check if netstat is available
if command -v netstat &> /dev/null; then
    echo -e "${BLUE}Express port ($EXPRESS_PORT):${NC}"
    if netstat -tuln | grep -q ":$EXPRESS_PORT "; then
        echo -e "${GREEN}✓ Port $EXPRESS_PORT is in use${NC}"
    else
        echo -e "${RED}✗ No application is listening on port $EXPRESS_PORT${NC}"
    fi
    
    echo -e "${BLUE}Fastify port ($FASTIFY_PORT):${NC}"
    if netstat -tuln | grep -q ":$FASTIFY_PORT "; then
        echo -e "${GREEN}✓ Port $FASTIFY_PORT is in use${NC}"
    else
        echo -e "${RED}✗ No application is listening on port $FASTIFY_PORT${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Cannot check port usage (netstat not available)${NC}"
fi

# Check file permissions
echo -e "\n${BLUE}Checking file permissions:${NC}"
if [ -d "$EXPRESS_DIR" ]; then
    PERM=$(stat -c "%a" "$EXPRESS_DIR")
    echo -e "Express directory permissions: $PERM"
    if [[ "$PERM" == "755" || "$PERM" == "775" ]]; then
        echo -e "${GREEN}✓ Express directory permissions look good${NC}"
    else
        echo -e "${YELLOW}⚠ Express directory permissions may need adjustment${NC}"
    fi
fi

if [ -d "$FASTIFY_DIR" ]; then
    PERM=$(stat -c "%a" "$FASTIFY_DIR")
    echo -e "Fastify directory permissions: $PERM"
    if [[ "$PERM" == "755" || "$PERM" == "775" ]]; then
        echo -e "${GREEN}✓ Fastify directory permissions look good${NC}"
    else
        echo -e "${YELLOW}⚠ Fastify directory permissions may need adjustment${NC}"
    fi
fi

# Check Apache/cPanel configuration
echo -e "\n${BLUE}Checking web server configuration:${NC}"
if [ -f "/etc/apache2/conf.d/userdata/std/2_4/myfrovov/FreshShare1.3/apache.conf" ]; then
    echo -e "${GREEN}✓ Apache configuration for domain exists${NC}"
else
    echo -e "${YELLOW}⚠ Custom Apache configuration not found${NC}"
fi

# Check available memory
echo -e "\n${BLUE}Checking server resources:${NC}"
if command -v free &> /dev/null; then
    echo -e "${BLUE}Memory usage:${NC}"
    free -m
    
    AVAIL_MEM=$(free -m | awk '/^Mem:/{print $7}')
    if [ "$AVAIL_MEM" -lt 200 ]; then
        echo -e "${RED}✗ Low available memory: $AVAIL_MEM MB${NC}"
    else
        echo -e "${GREEN}✓ Available memory looks sufficient: $AVAIL_MEM MB${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Cannot check memory usage (free command not available)${NC}"
fi

# Final summary and recommendations
echo -e "\n${BLUE}=== Troubleshooting Summary ===${NC}"
echo -e "${YELLOW}Common fixes for 503 errors:${NC}"
echo "1. Restart application: pm2 restart all"
echo "2. Check for error logs: pm2 logs"
echo "3. Ensure environment variables are set in .env files"
echo "4. Verify database connections are working"
echo "5. Check for sufficient server resources"
echo "6. Fix file permissions if needed: chmod -R 755 directory"
echo "7. Install dependencies if missing: npm install"

echo -e "\n${BLUE}=== Next Steps ===${NC}"
echo "Run these commands to attempt fixing the issue:"
echo -e "${GREEN}cd $EXPRESS_DIR && npm install${NC}"
echo -e "${GREEN}cd $FASTIFY_DIR && npm install${NC}"
echo -e "${GREEN}pm2 restart all${NC}"
echo -e "${GREEN}chmod -R 755 $EXPRESS_DIR${NC}"
echo -e "${GREEN}chmod -R 755 $FASTIFY_DIR${NC}"

echo -e "\nIf the issue persists, contact your hosting provider with the output of this script."
