/**
 * Deployment Package Preparation Script
 * This script creates a deployment-ready package for hosting
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Define directories
const sourceDir = __dirname;
const deployDir = path.join(sourceDir, 'deployment-ready');
const expressDir = deployDir;
const fastifyDir = path.join(deployDir, 'fastify-backend');

// Create deployment directory structure
console.log('Creating deployment directory structure...');
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true });
}

fs.mkdirSync(deployDir, { recursive: true });
fs.mkdirSync(fastifyDir, { recursive: true });

// Files to copy for Express server
const expressFiles = [
  'server.js',
  'package.json',
  '.htaccess',
  '.env.production',
  'start-express.sh',
  'DEPLOYMENT_STEPS.md'
];

// Directories to copy for Express server
const expressDirs = [
  'public',
  'routes',
  'controllers',
  'middleware',
  'models',
  'views',
  'config'
];

// Files to copy for Fastify backend
const fastifyFiles = [
  'server.ts',
  'package.json',
  '.env.production',
  'start-fastify.sh',
];

// Directories to copy for Fastify backend
const fastifyDirs = [
  'node_modules', // Include node_modules for easier deployment
];

// Copy Express files
console.log('Copying Express server files...');
expressFiles.forEach(file => {
  if (fs.existsSync(path.join(sourceDir, file))) {
    fs.copyFileSync(
      path.join(sourceDir, file),
      path.join(expressDir, file.replace('.env.production', '.env'))
    );
    console.log(`Copied ${file}`);
  } else {
    console.log(`Warning: ${file} not found`);
  }
});

// Copy Express directories
expressDirs.forEach(dir => {
  if (fs.existsSync(path.join(sourceDir, dir))) {
    copyDirectory(path.join(sourceDir, dir), path.join(expressDir, dir));
    console.log(`Copied directory ${dir}`);
  } else {
    console.log(`Warning: directory ${dir} not found`);
  }
});

// Copy Fastify files
console.log('Copying Fastify backend files...');
fastifyFiles.forEach(file => {
  const sourcePath = path.join(sourceDir, 'fastify-backend', file);
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(
      sourcePath,
      path.join(fastifyDir, file.replace('.env.production', '.env'))
    );
    console.log(`Copied ${file} to fastify-backend`);
  } else {
    console.log(`Warning: ${file} not found in fastify-backend`);
  }
});

// Copy Fastify directories
fastifyDirs.forEach(dir => {
  const sourcePath = path.join(sourceDir, 'fastify-backend', dir);
  if (fs.existsSync(sourcePath)) {
    copyDirectory(sourcePath, path.join(fastifyDir, dir));
    console.log(`Copied directory ${dir} to fastify-backend`);
  } else {
    console.log(`Warning: directory ${dir} not found in fastify-backend`);
  }
});

// Create deployment README
fs.writeFileSync(
  path.join(deployDir, 'README.md'),
  `# FreshShare Deployment Package

This package contains all the files needed to deploy FreshShare to your hosting environment.

## Quick Start

1. Upload all files to your hosting root directory
2. Ensure environment variables are set correctly in .env files
3. Make the startup scripts executable:
   \`\`\`
   chmod +x start-express.sh
   chmod +x fastify-backend/start-fastify.sh
   \`\`\`
4. Follow the detailed instructions in DEPLOYMENT_STEPS.md

## Directory Structure

- Root directory: Express server files
- fastify-backend/: Fastify backend files
- .htaccess: Apache configuration for proxy
- start-express.sh: Express server startup script
- fastify-backend/start-fastify.sh: Fastify backend startup script
`
);

console.log('Deployment package created at:', deployDir);
console.log('Next steps:');
console.log('1. Zip the deployment-ready directory');
console.log('2. Upload to your hosting environment');
console.log('3. Follow the instructions in DEPLOYMENT_STEPS.md');

// Helper function to copy directory recursively
function copyDirectory(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}
