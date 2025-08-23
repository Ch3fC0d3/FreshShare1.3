# FreshShare Deployment Package

This directory contains all the files needed to deploy FreshShare to production using the Node.js-only approach.

## Directory Structure

- `express/` - Main Express server files (deploy to ~/public_html)
- `fastify-backend/` - Fastify backend files (deploy to ~/fastify-backend)

## Deployment Instructions

1. Upload the contents of `express/` to `~/public_html/` on your server
2. Upload the contents of `fastify-backend/` to `~/fastify-backend/` on your server
3. Rename `.env.example` files to `.env` and update with your production values
4. Set execute permissions on scripts:
   ```bash
   chmod +x ~/public_html/start-express.sh
   chmod +x ~/fastify-backend/start-fastify.sh
   chmod +x ~/public_html/setup-cron-jobs.sh
   ```
5. Install dependencies:
   ```bash
   cd ~/public_html && npm install --production
   cd ~/fastify-backend && npm install --production
   ```
6. Run the deployment script:
   ```bash
   bash ~/public_html/deploy-nodejs-production.sh
   ```

For detailed instructions, refer to the NODEJS_IMPLEMENTATION_GUIDE.md file.
