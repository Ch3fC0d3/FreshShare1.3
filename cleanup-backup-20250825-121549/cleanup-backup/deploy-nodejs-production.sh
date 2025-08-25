#!/bin/bash
# FreshShare Production Deployment Script for Node.js-only environment
# This script performs a complete production deployment of FreshShare on cPanel without Apache

echo "========================================="
echo "FreshShare Production Deployment (Node.js only)"
echo "========================================="

# 1. Set up Node.js environment
echo "[1/5] Setting up Node.js environment..."
# Find Node.js path
NODE_PATHS=(
  "$HOME/nodevenv/freshshare1.3/14/bin"
  "$HOME/nodevenv/freshshare1.3/16/bin"
  "$HOME/nodevenv/freshshare1.3/18/bin"
  "/opt/cpanel/ea-nodejs14/bin"
  "/opt/cpanel/ea-nodejs16/bin"
  "/opt/cpanel/ea-nodejs18/bin"
)

NODE_PATH=""
for path in "${NODE_PATHS[@]}"; do
  if [ -f "$path/node" ]; then
    NODE_PATH="$path"
    break
  fi
done

if [ -z "$NODE_PATH" ]; then
  echo "ERROR: Could not find Node.js installation"
  echo "Please create a Node.js environment in cPanel before running this script"
  exit 1
fi

export PATH="$NODE_PATH:$PATH"
echo "Using Node.js: $(which node) ($(node -v))"

# 2. Kill any existing Node.js processes
echo "[2/5] Stopping existing Node.js processes..."
pkill -f "node.*server.js" || true
pkill -f "node.*server.ts" || true
sleep 2

# 3. Set up environment files
echo "[3/5] Creating environment files..."

# Express .env file
cat > ~/public_html/.env << EOF
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freshshare
JWT_SECRET=your-jwt-secret-key
FASTIFY_BACKEND_URL=http://localhost:8080
EOF
echo "Created Express .env file at ~/public_html/.env"

# Fastify .env file
cat > ~/fastify-backend/.env << EOF
PORT=8080
NODE_ENV=production
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/freshshare
JWT_SECRET=your-jwt-secret-key
EOF
echo "Created Fastify .env file at ~/fastify-backend/.env"

# 4. Create startup scripts
echo "[4/5] Creating startup scripts..."

# Express startup script
cat > ~/public_html/start-express.sh << 'EOF'
#!/bin/bash
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH
cd $HOME/public_html

# Load environment variables
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check for dependencies
if [ ! -d "node_modules" ] || [ ! -d "node_modules/express" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the server
echo "Starting Express server on port $PORT..."
node server.js > express.log 2>&1 &
echo $! > express.pid
echo "Express server started with PID $(cat express.pid)"
EOF
chmod +x ~/public_html/start-express.sh
echo "Created Express startup script at ~/public_html/start-express.sh"

# Fastify startup script
cat > ~/fastify-backend/start-fastify.sh << 'EOF'
#!/bin/bash
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH
cd $HOME/fastify-backend

# Load environment variables
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check for dependencies
if [ ! -d "node_modules" ] || [ ! -d "node_modules/fastify" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the server
echo "Starting Fastify backend on port $PORT..."
npx ts-node server.ts > fastify.log 2>&1 &
echo $! > fastify.pid
echo "Fastify backend started with PID $(cat fastify.pid)"
EOF
chmod +x ~/fastify-backend/start-fastify.sh
echo "Created Fastify startup script at ~/fastify-backend/start-fastify.sh"

# 5. Set up cron jobs
echo "[5/5] Setting up cron jobs..."
(crontab -l 2>/dev/null || echo "") | grep -v "start-fastify\\.sh\\|start-express\\.sh" > temp_cron
echo "@reboot ~/fastify-backend/start-fastify.sh" >> temp_cron
echo "@reboot sleep 10 && ~/public_html/start-express.sh" >> temp_cron
echo "*/5 * * * * if ! pgrep -f \"node.*server.ts\" > /dev/null; then cd ~/fastify-backend && ./start-fastify.sh; fi" >> temp_cron
echo "*/5 * * * * if ! pgrep -f \"node server.js\" > /dev/null; then cd ~/public_html && ./start-express.sh; fi" >> temp_cron
crontab temp_cron
rm temp_cron
echo "Cron jobs installed successfully"

# Start services
echo "========================================="
echo "Starting services..."
~/fastify-backend/start-fastify.sh
sleep 5
~/public_html/start-express.sh

echo "========================================="
echo "Production deployment complete!"
echo ""
echo "IMPORTANT: Edit the .env files to update:"
echo "1. MongoDB connection strings in both .env files"
echo "2. JWT secret keys in both .env files"
echo ""
echo "To check if services are running:"
echo "ps aux | grep node"
echo ""
echo "To view logs:"
echo "tail -f ~/public_html/express.log"
echo "tail -f ~/fastify-backend/fastify.log"
echo "========================================="
