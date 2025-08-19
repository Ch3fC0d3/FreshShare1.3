#!/bin/bash

# Script to fix 503 error by creating and running the Express server
# Run this script on your cPanel server

# Create start-express.sh if it doesn't exist
if [ ! -f "$HOME/public_html/start-express.sh" ]; then
  echo "Creating start-express.sh script..."
  cat > "$HOME/public_html/start-express.sh" << 'EOF'
#!/bin/bash

# Startup script for Express server in production environment
# For use with cPanel Node.js App deployment

# Ensure we're in the correct directory
cd "$HOME/public_html"

# Copy production env file if it exists and .env doesn't
if [ -f ".env.production" ] && [ ! -f ".env" ]; then
  cp .env.production .env
  echo "Copied .env.production to .env"
fi

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install --production
fi

# Start the Express server
echo "Starting Express server..."
NODE_ENV=production node server.js
EOF
  
  echo "Script created successfully."
fi

# Make scripts executable
echo "Setting executable permissions..."
chmod +x "$HOME/public_html/start-express.sh"
chmod +x "$HOME/public_html/fastify-backend/start-fastify.sh"

# Create .env file if it doesn't exist
if [ ! -f "$HOME/public_html/.env" ]; then
  echo "Creating Express .env file..."
  cat > "$HOME/public_html/.env" << 'EOF'
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/FreshShareDB
MONGODB_DB=FreshShareDB
PORT=3001
JWT_SECRET=your-jwt-secret-key
FASTIFY_BACKEND_URL=http://localhost:8080
NODE_ENV=production
EOF
  
  echo "Please edit the .env file with your actual MongoDB credentials."
fi

# Start the Express server
echo "Starting Express server..."
cd "$HOME/public_html"
nohup ./start-express.sh > express.log 2>&1 &

# Check if services are running
echo "Checking services (after 5 seconds)..."
sleep 5
ps aux | grep node

echo "Fix complete! Check express.log for any errors."
echo "You can view the log with: cat ~/public_html/express.log"
