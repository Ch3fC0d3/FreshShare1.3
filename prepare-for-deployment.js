/**
 * FreshShare Deployment Preparation Script
 * 
 * This script prepares all necessary files for deployment to production.
 * It creates a deployment-ready directory with all required files.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const sourceDir = __dirname;
const deploymentDir = path.join(sourceDir, 'deployment-ready');
const expressDir = path.join(deploymentDir, 'express');
const fastifyDir = path.join(deploymentDir, 'fastify-backend');

// Files to include in Express deployment
const expressFiles = [
  'server.js',
  'package.json',
  'package-lock.json',
  'start-express.sh',
  'setup-cron-jobs.sh',
  'deploy-nodejs-production.sh',
  'diagnose-nodejs-production.js'
];

// Directories to include in Express deployment
const expressDirs = [
  'public',
  'routes',
  'controllers',
  'middleware',
  'models',
  'views',
  'config'
];

// Files to include in Fastify deployment
const fastifyFiles = [
  'server.ts',
  'package.json',
  'package-lock.json',
  'start-fastify.sh'
];

// Create deployment directory structure
console.log('Creating deployment directory structure...');

// Create main deployment directory if it doesn't exist
if (!fs.existsSync(deploymentDir)) {
  fs.mkdirSync(deploymentDir);
}

// Create Express directory
if (!fs.existsSync(expressDir)) {
  fs.mkdirSync(expressDir);
}

// Create Fastify directory
if (!fs.existsSync(fastifyDir)) {
  fs.mkdirSync(fastifyDir);
}

// Copy Express files
console.log('Copying Express files...');
expressFiles.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(expressDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied ${file}`);
  } else {
    console.warn(`Warning: ${file} not found in source directory`);
  }
});

// Copy Express directories
console.log('Copying Express directories...');
expressDirs.forEach(dir => {
  const sourcePathDir = path.join(sourceDir, dir);
  const destPathDir = path.join(expressDir, dir);
  
  if (fs.existsSync(sourcePathDir)) {
    // Create directory if it doesn't exist
    if (!fs.existsSync(destPathDir)) {
      fs.mkdirSync(destPathDir, { recursive: true });
    }
    
    // Copy directory contents recursively
    copyDirRecursive(sourcePathDir, destPathDir);
    console.log(`Copied ${dir} directory`);
  } else {
    console.warn(`Warning: ${dir} directory not found in source directory`);
  }
});

// Copy Fastify files
console.log('Copying Fastify files...');
const fastifySourceDir = path.join(sourceDir, 'fastify-backend');
if (fs.existsSync(fastifySourceDir)) {
  fastifyFiles.forEach(file => {
    const sourcePath = path.join(fastifySourceDir, file);
    const destPath = path.join(fastifyDir, file);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${file}`);
    } else {
      console.warn(`Warning: ${file} not found in fastify-backend directory`);
    }
  });
  
  // Copy any additional files in the fastify-backend directory
  const fastifyContents = fs.readdirSync(fastifySourceDir);
  fastifyContents.forEach(item => {
    const sourcePath = path.join(fastifySourceDir, item);
    const destPath = path.join(fastifyDir, item);
    
    // Skip directories and already copied files
    if (fs.statSync(sourcePath).isDirectory() || fastifyFiles.includes(item)) {
      return;
    }
    
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied additional file: ${item}`);
  });
} else {
  console.error('Error: fastify-backend directory not found');
}

// Create example .env files
console.log('Creating example .env files...');

// Express .env example
const expressEnvContent = `PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freshshare
JWT_SECRET=your-jwt-secret-key
FASTIFY_BACKEND_URL=http://localhost:8080
`;
fs.writeFileSync(path.join(expressDir, '.env.example'), expressEnvContent);

// Fastify .env example
const fastifyEnvContent = `PORT=8080
NODE_ENV=production
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/freshshare
JWT_SECRET=your-jwt-secret-key
`;
fs.writeFileSync(path.join(fastifyDir, '.env.example'), fastifyEnvContent);

// Create README file
console.log('Creating README file...');
const readmeContent = `# FreshShare Deployment Package

This directory contains all the files needed to deploy FreshShare to production using the Node.js-only approach.

## Directory Structure

- \`express/\` - Main Express server files (deploy to ~/public_html)
- \`fastify-backend/\` - Fastify backend files (deploy to ~/fastify-backend)

## Deployment Instructions

1. Upload the contents of \`express/\` to \`~/public_html/\` on your server
2. Upload the contents of \`fastify-backend/\` to \`~/fastify-backend/\` on your server
3. Rename \`.env.example\` files to \`.env\` and update with your production values
4. Set execute permissions on scripts:
   \`\`\`bash
   chmod +x ~/public_html/start-express.sh
   chmod +x ~/fastify-backend/start-fastify.sh
   chmod +x ~/public_html/setup-cron-jobs.sh
   \`\`\`
5. Install dependencies:
   \`\`\`bash
   cd ~/public_html && npm install --production
   cd ~/fastify-backend && npm install --production
   \`\`\`
6. Run the deployment script:
   \`\`\`bash
   bash ~/public_html/deploy-nodejs-production.sh
   \`\`\`

For detailed instructions, refer to the NODEJS_IMPLEMENTATION_GUIDE.md file.
`;
fs.writeFileSync(path.join(deploymentDir, 'README.md'), readmeContent);

// Copy documentation files
console.log('Copying documentation files...');
const docFiles = [
  'NODEJS_IMPLEMENTATION_GUIDE.md',
  'NODEJS_SOLUTION_SUMMARY.md',
  'DEPLOYMENT_CHECKLIST.md',
  'EMERGENCY_FIX_GUIDE.md'
];

docFiles.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(deploymentDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied ${file}`);
  } else {
    console.warn(`Warning: ${file} not found in source directory`);
  }
});

// Create a ZIP file of the deployment directory
console.log('Creating deployment ZIP file...');
try {
  const zipCommand = `powershell Compress-Archive -Path "${deploymentDir}/*" -DestinationPath "${sourceDir}/freshshare-deployment.zip" -Force`;
  execSync(zipCommand);
  console.log('Deployment ZIP file created: freshshare-deployment.zip');
} catch (error) {
  console.error('Error creating ZIP file:', error.message);
  console.log('Please manually zip the deployment-ready directory.');
}

console.log('\nDeployment preparation complete!');
console.log('The deployment-ready directory contains all files needed for production.');
console.log('A ZIP file has also been created for easy transfer to your production server.');
console.log('\nNext steps:');
console.log('1. Upload the files to your production server');
console.log('2. Follow the instructions in the README.md file');

// Helper function to copy directory contents recursively
function copyDirRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}
