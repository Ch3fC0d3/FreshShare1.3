# Updating Your Existing FreshShare Node.js Deployment

This guide provides instructions for updating your existing Node.js application on Namecheap Stellar hosting to the latest FreshShare version.

## 1. Before You Begin

- Back up your existing application files
- Back up your current database (if any)
- Make note of any custom configurations you have

## 2. Updating Your Existing Node.js Application

### Express Server Update

1. **Prepare your updated Express files**:
   - Run the `prepare-deployment.ps1` script to create deployment packages=
   - The Express server package will be in `deployment-packages/express`

2. **Upload files to your existing application directory**:
   - Connect to your server using FTP or File Manager in cPanel
   - Navigate to your application directory (`/home/myfresho/freshshare12` based on your screenshot)
   - Upload the new files, overwriting existing ones when prompted
   - Be careful to preserve any custom configurations or files

3. **Update environment variables**:
   - Check if you already have a `.env` file in your application directory
   - If yes, update it to include the new MongoDB Atlas connection string:
     
     ```ini
     PORT=8080
     FASTIFY_BACKEND_URL=http://localhost:8089
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freshshare_db
     JWT_SECRET=your_jwt_secret_here
     ```
     
   - If no `.env` file exists, create one based on the example above

4. **Install or update dependencies**:
   - SSH into your server if possible, or use cPanel's Terminal
   - Navigate to your application directory:
     ```bash
     cd /home/myfresho/freshshare12
     ```
   - Run:
     ```bash
     npm install
     ```

### Fastify Backend Addition

1. **Create a new directory for Fastify backend**:
   - In cPanel File Manager, create a new directory for the Fastify backend
   - Suggested path: `/home/myfresho/fastify-backend`

2. **Upload Fastify files**:
   - Upload all files from `deployment-packages/fastify` to the new directory
   - Create a `.env` file with your PostgreSQL connection details:
     
     ```ini
     DATABASE_URL=postgres://fastify_user:your_password@localhost:5432/freshshare
     PORT=8089
     ```
     
3. **Install Fastify dependencies**:
   - SSH into your server if possible, or use cPanel's Terminal
   - Navigate to the Fastify directory:
     ```bash
     cd /home/myfresho/fastify-backend
     ```
   - Run:
     ```bash
     npm install
     ```

## 3. Database Configuration

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account if you don't already have one
2. Update your `.env` file with the MongoDB Atlas connection string

**For Express Frontend**

```
MONGODB_HOST=mongodb+srv://gabepell:YOUR_ACTUAL_PASSWORD@cluster0.yvbja.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB=FreshSareDB
PORT=3001
JWT_SECRET=freshshare-secret-key
FASTIFY_BACKEND_URL=http://localhost:8080
```

**For Fastify Backend**

```
PORT=8080
DATABASE_URL=mongodb+srv://gabepell:YOUR_ACTUAL_PASSWORD@cluster0.yvbja.mongodb.net/FreshSareDB?retryWrites=true&w=majority&appName=Cluster0
NODE_ENV=production
```

> **Note**: Replace `YOUR_ACTUAL_PASSWORD` with your MongoDB Atlas password

### PostgreSQL Setup

1. Follow the PostgreSQL setup instructions in the `NAMECHEAP_HOSTING_GUIDE.md`
2. Import the schema using `postgresql-schema.sql`
3. Update your Fastify `.env` file with the PostgreSQL connection details

## 4. Update Application Configuration

1. **Node.js Application Settings**:
   - In cPanel, go to Node.js Selector
   - Find your existing application and click the edit icon
   - Update the application settings:
     - Application mode: Set to "production" (was "development" in your screenshot)
     - Environment variables: Update as needed
     - Application startup file: Confirm it's set to `server.js`

2. **Configure Fastify as a New Node.js Application**:
   - In cPanel, go to Node.js Selector
   - Click "CREATE APPLICATION"
   - Configure:
     - Node.js version: 18.x (or the version compatible with Fastify)
     - Application mode: Production
     - Application root: `/home/myfresho/fastify-backend`
     - Application URL: Select an available subdomain or path
     - Application startup file: `server.ts`
     - Add the environment variables from your Fastify `.env` file

## 5. Apache Configuration

1. **Update .htaccess**:
   - Check if you have an existing `.htaccess` file in your application directory
   - If yes, update it with the proxy settings from `deployment/.htaccess`
   - If no, upload the provided `.htaccess` file to your application directory

2. **Verify SSL Configuration**:
   - Ensure your SSL certificate is properly configured
   - Update Content Security Policy headers in `.htaccess` if needed

## 6. Starting the Applications

1. **Start or restart Express server**:
   - In cPanel Node.js Selector, click the restart icon for your Express application
   - Or using SSH and PM2:
     ```bash
     cd /home/myfresho/freshshare12
     pm2 start server.js --name "freshshare-express"
     ```

2. **Start Fastify backend**:
   - In cPanel Node.js Selector, click the start icon for your Fastify application
   - Or using SSH and PM2:
     ```bash
     cd /home/myfresho/fastify-backend
     pm2 start server.ts --interpreter="node --loader ts-node/esm" --name "freshshare-fastify"
     ```

3. **Save PM2 process list** (if using PM2):
   ```bash
   pm2 save
   ```

## 7. Testing

1. Visit your domain to verify the Express server is running
2. Test user registration and login
3. Verify all static assets load correctly (no CSP errors)
4. Test the marketplace page functionality
5. Verify API calls to the Fastify backend through the proxy

## 8. Troubleshooting

- **Application won't start**: Check your application logs in cPanel or PM2 logs
- **Database connection issues**: Verify connection strings in your `.env` files
- **Proxy not working**: Check your `.htaccess` file and server error logs
- **CSP errors**: Update the Content Security Policy in `.htaccess` or Express middleware
