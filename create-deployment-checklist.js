/**
 * FreshShare Deployment Checklist Creator
 * This script creates a deployment checklist for manually packaging your files
 */

const fs = require('fs');
const path = require('path');

// Output file
const outputFile = path.join(__dirname, 'DEPLOYMENT_CHECKLIST.md');

// Create the checklist content
const checklistContent = `# FreshShare Deployment Checklist

## Essential Files to Upload

### Express Server (Root Directory)
- [ ] server.js (Main Express server)
- [ ] package.json
- [ ] package-lock.json
- [ ] .htaccess (Apache configuration)
- [ ] .env (Renamed from .env.production)
- [ ] start-express.sh (Startup script)

### Fastify Backend (/fastify-backend Directory)
- [ ] server.ts (Fastify server)
- [ ] package.json
- [ ] package-lock.json
- [ ] .env (Renamed from .env.production)
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
- [ ] Configure FASTIFY_BACKEND_URL for your hosting environment

### Fastify Backend
- [ ] Update PostgreSQL connection string in .env
- [ ] Verify PORT is set to 8080 (matches .htaccess and Express config)

## Hosting Setup

### cPanel Configuration
- [ ] Set up Node.js environment (version 18.x)
- [ ] Create two Node.js applications (Express & Fastify)
- [ ] Enable required Apache modules (mod_proxy, mod_rewrite)
- [ ] Set execute permissions on startup scripts:
      \`\`\`
      chmod +x start-express.sh
      chmod +x fastify-backend/start-fastify.sh
      \`\`\`

## Database Setup
- [ ] Create MongoDB Atlas cluster and database
- [ ] Add your server's IP to MongoDB Atlas whitelist
- [ ] Set up PostgreSQL database in cPanel or external service

## Post-Upload Steps
- [ ] Install dependencies:
      \`\`\`
      npm install --production
      cd fastify-backend && npm install --production
      \`\`\`
- [ ] Start Fastify backend first
- [ ] Start Express server second
- [ ] Test main site and API endpoints
- [ ] Check logs for any errors

## Reference Documents
- [ ] DEPLOYMENT_STEPS.md (Detailed deployment guide)
- [ ] DB_SETUP.md (Database setup instructions)
`;

// Write the checklist to file
fs.writeFileSync(outputFile, checklistContent);

console.log(`Deployment checklist created at: ${outputFile}`);
console.log('Follow this checklist to manually prepare and upload your deployment package.');
