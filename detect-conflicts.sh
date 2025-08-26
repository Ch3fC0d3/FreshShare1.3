#!/bin/bash
# FreshShare Conflict Detection and Quick Resolution Script
# This script detects various types of conflicts and provides quick resolution options

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  FreshShare Conflict Detection Tool     ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

CONFLICTS_FOUND=0

# Function to check and report conflicts
check_conflict() {
    local type="$1"
    local status="$2"
    local message="$3"
    local resolution="$4"
    
    if [ "$status" = "ERROR" ]; then
        echo -e "${RED}✗ $type: $message${NC}"
        if [ -n "$resolution" ]; then
            echo -e "${YELLOW}  → Resolution: $resolution${NC}"
        fi
        CONFLICTS_FOUND=$((CONFLICTS_FOUND + 1))
    elif [ "$status" = "WARNING" ]; then
        echo -e "${YELLOW}⚠ $type: $message${NC}"
        if [ -n "$resolution" ]; then
            echo -e "${YELLOW}  → Suggestion: $resolution${NC}"
        fi
        CONFLICTS_FOUND=$((CONFLICTS_FOUND + 1))
    else
        echo -e "${GREEN}✓ $type: $message${NC}"
    fi
}

echo -e "${BLUE}Checking for Git conflicts...${NC}"
# Check for git conflicts
if [ -d ".git" ]; then
    if git status --porcelain | grep -q "^UU\|^AA\|^DD"; then
        check_conflict "Git" "ERROR" "Merge conflicts detected in repository" "Run: git status, then edit conflicted files and git add/commit"
    elif git status | grep -q "You have unmerged paths"; then
        check_conflict "Git" "ERROR" "Unmerged paths detected" "Complete the merge with git add/commit after resolving conflicts"
    else
        check_conflict "Git" "OK" "No merge conflicts detected"
    fi
else
    check_conflict "Git" "WARNING" "Not a git repository" "Initialize git if needed: git init"
fi

echo -e "\n${BLUE}Checking for service conflicts...${NC}"
# Check for port conflicts
if command -v netstat &> /dev/null; then
    PORT_3001=$(netstat -tulpn 2>/dev/null | grep ":3001 ")
    PORT_8080=$(netstat -tulpn 2>/dev/null | grep ":8080 ")
    
    if [ -n "$PORT_3001" ] && [ -n "$PORT_8080" ]; then
        check_conflict "Services" "OK" "Both Express (3001) and Fastify (8080) ports are in use"
    elif [ -n "$PORT_3001" ] && [ -z "$PORT_8080" ]; then
        check_conflict "Services" "WARNING" "Express running but Fastify not detected" "Start Fastify: cd ~/fastify-backend && npm start"
    elif [ -z "$PORT_3001" ] && [ -n "$PORT_8080" ]; then
        check_conflict "Services" "WARNING" "Fastify running but Express not detected" "Start Express: cd ~/public_html && npm start"
    else
        check_conflict "Services" "ERROR" "Neither service appears to be running" "Run: ./comprehensive-503-fix.sh"
    fi
else
    check_conflict "Services" "WARNING" "Cannot check ports (netstat not available)" "Install net-tools or check manually"
fi

# Check Node.js processes
NODE_PROCESSES=$(ps aux | grep -c "[n]ode.*server.js\|[n]ode.*fastify")
if [ "$NODE_PROCESSES" -gt 0 ]; then
    check_conflict "Processes" "OK" "$NODE_PROCESSES Node.js processes running"
else
    check_conflict "Processes" "ERROR" "No Node.js application processes detected" "Run: pm2 start or ./start-express.sh"
fi

echo -e "\n${BLUE}Checking for path conflicts...${NC}"
# Check application directories
if [ -d "$HOME/public_html" ]; then
    check_conflict "Express Path" "OK" "Express directory exists"
else
    check_conflict "Express Path" "ERROR" "Express directory missing" "Create: mkdir -p ~/public_html"
fi

if [ -d "$HOME/fastify-backend" ]; then
    check_conflict "Fastify Path" "OK" "Fastify directory exists"
else
    check_conflict "Fastify Path" "ERROR" "Fastify directory missing" "Create: mkdir -p ~/fastify-backend"
fi

# Check for package.json files
if [ -f "$HOME/public_html/package.json" ]; then
    check_conflict "Express Config" "OK" "Express package.json exists"
else
    check_conflict "Express Config" "ERROR" "Express package.json missing" "Run deployment script or copy from repository"
fi

if [ -f "$HOME/fastify-backend/package.json" ]; then
    check_conflict "Fastify Config" "OK" "Fastify package.json exists"
else
    check_conflict "Fastify Config" "ERROR" "Fastify package.json missing" "Run deployment script or copy from repository"
fi

echo -e "\n${BLUE}Checking for environment conflicts...${NC}"
# Check for environment files
if [ -f "$HOME/public_html/.env" ]; then
    check_conflict "Express Env" "OK" "Express .env file exists"
else
    check_conflict "Express Env" "WARNING" "Express .env file missing" "Create with: echo 'PORT=3001' > ~/public_html/.env"
fi

if [ -f "$HOME/fastify-backend/.env" ]; then
    check_conflict "Fastify Env" "OK" "Fastify .env file exists"
else
    check_conflict "Fastify Env" "WARNING" "Fastify .env file missing" "Create with: echo 'PORT=8080' > ~/fastify-backend/.env"
fi

echo -e "\n${BLUE}Checking for permission conflicts...${NC}"
# Check file permissions
if [ -w "$HOME/public_html" ]; then
    check_conflict "Express Perms" "OK" "Express directory is writable"
else
    check_conflict "Express Perms" "ERROR" "Express directory not writable" "Fix: chmod -R 755 ~/public_html"
fi

if [ -w "$HOME/fastify-backend" ]; then
    check_conflict "Fastify Perms" "OK" "Fastify directory is writable"
else
    check_conflict "Fastify Perms" "ERROR" "Fastify directory not writable" "Fix: chmod -R 755 ~/fastify-backend"
fi

echo -e "\n${BLUE}Checking for Node.js version conflicts...${NC}"
# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d 'v' -f 2 | cut -d '.' -f 1)
    
    if [ "$NODE_MAJOR" -ge 14 ]; then
        check_conflict "Node.js" "OK" "Version $NODE_VERSION is compatible"
    else
        check_conflict "Node.js" "ERROR" "Version $NODE_VERSION may be incompatible" "Update to Node.js 14+ via cPanel"
    fi
else
    check_conflict "Node.js" "ERROR" "Node.js not found in PATH" "Set PATH: export PATH=\$HOME/nodevenv/freshshare1.3/18/bin:\$PATH"
fi

# Check npm
if command -v npm &> /dev/null; then
    check_conflict "NPM" "OK" "NPM is available"
else
    check_conflict "NPM" "ERROR" "NPM not found" "Install with Node.js or check PATH"
fi

# Summary and recommendations
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}  Conflict Detection Summary             ${NC}"
echo -e "${BLUE}=========================================${NC}"

if [ $CONFLICTS_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ No conflicts detected! Your FreshShare application appears to be properly configured.${NC}"
    echo -e "${GREEN}✓ You can start your services or check the application status.${NC}"
else
    echo -e "${RED}Found $CONFLICTS_FOUND potential conflicts or issues.${NC}"
    echo ""
    echo -e "${YELLOW}Quick Resolution Options:${NC}"
    echo -e "${YELLOW}1. For service issues:        ./comprehensive-503-fix.sh${NC}"
    echo -e "${YELLOW}2. For diagnostic details:    ./deployment/troubleshoot-503.sh${NC}"
    echo -e "${YELLOW}3. For complete reset:        ./one-click-deploy.sh${NC}"
    echo -e "${YELLOW}4. For detailed guide:        cat CONFLICT_RESOLUTION_GUIDE.md${NC}"
    echo -e "${YELLOW}5. For emergency fixes:       cat EMERGENCY_FIX_GUIDE.md${NC}"
    
    echo ""
    echo -e "${BLUE}Would you like to run an automated fix? (y/n)${NC}"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Running comprehensive 503 fix script...${NC}"
        if [ -f "./comprehensive-503-fix.sh" ]; then
            chmod +x ./comprehensive-503-fix.sh
            ./comprehensive-503-fix.sh
        else
            echo -e "${RED}Comprehensive fix script not found!${NC}"
            echo -e "${YELLOW}Please run the manual resolution steps shown above.${NC}"
        fi
    fi
fi

echo ""
echo -e "${BLUE}For more detailed conflict resolution, see: ${NC}${YELLOW}CONFLICT_RESOLUTION_GUIDE.md${NC}"
echo -e "${BLUE}To run this script again: ${NC}${YELLOW}./detect-conflicts.sh${NC}"