# Manual Deployment Guide for FreshShare

This guide provides step-by-step instructions for manually deploying FreshShare to your cPanel hosting environment without using GitHub Actions.

## Prerequisites

- cPanel access with Node.js support
- PostgreSQL database (already created: `myfrovov_freshshare`)
- PostgreSQL user (already created: `myfrovov_freshshare_user`)

## Step 1: Prepare Your Files

1. Zip your project files:
   ```bash
   # On your local machine
   zip -r freshshare.zip . -x "node_modules/*" ".git/*" "data/db/*"
   ```

2. Alternatively, use the deployment preparation script:
   ```bash
   node deployment-preparation.js
   ```
   This will create a `deployment-ready` folder with all necessary files.

## Step 2: Upload Files to cPanel

1. Log in to your cPanel account
2. Navigate to File Manager
3. Go to `public_html` directory
4. Upload and extract your zip file or the contents of `deployment-ready`
5. Create a separate directory for Fastify backend:
   ```
   mkdir -p ~/fastify-backend
   ```
6. Move Fastify files to the backend directory:
   ```
   cp -R ~/public_html/fastify-backend/* ~/fastify-backend/
   ```

## Step 3: Set Up Environment Files

1. Create `.env` file in the Express root directory:
   ```
   cd ~/public_html
   cp .env.production .env
   ```

2. Create `.env` file in the Fastify backend directory:
   ```
   cd ~/fastify-backend
   cp .env.production .env
   ```

3. Verify the PostgreSQL connection string in `~/fastify-backend/.env`:
   ```
   DATABASE_URL=postgres://myfrovov_freshshare_user:BjgjX2Vev2vmLwh@localhost:5432/myfrovov_freshshare
   ```

## Step 4: Install Dependencies

1. Install Express dependencies:
   ```
   cd ~/public_html
   npm install --production
   ```

2. Install Fastify dependencies:
   ```
   cd ~/fastify-backend
   npm install --production
   npm install pg
   ```

3. Install global TypeScript dependencies (if needed):
   ```
   npm install -g ts-node typescript
   ```

## Step 5: Initialize PostgreSQL Database

1. Run the database initialization script:
   ```
   cd ~/fastify-backend
   node db-init.js
   ```

2. Verify database initialization:
   ```
   # Check if tables were created
   psql -U myfrovov_freshshare_user -d myfrovov_freshshare -c "\dt"
   ```

## Step 6: Start Services

1. Make startup scripts executable:
   ```
   chmod +x ~/public_html/start-express.sh
   chmod +x ~/fastify-backend/start-fastify.sh
   ```

2. Start Fastify backend first:
   ```
   cd ~/fastify-backend
   ./start-fastify.sh > fastify.log 2>&1 &
   ```

3. Start Express server:
   ```
   cd ~/public_html
   ./start-express.sh > express.log 2>&1 &
   ```

## Step 7: Set Up Node.js App in cPanel

1. Go to cPanel → Software → Setup Node.js App
2. Create a new Node.js application:
   - Application mode: Production
   - Node.js version: 14 or higher
   - Application root: `public_html`
   - Application URL: Your domain
   - Application startup file: `server.js`
   - Environment variables: Already set in .env files

3. Create a second Node.js application for Fastify:
   - Application root: `fastify-backend`
   - Application startup file: `server.ts`
   - Application URL: Your domain (subdomain if available)

## Step 8: Configure Apache Proxy

1. Verify `.htaccess` file in `public_html` directory contains:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     
     # Proxy API requests to Fastify backend
     RewriteRule ^api/pack/(.*)$ http://localhost:8080/api/pack/$1 [P,L]
     
     # Security headers
     Header set X-Content-Type-Options "nosniff"
     Header set X-XSS-Protection "1; mode=block"
     Header set X-Frame-Options "SAMEORIGIN"
     
     # Handle frontend routes
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule ^(.*)$ /index.html [L]
   </IfModule>
   ```

## Step 9: Verify Deployment

1. Check if services are running:
   ```
   ps aux | grep node
   ```

2. Check logs for errors:
   ```
   tail -f ~/public_html/express.log
   tail -f ~/fastify-backend/fastify.log
   ```

3. Test the application by visiting your domain in a browser

## Troubleshooting

### 503 Service Unavailable Error

If you encounter a 503 error:

1. Check if both services are running:
   ```
   ps aux | grep node
   ```

2. Verify port configuration:
   - Express should run on port 3001
   - Fastify should run on port 8080

3. Check Apache proxy configuration in `.htaccess`

4. Restart services:
   ```
   cd ~/fastify-backend
   pkill -f server.ts
   ./start-fastify.sh > fastify.log 2>&1 &
   
   cd ~/public_html
   pkill -f server.js
   ./start-express.sh > express.log 2>&1 &
   ```

### Database Connection Issues

1. Verify PostgreSQL credentials:
   ```
   psql -U myfrovov_freshshare_user -d myfrovov_freshshare -c "SELECT 1"
   ```

2. Check connection string in `.env` file

3. Ensure PostgreSQL service is running:
   ```
   systemctl status postgresql
   ```

## Maintenance

### Restarting Services

To restart services after updates:

```bash
# Restart Fastify backend
cd ~/fastify-backend
pkill -f server.ts
./start-fastify.sh > fastify.log 2>&1 &

# Restart Express server
cd ~/public_html
pkill -f server.js
./start-express.sh > express.log 2>&1 &
```

### Updating Application

To update the application:

1. Upload new files to the respective directories
2. Install any new dependencies
3. Restart services
