# FreshShare Deployment Package

This package contains all the files needed to deploy FreshShare to your hosting environment.

## Quick Start

1. Upload all files to your hosting root directory
2. Ensure environment variables are set correctly in .env files
3. Make the startup scripts executable:
   ```
   chmod +x start-express.sh
   chmod +x fastify-backend/start-fastify.sh
   ```
4. Follow the detailed instructions in DEPLOYMENT_STEPS.md

## Directory Structure

- Root directory: Express server files
- fastify-backend/: Fastify backend files
- .htaccess: Apache configuration for proxy
- start-express.sh: Express server startup script
- fastify-backend/start-fastify.sh: Fastify backend startup script
