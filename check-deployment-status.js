// Deployment Status Check Script for FreshShare
const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const EXPRESS_PORT = 3001;
const FASTIFY_PORT = 8080;
const LOG_FILES = {
  express: path.join(process.env.HOME || '/home/myfrovov', 'public_html/express.log'),
  fastify: path.join(process.env.HOME || '/home/myfrovov', 'public_html/fastify-backend/fastify.log')
};

console.log('=== FreshShare Deployment Status Check ===');
console.log('Running checks at:', new Date().toISOString());

// 1. Check if services are running
function checkService(name, host, port) {
  return new Promise((resolve) => {
    console.log(`\n[${name}] Checking service on ${host}:${port}...`);
    
    const req = http.request({
      host,
      port,
      path: name === 'Fastify' ? '/health' : '/',
      method: 'GET',
      timeout: 3000
    }, (res) => {
      console.log(`[${name}] Status: ${res.statusCode}`);
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`[${name}] Response: ${data.substring(0, 100)}${data.length > 100 ? '...' : ''}`);
        resolve(true);
      });
    });
    
    req.on('error', (err) => {
      console.error(`[${name}] Error: ${err.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.error(`[${name}] Request timed out`);
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// 2. Check log files for errors
function checkLogs(name, logFile) {
  console.log(`\n[${name}] Checking log file: ${logFile}`);
  
  try {
    if (fs.existsSync(logFile)) {
      // Get last 20 lines of log
      const data = fs.readFileSync(logFile, 'utf8');
      const lines = data.split('\n').slice(-20);
      
      console.log(`[${name}] Last ${lines.length} log entries:`);
      lines.forEach(line => {
        if (line.toLowerCase().includes('error') || line.toLowerCase().includes('exception')) {
          console.log(`[${name}] ERROR: ${line}`);
        } else if (line.trim()) {
          console.log(`[${name}] ${line}`);
        }
      });
    } else {
      console.error(`[${name}] Log file not found`);
    }
  } catch (err) {
    console.error(`[${name}] Error reading log: ${err.message}`);
  }
}

// 3. Check environment files
function checkEnvFiles() {
  console.log('\n[Config] Checking environment files');
  
  const envFiles = [
    path.join(process.env.HOME || '/home/myfrovov', 'public_html/.env'),
    path.join(process.env.HOME || '/home/myfrovov', 'public_html/fastify-backend/.env')
  ];
  
  envFiles.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        console.log(`[Config] ${file} exists`);
        
        // Check for critical variables without showing values
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        console.log(`[Config] ${file} contains:`);
        lines.forEach(line => {
          if (line.trim() && !line.startsWith('#')) {
            const parts = line.split('=');
            if (parts.length >= 2) {
              console.log(`[Config] - ${parts[0]} is set`);
            }
          }
        });
      } else {
        console.error(`[Config] ${file} not found`);
      }
    } catch (err) {
      console.error(`[Config] Error checking ${file}: ${err.message}`);
    }
  });
}

// 4. Check database initialization marker
function checkDbInitialization() {
  console.log('\n[Database] Checking initialization status');
  
  const dbMarkerFile = path.join(
    process.env.HOME || '/home/myfrovov', 
    'public_html/fastify-backend/.db_initialized'
  );
  
  try {
    if (fs.existsSync(dbMarkerFile)) {
      console.log('[Database] Database has been initialized');
    } else {
      console.error('[Database] Database initialization marker not found');
      console.log('[Database] This may indicate the database was never initialized');
    }
  } catch (err) {
    console.error(`[Database] Error checking initialization: ${err.message}`);
  }
}

// Run all checks
async function runChecks() {
  // Check services
  await checkService('Express', 'localhost', EXPRESS_PORT);
  await checkService('Fastify', 'localhost', FASTIFY_PORT);
  
  // Check logs
  Object.entries(LOG_FILES).forEach(([name, file]) => {
    checkLogs(name.charAt(0).toUpperCase() + name.slice(1), file);
  });
  
  // Check environment files
  checkEnvFiles();
  
  // Check database initialization
  checkDbInitialization();
  
  console.log('\n=== Check Complete ===');
  console.log('If you continue to see 503 errors, please check the logs for specific errors');
  console.log('and ensure both Express and Fastify services are running.');
}

runChecks();
