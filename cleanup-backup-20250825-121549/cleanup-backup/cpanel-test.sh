#!/bin/bash
# FreshShare cPanel Environment Test Script
# This script helps diagnose and fix common issues with Node.js applications in cPanel

echo "===== FreshShare cPanel Environment Test ====="
echo "Running diagnostics..."

# Set Node.js path for cPanel environment
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH

# Check Node.js availability
echo -e "\n1. Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js is available: $NODE_VERSION"
else
    echo "❌ Node.js not found in PATH"
    echo "Trying to find Node.js in common cPanel locations..."
    
    # Check common cPanel Node.js locations
    POSSIBLE_PATHS=(
        "$HOME/nodevenv/freshshare1.3/14/bin"
        "$HOME/nodevenv/freshshare1.3/16/bin"
        "$HOME/nodevenv/freshshare1.3/18/bin"
        "/opt/alt/alt-nodejs14/root/usr/bin"
        "/opt/alt/alt-nodejs16/root/usr/bin"
        "/opt/alt/alt-nodejs18/root/usr/bin"
    )
    
    for path in "${POSSIBLE_PATHS[@]}"; do
        if [ -f "$path/node" ]; then
            echo "Found Node.js at: $path"
            echo "Add this to your PATH: export PATH=$path:\$PATH"
            export PATH="$path:$PATH"
            NODE_VERSION=$($path/node -v)
            echo "Node.js version: $NODE_VERSION"
            break
        fi
    done
fi

# Check npm availability
echo -e "\n2. Checking npm installation..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm is available: $NPM_VERSION"
else
    echo "❌ npm not found"
fi

# Check file structure
echo -e "\n3. Checking file structure..."
if [ -d "$HOME/public_html" ]; then
    echo "✅ public_html directory exists"
    
    # Check for server.js
    if [ -f "$HOME/public_html/server.js" ]; then
        echo "✅ server.js exists in public_html"
    else
        echo "❌ server.js not found in public_html"
    fi
    
    # Check for proxy-server.js
    if [ -f "$HOME/public_html/proxy-server.js" ]; then
        echo "✅ proxy-server.js exists in public_html"
    else
        echo "❌ proxy-server.js not found in public_html"
    fi
    
    # Check for mock-fastify-server.js
    if [ -f "$HOME/public_html/mock-fastify-server.js" ]; then
        echo "✅ mock-fastify-server.js exists in public_html"
    else
        echo "❌ mock-fastify-server.js not found in public_html"
    fi
else
    echo "❌ public_html directory not found"
fi

# Check for fastify-backend directory
if [ -d "$HOME/fastify-backend" ]; then
    echo "✅ fastify-backend directory exists"
    
    # Check for server.ts
    if [ -f "$HOME/fastify-backend/server.ts" ]; then
        echo "✅ server.ts exists in fastify-backend"
    else
        echo "❌ server.ts not found in fastify-backend"
    fi
else
    echo "❌ fastify-backend directory not found"
fi

# Check port availability
echo -e "\n4. Checking port availability..."
if command -v netstat &> /dev/null; then
    echo "Checking port 3001 (Express)..."
    PORT_3001=$(netstat -tulpn 2>/dev/null | grep :3001 || echo "")
    if [ -z "$PORT_3001" ]; then
        echo "✅ Port 3001 is available"
    else
        echo "❌ Port 3001 is in use: $PORT_3001"
    fi
    
    echo "Checking port 8080 (Fastify)..."
    PORT_8080=$(netstat -tulpn 2>/dev/null | grep :8080 || echo "")
    if [ -z "$PORT_8080" ]; then
        echo "✅ Port 8080 is available"
    else
        echo "❌ Port 8080 is in use: $PORT_8080"
    fi
else
    echo "netstat command not available, skipping port check"
fi

# Check running processes
echo -e "\n5. Checking for running Node.js processes..."
NODE_PROCESSES=$(ps aux | grep node | grep -v grep || echo "")
if [ -z "$NODE_PROCESSES" ]; then
    echo "No Node.js processes currently running"
else
    echo "Found running Node.js processes:"
    echo "$NODE_PROCESSES"
fi

# Check for required npm packages
echo -e "\n6. Checking for required npm packages in public_html..."
if [ -d "$HOME/public_html/node_modules" ]; then
    echo "✅ node_modules exists in public_html"
    
    # Check for http-proxy-middleware
    if [ -d "$HOME/public_html/node_modules/http-proxy-middleware" ]; then
        echo "✅ http-proxy-middleware is installed"
    else
        echo "❌ http-proxy-middleware not found (required for proxy)"
    fi
    
    # Check for express
    if [ -d "$HOME/public_html/node_modules/express" ]; then
        echo "✅ express is installed"
    else
        echo "❌ express not found (required for server)"
    fi
else
    echo "❌ node_modules not found in public_html"
    echo "You may need to run: cd ~/public_html && npm install"
fi

# Offer to create emergency scripts
echo -e "\n===== Emergency Fix Options ====="
echo "Would you like to create emergency fix scripts? (y/n)"
read -p "> " CREATE_SCRIPTS

if [[ $CREATE_SCRIPTS == "y" || $CREATE_SCRIPTS == "Y" ]]; then
    echo "Creating emergency scripts..."
    
    # Create mock server script
    cat > ~/public_html/cpanel-mock.sh << 'EOF'
#!/bin/bash
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH
export NODE_ENV=production
export PORT=8080
cd ~/public_html
node mock-fastify-server.js > mock.log 2>&1 &
echo "Mock server started"
EOF
    chmod +x ~/public_html/cpanel-mock.sh
    
    # Create proxy server script
    cat > ~/public_html/cpanel-start.sh << 'EOF'
#!/bin/bash
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH
export NODE_ENV=production
export PORT=3001
cd ~/public_html
node proxy-server.js > proxy.log 2>&1 &
echo "Proxy server started"
EOF
    chmod +x ~/public_html/cpanel-start.sh
    
    echo "✅ Emergency scripts created successfully"
    echo "To start the servers, run:"
    echo "cd ~/public_html"
    echo "./cpanel-mock.sh"
    echo "sleep 3"
    echo "./cpanel-start.sh"
fi

echo -e "\n===== Test Complete ====="
echo "For more information, check the 503-fix-steps.md and cPanel-NODE-SETUP.md files"
