/**
 * FreshShare One-Click Deployment Script
 * 
 * This script prepares a deployment package with all necessary files
 * and creates a deployment guide with exact commands to run on your server.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const sourceDir = __dirname;
const deploymentDir = path.join(sourceDir, 'deployment-ready');
const expressDir = path.join(deploymentDir, 'public_html');
const fastifyDir = path.join(deploymentDir, 'fastify-backend');

// Create deployment directory structure
console.log('Creating deployment package...');

// Remove existing deployment directory if it exists
if (fs.existsSync(deploymentDir)) {
  fs.rmSync(deploymentDir, { recursive: true, force: true });
}

// Create main directories
fs.mkdirSync(deploymentDir);
fs.mkdirSync(expressDir);
fs.mkdirSync(fastifyDir);

// Copy Express server files
console.log('Copying Express server files...');
copyFilesForExpress();

// Copy Fastify backend files
console.log('Copying Fastify backend files...');
copyFilesForFastify();

// Create environment files
console.log('Creating environment files...');
createEnvironmentFiles();

// Create deployment guide
console.log('Creating deployment guide...');
createDeploymentGuide();

// Create ZIP file
console.log('Creating ZIP file...');
createZipFile();

console.log('\n✅ Deployment package created successfully!');
console.log(`📁 Location: ${deploymentDir}`);
console.log('📄 Deployment guide: deployment-ready/DEPLOYMENT_GUIDE.md');
console.log('🗜️ ZIP file: freshshare-deployment.zip');
console.log('\nFollow the instructions in the deployment guide to deploy to your production server.');

// Helper Functions

function copyFilesForExpress() {
  // Essential files
  const essentialFiles = [
    'server.js',
    'package.json',
    'package-lock.json',
    'start-express.sh',
    'setup-cron-jobs.sh',
    'deploy-nodejs-production.sh',
    'diagnose-nodejs-production.js'
  ];
  
  essentialFiles.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, path.join(expressDir, file));
    }
  });
  
  // Essential directories
  const essentialDirs = [
    'public',
    'routes',
    'controllers',
    'middleware',
    'models',
    'views',
    'config'
  ];
  
  essentialDirs.forEach(dir => {
    const sourceDirPath = path.join(sourceDir, dir);
    const destDirPath = path.join(expressDir, dir);
    
    if (fs.existsSync(sourceDirPath)) {
      copyDirRecursive(sourceDirPath, destDirPath);
    }
  });
}

function copyFilesForFastify() {
  const fastifySourceDir = path.join(sourceDir, 'fastify-backend');
  
  if (fs.existsSync(fastifySourceDir)) {
    // Copy all files from fastify-backend
    const files = fs.readdirSync(fastifySourceDir);
    
    files.forEach(file => {
      const sourcePath = path.join(fastifySourceDir, file);
      const destPath = path.join(fastifyDir, file);
      
      if (fs.statSync(sourcePath).isFile()) {
        fs.copyFileSync(sourcePath, destPath);
      } else if (fs.statSync(sourcePath).isDirectory()) {
        copyDirRecursive(sourcePath, path.join(fastifyDir, file));
      }
    });
    
    // Ensure start-fastify.sh exists
    if (!fs.existsSync(path.join(fastifyDir, 'start-fastify.sh'))) {
      const startFastifyContent = `#!/bin/bash
export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH
cd $HOME/fastify-backend

# Load environment variables
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check for dependencies
if [ ! -d "node_modules" ] || [ ! -d "node_modules/fastify" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the server
echo "Starting Fastify backend on port $PORT..."
npx ts-node server.ts > fastify.log 2>&1 &
echo $! > fastify.pid
echo "Fastify backend started with PID $(cat fastify.pid)"
`;
      fs.writeFileSync(path.join(fastifyDir, 'start-fastify.sh'), startFastifyContent);
    }
  }
}

function createEnvironmentFiles() {
  // Express .env
  const expressEnvContent = `PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freshshare
JWT_SECRET=your-jwt-secret-key
FASTIFY_BACKEND_URL=http://localhost:8080
`;
  fs.writeFileSync(path.join(expressDir, '.env.example'), expressEnvContent);
  
  // Fastify .env
  const fastifyEnvContent = `PORT=8080
NODE_ENV=production
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/freshshare
JWT_SECRET=your-jwt-secret-key
`;
  fs.writeFileSync(path.join(fastifyDir, '.env.example'), fastifyEnvContent);
}

function createDeploymentGuide() {
  const guideContent = `# FreshShare Deployment Guide

This guide provides step-by-step instructions for deploying the Node.js-only solution to your production server.

## Prerequisites

- cPanel hosting with Node.js support (v14+)
- SSH access to your hosting account
- MongoDB Atlas account (for database)

## Deployment Steps

### 1. Upload Files

Upload the contents of this deployment package to your server:

- Upload \`public_html/*\` to \`~/public_html/\`
- Upload \`fastify-backend/*\` to \`~/fastify-backend/\`

You can use FTP, SCP, or any other file transfer method:

\`\`\`bash
# Using SCP (replace username and server with your details)
scp -r public_html/* username@your-server.com:~/public_html/
scp -r fastify-backend/* username@your-server.com:~/fastify-backend/
\`\`\`

### 2. Configure Environment Files

1. Create \`.env\` files from the examples:

\`\`\`bash
# On your server
cd ~/public_html
cp .env.example .env
cd ~/fastify-backend
cp .env.example .env
\`\`\`

2. Edit both \`.env\` files to update:
   - MongoDB connection strings
   - JWT secret (use the same value in both files)
   - Verify ports are correct (3001 for Express, 8080 for Fastify)

### 3. Set Execute Permissions

Make the startup scripts executable:

\`\`\`bash
chmod +x ~/public_html/start-express.sh
chmod +x ~/fastify-backend/start-fastify.sh
chmod +x ~/public_html/setup-cron-jobs.sh
chmod +x ~/public_html/deploy-nodejs-production.sh
\`\`\`

### 4. Install Dependencies

Install the required Node.js packages:

\`\`\`bash
cd ~/public_html
npm install --production

cd ~/fastify-backend
npm install --production
\`\`\`

### 5. Run the Deployment Script

The deployment script will set up everything automatically:

\`\`\`bash
cd ~/public_html
./deploy-nodejs-production.sh
\`\`\`

This script will:
- Configure the Node.js environment
- Set up cron jobs for automatic restart
- Start both Express and Fastify services

### 6. Verify Deployment

Check if both services are running:

\`\`\`bash
ps aux | grep node
\`\`\`

Check the logs for any errors:

\`\`\`bash
tail -f ~/public_html/express.log
tail -f ~/fastify-backend/fastify.log
\`\`\`

### 7. Run Diagnostics (If Needed)

If you encounter any issues, run the diagnostic script:

\`\`\`bash
cd ~/public_html
node diagnose-nodejs-production.js
\`\`\`

## Troubleshooting

If you encounter 503 Service Unavailable errors:

1. Check if both services are running
2. Verify port configuration in \`.env\` files
3. Check MongoDB connection strings
4. Review logs for specific errors

For detailed troubleshooting, refer to the EMERGENCY_FIX_GUIDE.md file.

## Maintenance

### Restarting Services

To restart the services manually:

\`\`\`bash
# Kill existing processes
pkill -f "node.*server.js"
pkill -f "node.*server.ts"

# Start services again
cd ~/fastify-backend && ./start-fastify.sh
cd ~/public_html && ./start-express.sh
\`\`\`

### Updating the Application

To update the application:

1. Stop the services
2. Upload the new files
3. Start the services again

## Support

If you need assistance, please refer to the documentation or contact support.
`;

  fs.writeFileSync(path.join(deploymentDir, 'DEPLOYMENT_GUIDE.md'), guideContent);
  
  // Copy additional documentation
  const docFiles = [
    'NODEJS_SOLUTION_SUMMARY.md',
    'EMERGENCY_FIX_GUIDE.md'
  ];
  
  docFiles.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, path.join(deploymentDir, file));
    }
  });
}

function createZipFile() {
  try {
    const zipCommand = `powershell Compress-Archive -Path "${deploymentDir}/*" -DestinationPath "${sourceDir}/freshshare-deployment.zip" -Force`;
    execSync(zipCommand);
  } catch (error) {
    console.error('Error creating ZIP file. Please zip the deployment-ready directory manually.');
  }
}

function copyDirRecursive(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  // Copy each entry
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
