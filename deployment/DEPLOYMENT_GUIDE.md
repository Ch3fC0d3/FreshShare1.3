# FreshShare Deployment Guide for Namecheap Stellar Hosting

This guide provides step-by-step instructions for deploying the FreshShare application to Namecheap Stellar hosting with cPanel.

## Prerequisites

- Namecheap Stellar hosting account
- cPanel access
- FTP client (FileZilla, WinSCP, etc.)
- Git (optional)

## Deployment Steps

### 1. Set Up Node.js Environment

1. Log in to your cPanel account
2. Navigate to "Software" → "Setup Node.js App"
3. Click "Create Application"
4. Configure the following settings:
   - Node.js version: 18.x or higher
   - Application mode: Production
   - Application root: `/home/username/public_html` (or your preferred directory)
   - Application URL: Your domain or subdomain
   - Application startup file: `server.js`
   - Passenger log file: Leave default

### 2. Upload Application Files

#### Option 1: Using FTP

1. Connect to your server using FTP credentials
2. Upload the Express server files to the root directory
3. Upload the Fastify backend files to a subdirectory (e.g., `/fastify-backend/`)

#### Option 2: Using Git

1. In cPanel, go to "Git™ Version Control"
2. Create a new repository or clone your existing one
3. Follow the instructions to push your code

### 3. Configure Environment Variables

1. Create `.env` files for both Express and Fastify applications:
   - Copy `deployment/express-env-example` to `.env` in the Express root directory
   - Copy `deployment/fastify-env-example` to `.env` in the Fastify backend directory
2. Update the environment variables with your production values
3. Alternatively, set environment variables in the Node.js app configuration in cPanel

### 4. Set Up Apache Proxy

1. Upload the provided `.htaccess` file to your root directory
2. Make sure mod_proxy and mod_rewrite are enabled (these are typically enabled by default in Namecheap Stellar)

### 5. Install Dependencies

1. In cPanel, open "Terminal" or SSH into your server
2. Navigate to your application directory:
   ```bash
   cd ~/public_html
   ```
3. Install dependencies for Express server:
   ```bash
   npm install --production
   ```
4. Navigate to Fastify backend directory:
   ```bash
   cd fastify-backend
   ```
5. Install dependencies for Fastify backend:
   ```bash
   npm install --production
   ```

### 6. Set Up Databases

Follow the instructions in the `DB_SETUP.md` file to create and configure:
- MongoDB for Express server
- PostgreSQL for Fastify backend

### 7. Start Applications

1. In cPanel, go to "Setup Node.js App"
2. Select your application and click "Start Application"
3. For the Fastify backend, create a second Node.js application pointing to the fastify-backend directory

### 8. Configure SSL

1. In cPanel, go to "Security" → "SSL/TLS"
2. Install and configure SSL for your domain
3. Update the CSP headers in your `.htaccess` file to use HTTPS URLs

### 9. Test Your Deployment

1. Visit your domain to verify the Express server is running
2. Test authentication and marketplace functionality
3. Verify the proxy to Fastify backend is working correctly

## Troubleshooting

- Check application logs in cPanel under "Logs"
- For Node.js specific errors, check the logs in the Node.js app configuration
- For database connection issues, verify credentials and connection strings
- If you encounter CSP errors, update the CSP headers in the `.htaccess` file

## Maintenance

- Use cPanel's built-in backup tools to regularly backup your application and databases
- Monitor your application's resource usage in the cPanel dashboard
- Update your application by repeating the upload and dependency installation steps
