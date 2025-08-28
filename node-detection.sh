#!/bin/bash
# Node.js detection and installation script for cPanel environments

# Check if Node.js is already in PATH
if [ -x "$(command -v node)" ]; then
  NODE_VERSION=$(node -v)
  echo "✅ Node.js already in PATH: $NODE_VERSION"
  exit 0
fi

echo "⚠️ Node.js not found in PATH, checking alternative locations..."

# Check common cPanel Node.js paths
if [ -f "/opt/cpanel/ea-nodejs18/bin/node" ]; then
  export PATH="/opt/cpanel/ea-nodejs18/bin:$PATH"
  echo "✅ Using cPanel Node.js 18"
elif [ -f "/opt/cpanel/ea-nodejs16/bin/node" ]; then
  export PATH="/opt/cpanel/ea-nodejs16/bin:$PATH"
  echo "✅ Using cPanel Node.js 16"
elif [ -f "/opt/cpanel/ea-nodejs14/bin/node" ]; then
  export PATH="/opt/cpanel/ea-nodejs14/bin:$PATH"
  echo "✅ Using cPanel Node.js 14"
elif [ -f "/opt/cpanel/ea-nodejs10/bin/node" ]; then
  export PATH="/opt/cpanel/ea-nodejs10/bin:$PATH"
  echo "✅ Using cPanel Node.js 10"
elif [ -d "$HOME/nodejs/bin" ]; then
  export PATH="$HOME/nodejs/bin:$PATH"
  echo "✅ Using user-installed Node.js"
else
  # Create basic Node.js script as fallback
  echo "⚠️ No Node.js found, installing local Node.js 18 LTS"
  mkdir -p $HOME/nodejs
  echo "Downloading Node.js 18 LTS..."
  curl -sL https://nodejs.org/dist/v18.17.1/node-v18.17.1-linux-x64.tar.gz | tar xz -C $HOME/nodejs --strip-components=1
  export PATH="$HOME/nodejs/bin:$PATH"
fi

# Verify Node.js is now available
if [ -x "$(command -v node)" ]; then
  NODE_VERSION=$(node -v)
  echo "✅ Node.js now available: $NODE_VERSION"
  
  # Create a persistent PATH setup for Node.js
  echo 'export PATH="$HOME/nodejs/bin:$PATH"' >> $HOME/.bashrc
  echo 'export PATH="$HOME/nodejs/bin:$PATH"' >> $HOME/.profile
  
  # Create an activation script for easier sourcing
  cat > $HOME/activate-node.sh << 'EOF'
#!/bin/bash
# Node.js activation script
export PATH="$HOME/nodejs/bin:$PATH"
echo "Node.js activated: $(node -v)"
EOF
  
  chmod +x $HOME/activate-node.sh
  echo "✅ Created Node.js activation script at ~/activate-node.sh"
else
  echo "❌ Failed to setup Node.js"
  exit 1
fi

# Install essential dependencies
echo "Installing essential Node.js dependencies..."
npm install -g npm@latest
npm install -g dotenv mongoose pg

echo "✅ Node.js environment setup complete"
