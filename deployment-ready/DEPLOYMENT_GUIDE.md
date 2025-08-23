# FreshShare Deployment Guide

This guide provides step-by-step instructions for deploying the Node.js-only solution to your production server.

## Prerequisites

- cPanel hosting with Node.js support (v14+)
- SSH access to your hosting account
- MongoDB Atlas account (for database)

## Deployment Steps

### 1. Upload Files

Upload the contents of this deployment package to your server:

- Upload `public_html/*` to `~/public_html/`
- Upload `fastify-backend/*` to `~/fastify-backend/`

You can use FTP, SCP, or any other file transfer method:

```bash
# Using SCP (replace username and server with your details)
scp -r public_html/* username@your-server.com:~/public_html/
scp -r fastify-backend/* username@your-server.com:~/fastify-backend/
```

### 2. Configure Environment Files

1. Create `.env` files from the examples:

```bash
# On your server
cd ~/public_html
cp .env.example .env
cd ~/fastify-backend
cp .env.example .env
```

2. Edit both `.env` files to update:
   - MongoDB connection strings
   - JWT secret (use the same value in both files)
   - Verify ports are correct (3001 for Express, 8080 for Fastify)

### 3. Set Execute Permissions

Make the startup scripts executable:

```bash
chmod +x ~/public_html/start-express.sh
chmod +x ~/fastify-backend/start-fastify.sh
chmod +x ~/public_html/setup-cron-jobs.sh
chmod +x ~/public_html/deploy-nodejs-production.sh
```

### 4. Install Dependencies

Install the required Node.js packages:

```bash
cd ~/public_html
npm install --production

cd ~/fastify-backend
npm install --production
```

### 5. Run the Deployment Script

The deployment script will set up everything automatically:

```bash
cd ~/public_html
./deploy-nodejs-production.sh
```

This script will:
- Configure the Node.js environment
- Set up cron jobs for automatic restart
- Start both Express and Fastify services

### 6. Verify Deployment

Check if both services are running:

```bash
ps aux | grep node
```

Check the logs for any errors:

```bash
tail -f ~/public_html/express.log
tail -f ~/fastify-backend/fastify.log
```

### 7. Run Diagnostics (If Needed)

If you encounter any issues, run the diagnostic script:

```bash
cd ~/public_html
node diagnose-nodejs-production.js
```

## Troubleshooting

If you encounter 503 Service Unavailable errors:

1. Check if both services are running
2. Verify port configuration in `.env` files
3. Check MongoDB connection strings
4. Review logs for specific errors

For detailed troubleshooting, refer to the EMERGENCY_FIX_GUIDE.md file.

## Maintenance

### Restarting Services

To restart the services manually:

```bash
# Kill existing processes
pkill -f "node.*server.js"
pkill -f "node.*server.ts"

# Start services again
cd ~/fastify-backend && ./start-fastify.sh
cd ~/public_html && ./start-express.sh
```

### Updating the Application

To update the application:

1. Stop the services
2. Upload the new files
3. Start the services again

## Support

If you need assistance, please refer to the documentation or contact support.
