# FreshShare Deployment Checklist

Use this checklist to ensure all steps are completed when deploying FreshShare to Namecheap Stellar hosting.

## Pre-Deployment

- [ ] Create deployment packages using the `prepare-deployment.ps1` script
- [ ] Review generated packages in `deployment-packages` directory
- [ ] Update environment variables in `.env.example` files with production values
- [ ] Ensure all dependencies are listed correctly in package.json files
- [ ] Check that MongoDB seed script contains appropriate initial data
- [ ] Verify PostgreSQL schema script has all required tables

## Namecheap cPanel Setup

- [ ] Log in to Namecheap cPanel
- [ ] Create MongoDB database for Express server
- [ ] Create PostgreSQL database for Fastify backend
- [ ] Create database users with appropriate permissions
- [ ] Configure Node.js in cPanel for both applications
- [ ] Enable SSL for your domain

## Express Server Deployment

- [ ] Upload Express server files to main directory
- [ ] Create `.env` file from `.env.example` with production values
- [ ] Install dependencies: `npm install --production`
- [ ] Upload `.htaccess` file to main directory
- [ ] Run MongoDB seed script if needed
- [ ] Configure PM2 for Express server
- [ ] Start Express server application

## Fastify Backend Deployment

- [ ] Upload Fastify backend files to subdirectory
- [ ] Create `.env` file from `.env.example` with production values
- [ ] Install dependencies: `npm install --production`
- [ ] Run PostgreSQL schema script if needed
- [ ] Configure PM2 for Fastify backend
- [ ] Start Fastify backend application

## Testing

- [ ] Verify Express server is accessible via domain
- [ ] Test user registration and login functionality
- [ ] Verify Content Security Policy allows all required resources
- [ ] Test marketplace page loads with all Bootstrap resources
- [ ] Test JWT authentication flow
- [ ] Verify proxy forwarding to Fastify backend
- [ ] Test API endpoints through the proxy

## Post-Deployment

- [ ] Set up automatic backups for both databases
- [ ] Configure log rotation
- [ ] Set up monitoring (optional)
- [ ] Document any custom configurations or issues
- [ ] Store credentials securely

## Security

- [ ] Ensure all passwords are strong and unique
- [ ] Verify JWT secret is secure
- [ ] Confirm SSL is properly configured
- [ ] Check all environment variables for sensitive information
- [ ] Review file permissions

## Maintenance Plan

- [ ] Schedule regular database backups
- [ ] Plan for regular updates and patches
- [ ] Document restart procedures
- [ ] Create monitoring strategy
