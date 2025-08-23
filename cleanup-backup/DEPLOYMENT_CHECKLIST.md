# FreshShare Deployment Checklist (Node.js-only)

## Essential Files to Upload

### Express Server (~/public_html Directory)

- [ ] server.js (Main Express server with proxy configuration)
- [ ] package.json
- [ ] package-lock.json
- [ ] .env (Environment variables)
- [ ] start-express.sh (Startup script)

### Fastify Backend (~/fastify-backend Directory)

- [ ] server.ts (Fastify server)
- [ ] package.json
- [ ] package-lock.json
- [ ] .env (Environment variables)
- [ ] start-fastify.sh (Startup script)

### Directories to Include

- [ ] public/ (Static assets)
- [ ] routes/ (Express routes)
- [ ] controllers/ (Request handlers)
- [ ] middleware/ (Express middleware)
- [ ] models/ (Database models)
- [ ] views/ (EJS templates)
- [ ] config/ (Configuration files)

## Pre-Upload Configuration

### Express Server

- [ ] Update MongoDB Atlas connection string in .env
- [ ] Set JWT secret to a strong production value
- [ ] Configure FASTIFY_BACKEND_URL to `http://localhost:8080`
- [ ] Set PORT to 3001

### Fastify Backend

- [ ] Update MongoDB connection string in .env
- [ ] Set JWT secret to the same value as Express server
- [ ] Verify PORT is set to 8080

## Hosting Setup

### cPanel Configuration

- [ ] Set up Node.js environment (version 14.x or higher)
- [ ] Create Node.js application in cPanel (if using cPanel Node.js app)
- [ ] Set execute permissions on startup scripts:
      ```bash
      chmod +x ~/public_html/start-express.sh
      chmod +x ~/fastify-backend/start-fastify.sh
      ```
- [ ] Set up cron jobs for automatic restart:
      ```bash
      bash ~/public_html/setup-cron-jobs.sh
      ```

## Database Setup

- [ ] Create MongoDB Atlas cluster and database
- [ ] Add your server's IP to MongoDB Atlas whitelist
- [ ] Create necessary collections and indexes

## Post-Upload Steps

- [ ] Install dependencies:
      ```bash
      cd ~/public_html && npm install --production
      cd ~/fastify-backend && npm install --production
      ```
- [ ] Run deployment script or start services manually:
      ```bash
      bash ~/public_html/deploy-nodejs-production.sh
      ```
- [ ] Test main site and API endpoints
- [ ] Check logs for any errors:
      ```bash
      tail -f ~/public_html/express.log
      tail -f ~/fastify-backend/fastify.log
      ```
- [ ] Run diagnostic script if needed:
      ```bash
      node ~/public_html/diagnose-nodejs-production.js
      ```

## Reference Documents

- [ ] NODEJS_PRODUCTION_SETUP.md (Node.js-only setup guide)
- [ ] EMERGENCY_FIX_GUIDE.md (Troubleshooting guide)
- [ ] 503-NODEJS-SOLUTION-SUMMARY.md (503 error fix summary)
- [ ] DB_SETUP.md (Database setup instructions)
