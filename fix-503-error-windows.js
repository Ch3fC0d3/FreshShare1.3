/**
 * FreshShare 503 Error Fix Script for Windows
 * This script helps diagnose and fix 503 errors in the local Windows environment
 * by checking and starting required services.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Define colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
};

// Configuration
const EXPRESS_PORT = process.env.PORT || 3001;
const FASTIFY_PORT = process.env.FASTIFY_PORT || 8080;
const PROJECT_ROOT = path.resolve(__dirname);
const FASTIFY_DIR = path.join(PROJECT_ROOT, 'fastify-backend');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public_html');

// Log with color
function log(message, color = colors.reset) {
  console.log(color, message, colors.reset);
}

// Check if a port is in use
function isPortInUse(port) {
  try {
    execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

// Check if a Node.js process is running with specific arguments
function isProcessRunning(processName) {
  try {
    const output = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', { encoding: 'utf8' });
    return output.toLowerCase().includes(processName.toLowerCase());
  } catch (e) {
    return false;
  }
}

// Wait for service to be available
function waitForService(url, maxAttempts = 10) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    function checkService() {
      log(`Checking service at ${url} (attempt ${attempts + 1}/${maxAttempts})...`, colors.cyan);
      
      http.get(url, (res) => {
        log(`Service at ${url} responded with status code: ${res.statusCode}`, colors.green);
        resolve(res.statusCode);
      }).on('error', (err) => {
        attempts++;
        
        if (attempts >= maxAttempts) {
          log(`Service at ${url} failed to respond after ${maxAttempts} attempts: ${err.message}`, colors.red);
          reject(err);
        } else {
          log(`Retrying in 2 seconds...`, colors.yellow);
          setTimeout(checkService, 2000);
        }
      });
    }
    
    checkService();
  });
}

// Check environment files
function checkEnvironmentFiles() {
  log("\n=== Checking Environment Files ===", colors.magenta);
  
  // Check Express .env
  if (!fs.existsSync(path.join(PROJECT_ROOT, '.env'))) {
    log("Creating basic Express .env file...", colors.yellow);
    const expressEnv = [
      "PORT=3001",
      "NODE_ENV=development",
      "MONGODB_URI=mongodb://127.0.0.1:27017/freshshare_db",
      "MONGODB_SSL=false",
      "FASTIFY_BACKEND_URL=http://localhost:8080",
      "JWT_SECRET=local-dev-secret-key",
      "BASE_URL="
    ].join('\n');
    
    fs.writeFileSync(path.join(PROJECT_ROOT, '.env'), expressEnv);
    log("Express .env file created", colors.green);
  } else {
    log("Express .env file exists", colors.green);
  }
  
  // Check Fastify .env
  if (!fs.existsSync(path.join(FASTIFY_DIR, '.env'))) {
    log("Creating basic Fastify .env file...", colors.yellow);
    const fastifyEnv = [
      "PORT=8080",
      "NODE_ENV=development",
      "DATABASE_URL=postgresql://postgres:password@localhost:5432/freshshare",
      "DATABASE_SSL=false"
    ].join('\n');
    
    fs.writeFileSync(path.join(FASTIFY_DIR, '.env'), fastifyEnv);
    log("Fastify .env file created", colors.green);
  } else {
    log("Fastify .env file exists", colors.green);
  }
}

// Check and configure Apache proxy (.htaccess)
function checkApacheProxy() {
  log("\n=== Checking Apache Proxy Configuration ===", colors.magenta);
  
  const htaccessPath = path.join(PUBLIC_DIR, '.htaccess');
  if (!fs.existsSync(htaccessPath)) {
    log("No .htaccess found in public_html, creating one...", colors.yellow);
    
    const htaccessContent = `
# FreshShare Apache Configuration
# Created by fix-503-error-windows.js

<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # If you're accessing via localhost, you may not need these proxy rules
  # as you can directly access the Express and Fastify servers
  
  # Uncomment these lines if you need Apache to proxy to Node.js on production
  # RewriteRule ^api/(.*)$ http://localhost:8080/$1 [P,L]
  # RewriteCond %{REQUEST_FILENAME} !-f
  # RewriteCond %{REQUEST_FILENAME} !-d
  # RewriteRule ^(.*)$ http://localhost:3001/$1 [P,L]
</IfModule>

# Set security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-XSS-Protection "1; mode=block"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Serve static assets with proper cache control
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
`;
    
    fs.writeFileSync(htaccessPath, htaccessContent);
    log(".htaccess created in public_html directory", colors.green);
  } else {
    log(".htaccess exists in public_html directory", colors.green);
  }
}

// Check dependencies
function checkDependencies() {
  log("\n=== Checking Dependencies ===", colors.magenta);
  
  try {
    // Check if package.json exists
    if (!fs.existsSync(path.join(PROJECT_ROOT, 'package.json'))) {
      throw new Error("package.json not found");
    }
    
    // Check Express dependencies
    log("Checking Express dependencies...", colors.cyan);
    const missingDeps = [];
    const requiredDeps = ['express', 'mongoose', 'dotenv', 'http-proxy-middleware', 'cors', 'cookie-parser', 'ejs', 'express-ejs-layouts'];
    
    requiredDeps.forEach(dep => {
      try {
        require.resolve(path.join(PROJECT_ROOT, 'node_modules', dep));
      } catch (e) {
        missingDeps.push(dep);
      }
    });
    
    if (missingDeps.length > 0) {
      log(`Installing missing Express dependencies: ${missingDeps.join(', ')}`, colors.yellow);
      execSync(`npm install --save ${missingDeps.join(' ')}`, { stdio: 'inherit', cwd: PROJECT_ROOT });
    } else {
      log("All Express dependencies are installed", colors.green);
    }
    
    // Check Fastify dependencies
    log("Checking Fastify dependencies...", colors.cyan);
    const missingFastifyDeps = [];
    const requiredFastifyDeps = ['fastify', 'pg', 'dotenv'];
    
    // Create fastify-backend directory if it doesn't exist
    if (!fs.existsSync(FASTIFY_DIR)) {
      log("Creating fastify-backend directory...", colors.yellow);
      fs.mkdirSync(FASTIFY_DIR, { recursive: true });
    }
    
    // Check if Fastify package.json exists
    if (!fs.existsSync(path.join(FASTIFY_DIR, 'package.json'))) {
      log("Creating basic Fastify package.json...", colors.yellow);
      const fastifyPackageJson = {
        "name": "freshshare-fastify-backend",
        "version": "1.0.0",
        "description": "FreshShare Fastify Backend",
        "main": "server.js",
        "scripts": {
          "start": "node server.js"
        },
        "dependencies": {
          "fastify": "^4.0.0",
          "pg": "^8.7.0",
          "dotenv": "^16.0.0"
        }
      };
      
      fs.writeFileSync(
        path.join(FASTIFY_DIR, 'package.json'), 
        JSON.stringify(fastifyPackageJson, null, 2)
      );
    }
    
    // Check for node_modules
    if (!fs.existsSync(path.join(FASTIFY_DIR, 'node_modules'))) {
      log("Installing Fastify dependencies...", colors.yellow);
      execSync('npm install', { stdio: 'inherit', cwd: FASTIFY_DIR });
    } else {
      requiredFastifyDeps.forEach(dep => {
        try {
          require.resolve(path.join(FASTIFY_DIR, 'node_modules', dep));
        } catch (e) {
          missingFastifyDeps.push(dep);
        }
      });
      
      if (missingFastifyDeps.length > 0) {
        log(`Installing missing Fastify dependencies: ${missingFastifyDeps.join(', ')}`, colors.yellow);
        execSync(`npm install --save ${missingFastifyDeps.join(' ')}`, { stdio: 'inherit', cwd: FASTIFY_DIR });
      } else {
        log("All Fastify dependencies are installed", colors.green);
      }
    }
  } catch (error) {
    log(`Error checking dependencies: ${error.message}`, colors.red);
    throw error;
  }
}

// Check and create Fastify server if needed
function checkFastifyServer() {
  log("\n=== Checking Fastify Server ===", colors.magenta);
  
  const serverPath = path.join(FASTIFY_DIR, 'server.js');
  if (!fs.existsSync(serverPath)) {
    log("Creating Fastify server.js...", colors.yellow);
    
    const fastifyServerContent = `
require('dotenv/config');
const fastify = require('fastify');
const { Pool } = require('pg');

// Config
const PORT = Number(process.env.PORT || 8080);
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/freshshare';
console.log('Starting server on port:', PORT);
console.log('Using database URL (redacted):', DATABASE_URL.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'));

// Create app
const app = fastify({ 
  logger: true,
  trustProxy: true
});

// Basic health check endpoint
app.get('/health', async () => ({ ok: true }));

// Minimal parse-label endpoint
app.post('/parse-label', async (req, reply) => {
  const body = req.body || {};
  return { gtinCase: body.text?.slice(0, 14) || null };
});

// Minimal case-pack endpoint
app.get('/case-pack', async (req, reply) => {
  return { items: [] };
});

// Start server
app.listen({ port: PORT, host: '0.0.0.0' })
  .then(() => {
    console.log(\`FreshShare backend listening on port \${PORT}\`);
    // Create a status file to indicate successful startup
    require('fs').writeFileSync('.server_running', new Date().toISOString());
  })
  .catch((err) => { 
    console.error('Server startup error:', err); 
    process.exit(1); 
  });`;
    
    fs.writeFileSync(serverPath, fastifyServerContent);
    log("Fastify server.js created", colors.green);
  } else {
    log("Fastify server.js exists", colors.green);
  }
}

// Kill existing Node.js processes
function killExistingProcesses() {
  log("\n=== Stopping Existing Node.js Processes ===", colors.magenta);
  
  try {
    if (isPortInUse(EXPRESS_PORT)) {
      log(`Killing process using port ${EXPRESS_PORT}...`, colors.yellow);
      execSync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${EXPRESS_PORT}') do taskkill /F /PID %a`, { stdio: 'inherit' });
    }
    
    if (isPortInUse(FASTIFY_PORT)) {
      log(`Killing process using port ${FASTIFY_PORT}...`, colors.yellow);
      execSync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${FASTIFY_PORT}') do taskkill /F /PID %a`, { stdio: 'inherit' });
    }
    
    log("Stopped any existing Node.js processes", colors.green);
  } catch (error) {
    log(`No processes needed to be stopped or error occurred: ${error.message}`, colors.yellow);
  }
}

// Start Fastify backend
function startFastifyBackend() {
  log("\n=== Starting Fastify Backend ===", colors.magenta);
  
  if (isPortInUse(FASTIFY_PORT)) {
    log(`Fastify port ${FASTIFY_PORT} is already in use, skipping start`, colors.yellow);
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    log("Starting Fastify backend...", colors.cyan);
    
    const fastifyProcess = spawn('node', ['server.js'], {
      cwd: FASTIFY_DIR,
      detached: true,
      stdio: ['ignore', fs.openSync(path.join(PROJECT_ROOT, 'fastify.log'), 'a'), fs.openSync(path.join(PROJECT_ROOT, 'fastify.log'), 'a')]
    });
    
    fastifyProcess.unref();
    
    log(`Fastify backend started with PID ${fastifyProcess.pid}`, colors.green);
    log(`Waiting for Fastify backend to be ready...`, colors.cyan);
    
    // Write PID to file for later reference
    fs.writeFileSync(path.join(FASTIFY_DIR, '.pid'), fastifyProcess.pid.toString());
    
    // Wait for service to be available
    waitForService(`http://localhost:${FASTIFY_PORT}/health`)
      .then(() => {
        log("Fastify backend is ready", colors.green);
        resolve();
      })
      .catch(err => {
        log(`Error starting Fastify backend: ${err.message}`, colors.red);
        reject(err);
      });
  });
}

// Start Express server
function startExpressServer() {
  log("\n=== Starting Express Server ===", colors.magenta);
  
  if (isPortInUse(EXPRESS_PORT)) {
    log(`Express port ${EXPRESS_PORT} is already in use, skipping start`, colors.yellow);
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    log("Starting Express server...", colors.cyan);
    
    const expressProcess = spawn('node', ['server.js'], {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: ['ignore', fs.openSync(path.join(PROJECT_ROOT, 'express.log'), 'a'), fs.openSync(path.join(PROJECT_ROOT, 'express.log'), 'a')]
    });
    
    expressProcess.unref();
    
    log(`Express server started with PID ${expressProcess.pid}`, colors.green);
    log(`Waiting for Express server to be ready...`, colors.cyan);
    
    // Write PID to file for later reference
    fs.writeFileSync(path.join(PROJECT_ROOT, '.pid'), expressProcess.pid.toString());
    
    // Wait for service to be available
    waitForService(`http://localhost:${EXPRESS_PORT}`)
      .then(() => {
        log("Express server is ready", colors.green);
        resolve();
      })
      .catch(err => {
        log(`Error starting Express server: ${err.message}`, colors.red);
        reject(err);
      });
  });
}

// Main function
async function main() {
  try {
    log("\n=== FreshShare 503 Error Fix for Windows ===", colors.blue);
    log("Starting fix process at " + new Date().toISOString(), colors.blue);
    
    // Check environment
    checkEnvironmentFiles();
    
    // Check Apache proxy
    checkApacheProxy();
    
    // Check dependencies
    checkDependencies();
    
    // Check Fastify server
    checkFastifyServer();
    
    // Kill existing processes
    killExistingProcesses();
    
    // Start Fastify backend first
    await startFastifyBackend();
    
    // Then start Express server
    await startExpressServer();
    
    log("\n=== FreshShare Services Status ===", colors.blue);
    log(`Express Server: http://localhost:${EXPRESS_PORT}`, colors.green);
    log(`Fastify Backend: http://localhost:${FASTIFY_PORT}`, colors.green);
    log("\nServices are now running. You can access the application at:", colors.green);
    log(`http://localhost:${EXPRESS_PORT}`, colors.cyan);
    log("\nCheck the following log files if you encounter issues:", colors.green);
    log(`- ${path.join(PROJECT_ROOT, 'express.log')}`, colors.cyan);
    log(`- ${path.join(PROJECT_ROOT, 'fastify.log')}`, colors.cyan);
    
    log("\n503 Error Fix Complete! The application should now be accessible.", colors.green);
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    log("Check the logs for more details", colors.red);
    process.exit(1);
  }
}

// Run the main function
main();
