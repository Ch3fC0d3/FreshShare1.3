# Namecheap Stellar Hosting Configuration Guide for FreshShare

This guide provides detailed, step-by-step instructions for configuring your Namecheap Stellar hosting environment to run the FreshShare application stack.

## 1. Accessing cPanel

1. Log in to your Namecheap account
2. Go to "Dashboard" → "Hosting" → Select your Stellar hosting package
3. Click "Manage" → "Go to cPanel"

## 2. Database Setup

### MongoDB Setup (External MongoDB Atlas)

1. Log in to your MongoDB Atlas account
2. Create a new cluster or use an existing one
3. Create a new database:
   - Navigate to the "Collections" tab
   - Click "Add My Own Data"
   - Enter database name: `freshshare_db`
4. Create a database user:
   - Navigate to "Database Access" under Security
   - Click "Add New Database User"
   - Authentication Method: Password
   - Username: `freshshare_user` (or your preferred name)
   - Password: Generate a strong password
   - Database User Privileges: Atlas admin or specific collection privileges
   - Click "Add User"
5. Configure network access:
   - Navigate to "Network Access" under Security
   - Click "Add IP Address"
   - Add your Namecheap server's IP address or use "Allow Access from Anywhere" (0.0.0.0/0) for testing
6. Get your connection string:
   - Navigate to "Database" → "Connect" → "Connect your application"
   - Copy the connection URI
   - Replace `<password>` with your database user's password
   - Replace `myFirstDatabase` with `freshshare_db`
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/freshshare_db`

### PostgreSQL Setup

1. In cPanel, navigate to "Databases" → "PostgreSQL Databases"
2. Create a new database:
   - Enter database name: `freshshare`
   - Click "Create Database"
3. Create a new user:
   - Enter username: `fastify_user` (or your preferred name)
   - Enter a strong password
   - Click "Create User"
4. Add the user to the database with all privileges:
   - Select the database and user from the dropdown menus
   - Check all privilege boxes
   - Click "Add User To Database"
5. Import the database schema:
   - Click on "phpPgAdmin"
   - Select your database
   - Click on "SQL"
   - Copy and paste the contents of `postgresql-schema.sql`
   - Click "Execute"
6. Note the connection details:
   - Hostname
   - Port
   - Database name
   - Username
   - Password

## 3. Node.js Setup

1. In cPanel, navigate to "Software" → "Setup Node.js App"
2. Create two applications:

### Express Server Application

1. Click "Create Application"
2. Configure the following:
   - Node.js version: 18.x (or latest LTS)
   - Application mode: Production
   - Application root: `/home/username/public_html` (or your preferred directory)
   - Application URL: Your main domain
   - Application startup file: `server.js`
   - Passenger log file: Default
   - Environment variables:
     
     ```ini
     PORT=8080
     FASTIFY_BACKEND_URL=http://localhost:8089
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freshshare_db
     JWT_SECRET=your_strong_secret_key
     ```
     
   - Note: Replace the MongoDB URI with your actual MongoDB Atlas connection string

### Fastify Backend Application

1. Click "Create Application"
2. Configure the following:
   - Node.js version: 18.x (or latest LTS)
   - Application mode: Production
   - Application root: `/home/username/fastify-backend` (or your preferred directory)
   - Application URL: A subdomain or URL path
   - Application startup file: `server.ts`
   - Environment variables:
     ```
     PORT=8089
     DATABASE_URL=postgres://fastify_user:your_password@localhost:5432/freshshare
     ```

## 4. File Upload

### Express Server Files

1. In cPanel, navigate to "Files" → "File Manager"
2. Navigate to your Express application root directory
3. Upload all files from the Express deployment package:
   - Select "Upload" and choose all files
   - Alternatively, use FTP to upload files

### Fastify Backend Files

1. In cPanel, navigate to "Files" → "File Manager"
2. Navigate to your Fastify application root directory
3. Upload all files from the Fastify deployment package:
   - Select "Upload" and choose all files
   - Alternatively, use FTP to upload files

## 5. SSL Configuration

1. In cPanel, navigate to "Security" → "SSL/TLS"
2. Click on "Manage SSL sites"
3. Select your domain
4. Choose one of the following options:
   - Use a free Let's Encrypt certificate
   - Use Namecheap's PositiveSSL (if included with your hosting)
5. Follow the prompts to complete SSL installation
6. Enable "Force HTTPS":
   - In cPanel, navigate to "Security" → "SSL/TLS" → "SSL/TLS Status"
   - Enable "HTTPS Redirect" for your domain

## 6. Apache Configuration

1. In cPanel, navigate to "Files" → "File Manager"
2. Navigate to your public_html directory
3. Look for `.htaccess` file (if it doesn't exist, create one)
4. Replace or update with the contents from the `.htaccess` file in your deployment package

## 7. PM2 Process Manager Setup

Namecheap Stellar hosting supports PM2 for managing Node.js applications.

1. SSH into your server (if SSH access is enabled on your hosting)
2. Navigate to your application directories
3. Install PM2 globally (if not already installed):
   ```bash
   npm install -g pm2
   ```
4. Start the Express server:
   ```bash
   cd ~/public_html
   pm2 start ecosystem.config.js
   ```
5. Start the Fastify backend:
   ```bash
   cd ~/fastify-backend
   pm2 start ecosystem.config.js
   ```
6. Save the PM2 process list:
   
   ```bash
   pm2 save
   ```
   
7. Set up PM2 to start on server reboot:
   
   ```bash
   pm2 startup
   ```
   
   - Follow the instructions provided by the command

## 8. Database Initialization

### MongoDB Initialization

1. Install MongoDB Shell on your local computer if not already installed
2. Connect to your MongoDB Atlas database using the connection string:
   
   ```bash
   mongosh "mongodb+srv://username:password@cluster.mongodb.net/freshshare_db"
   ```
   
3. Once connected, copy and paste the contents of `mongodb-seed.js`
4. Execute the script

Alternatively, you can use MongoDB Compass GUI:

1. Connect to your MongoDB Atlas cluster
2. Navigate to the `freshshare_db` database
3. Use the Compass interface to create collections and import data

### PostgreSQL Initialization

If you haven't already imported the schema in Step 2:

1. In cPanel, navigate to "Databases" → "PostgreSQL Databases"
2. Click on "phpPgAdmin"
3. Select your database
4. Click on "SQL"
5. Copy and paste the contents of `postgresql-schema.sql`
6. Execute the script

## 9. Testing and Verification

1. Visit your domain to verify the Express server is running
2. Test user registration and login
3. Verify all static assets load correctly (no CSP errors)
4. Test the marketplace page functionality
5. Verify API calls to the Fastify backend through the proxy

## 10. Troubleshooting

### Common Issues

1. **Connection refused errors**:
   - Check if both Node.js applications are running
   - Verify port configurations in environment variables

2. **Database connection errors**:
   - Verify database credentials in environment variables
   - Check database user privileges

3. **CSS/JS not loading (CSP errors)**:
   - Check browser console for specific CSP errors
   - Update `.htaccess` file with correct CSP directives

4. **JWT authentication issues**:
   - Verify JWT_SECRET is consistent
   - Check cookie settings and domain configuration

### Log Access

1. In cPanel, navigate to "Metrics" → "Errors"
2. Review error logs for both applications
3. For Node.js specific logs:
   - Check the application logs in the Node.js app configuration
   - Check PM2 logs with: `pm2 logs`

## 11. Backup Strategy

1. In cPanel, navigate to "Files" → "Backup"
2. Configure regular full backups
3. Additionally, set up database-specific backups:
   - For MongoDB: In cPanel, navigate to "Databases" → "MongoDB Databases" → "Backup"
   - For PostgreSQL: In cPanel, navigate to "Databases" → "PostgreSQL Databases" → "Backup"
