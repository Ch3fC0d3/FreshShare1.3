#!/bin/bash
# Node.js environment activation script

# Try to find and use the cPanel Node.js environment
if [ -f /opt/cpanel/ea-nodejs18/enable ]; then
  source /opt/cpanel/ea-nodejs18/enable
  echo "Activated cPanel Node.js 18"
elif [ -f /opt/cpanel/ea-nodejs16/enable ]; then
  source /opt/cpanel/ea-nodejs16/enable
  echo "Activated cPanel Node.js 16"
elif [ -f /opt/cpanel/ea-nodejs14/enable ]; then
  source /opt/cpanel/ea-nodejs14/enable
  echo "Activated cPanel Node.js 14"
else
  # If cPanel Node.js is not found, try other common paths
  echo "No cPanel Node.js found, using system Node.js"
  export PATH=$HOME/bin:$HOME/node_modules/.bin:$PATH

  # If NVM is installed, try to use it
  if [ -f "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    nvm use node || nvm use 18 || nvm use 16 || nvm use 14 || echo "Failed to activate NVM Node.js"
  fi
fi

# Show the active Node.js version
echo "Using Node.js version: $(node -v) from $(which node)"
echo "Using npm version: $(npm -v) from $(which npm)"
