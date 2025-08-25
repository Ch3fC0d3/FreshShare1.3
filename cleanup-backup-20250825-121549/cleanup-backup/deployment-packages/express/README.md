# FreshShare Express Server

This is the main Express application server for FreshShare.

## Setup Instructions

1. Copy the .env.example file to .env
2. Update the environment variables in .env
3. Install dependencies: 
pm install --production
4. Start the server: 
pm start

For PM2 deployment:
\\\
pm2 start ecosystem.config.js
\\\

See the DEPLOYMENT_GUIDE.md for complete instructions.
