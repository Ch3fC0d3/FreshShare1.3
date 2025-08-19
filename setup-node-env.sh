#!/bin/bash
# Node.js Environment Setup for FreshShare Production
# This script sets up the proper Node.js environment for production deployment

echo "Setting up Node.js production environment..."

# Determine Node.js path - try different possible locations
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

echo "Found Node.js at: $NODE_PATH"
export PATH="$NODE_PATH:$PATH"

# Display Node.js version information
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# Create .env files for both services
echo "Creating production environment files..."

# Express .env file
cat > ~/public_html/.env << EOF
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freshshare
JWT_SECRET=your-jwt-secret-key
FASTIFY_BACKEND_URL=http://localhost:8080
EOF

# Fastify .env file
cat > ~/fastify-backend/.env << EOF
PORT=8080
NODE_ENV=production
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/freshshare
JWT_SECRET=your-jwt-secret-key
EOF

echo "Environment files created!"
echo ""
echo "IMPORTANT: Edit the .env files to update:"
echo "1. MongoDB connection strings"
echo "2. JWT secret keys"
echo ""
echo "To apply the Node.js environment in your current session:"
echo "export PATH=\"$NODE_PATH:\$PATH\""
