# FreshShare Production Deployment Steps

This guide provides the exact steps to deploy FreshShare to your hosting environment, fixing the 503 error by ensuring proper configuration of both the Express server and Fastify backend.

## Pre-Deployment Tasks

1. **Verify Environment Files**:
   - Ensure `.env.production` is configured in the root directory
   - Ensure `fastify-backend/.env.production` is configured
   - Replace placeholder values with your actual database credentials

2. **Check Configuration**:
   - MongoDB Atlas connection string is correct
   - PostgreSQL connection string is correct
   - JWT secret is set to a strong production value

## Simplified Deployment Steps

This guide provides the exact commands needed to deploy the Node.js-only solution to your production server.

### Step 1: Upload Files to Hosting

1. Using FTP or Git, upload all files to your hosting environment:
   ```
   - Root directory: Express server files
   - /fastify-backend/: Fastify backend files
   - .htaccess: Apache configuration
   - .env.production: Rename to .env
   - fastify-backend/.env.production: Rename to fastify-backend/.env
   ```

### Step 2: Configure Node.js Environment

1. In cPanel, navigate to "Setup Node.js App"
2. Create two applications:
   - **Express Server**:
     - Node.js version: 18.x
     - Application root: `/home/username/public_html`
     - Startup file: `server.js`
   - **Fastify Backend**:
     - Node.js version: 18.x
     - Application root: `/home/username/public_html/fastify-backend`
     - Startup file: `server.ts` (or compiled JS file)

### Step 3: Install Dependencies

1. Using SSH or Terminal in cPanel:
   ```bash
   # Express server dependencies
   cd ~/public_html
   npm install --production
   
   # Fastify backend dependencies
   cd fastify-backend
   npm install --production
   npm install -g ts-node typescript # If using TypeScript
   ```

### Step 4: Database Setup

1. **MongoDB Atlas** (Express Server):
   - Create a MongoDB Atlas cluster if not already done
   - Create a database user with appropriate permissions
   - Add your server's IP address to the IP whitelist
   - Use the connection string in your `.env` file

2. **PostgreSQL** (Fastify Backend):
   - Set up PostgreSQL database in cPanel or use external provider
   - Update connection string in `fastify-backend/.env`

### Step 5: Start Services

1. Start Fastify backend first:
   ```bash
   cd ~/public_html/fastify-backend
   npx ts-node server.ts &
   # OR if compiled to JS
   node server.js &
   ```

2. Start Express server:
   ```bash
   cd ~/public_html
   node server.js &
   ```

3. Alternatively, use cPanel's Node.js App Manager to start both applications

### Step 6: Verify Deployment

1. Test the main site: `https://yourdomain.com`
2. Test the Fastify backend: `https://yourdomain.com/api/pack/health`
3. Check logs for errors:
   ```bash
   # Check Express server logs
   cat ~/logs/nodejs/nodejs.log
   
   # Check Fastify backend logs
   cat ~/logs/nodejs/fastify.log
   ```

## Troubleshooting 503 Errors

If you still encounter a 503 Service Unavailable error:

1. **Verify Fastify backend is running**:
   ```bash
   ps aux | grep server.ts
   # OR
   ps aux | grep node
   ```

2. **Check port conflicts**:
   ```bash
   netstat -tulpn | grep 8080
   ```

3. **Test direct connection to Fastify**:
   ```bash
   curl http://localhost:8080/health
   ```

4. **Check proxy configuration**:
   - Verify .htaccess has correct port (8080) for Fastify backend
   - Confirm mod_proxy and mod_rewrite are enabled

5. **Review environment variables**:
   - Express: `FASTIFY_BACKEND_URL=http://localhost:8080`
   - Fastify: `PORT=8080`

## Maintaining Your Deployment

1. **Updates**:
   - Pull latest code and repeat installation steps
   - Always backup before updating

2. **Monitoring**:
   - Use cPanel's resource monitoring tools
   - Set up alerts for high CPU/memory usage

3. **Backups**:
   - Regular database backups
   - Code backups using Git or cPanel backup tools
