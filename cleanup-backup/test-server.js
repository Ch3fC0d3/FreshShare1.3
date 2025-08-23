// Load configuration
require('./config-temp.js');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Create a log function that logs to console
function logToFile(message) {
  const logMessage = `${new Date().toISOString()} - ${message}`;
  console.log(logMessage);
}

logToFile('====== FreshShare 503 Error Diagnosis ======');
logToFile('Testing server configuration:');
logToFile(`- MONGODB_HOST: ${process.env.MONGODB_HOST}`);
logToFile(`- MONGODB_DB: ${process.env.MONGODB_DB}`);
logToFile(`- PORT: ${process.env.PORT}`);
logToFile(`- JWT_SECRET: ${process.env.JWT_SECRET ? '[SET]' : '[NOT SET]'}`);
logToFile(`- FASTIFY_BACKEND_URL: ${process.env.FASTIFY_BACKEND_URL}`);

// Check if fastify backend is installed
logToFile('\nChecking for Fastify backend dependencies...');
let fastifyInstalled = false;
try {
  require.resolve('fastify');
  fastifyInstalled = true;
  logToFile('✓ Fastify is installed');
} catch (e) {
  logToFile('✗ Fastify is NOT installed - this may cause issues if you try to run the backend');
}

// Check for database connectivity
logToFile('\nChecking MongoDB connection status...');
let dbConfigExists = false;
try {
  const dbConfig = require('./config/db.config');
  logToFile(`✓ DB Config found: ${JSON.stringify(dbConfig)}`);
  dbConfigExists = true;
} catch (e) {
  logToFile(`✗ Error loading DB config: ${e.message}`);
}

// Test connection to Fastify backend
logToFile('\nTesting connection to Fastify backend...');

// Parse URL
try {
  const fastifyUrl = new URL(process.env.FASTIFY_BACKEND_URL);
  const options = {
    hostname: fastifyUrl.hostname,
    port: fastifyUrl.port,
    path: '/health',
    method: 'GET',
    timeout: 5000
  };

  logToFile(`Attempting to connect to ${fastifyUrl.hostname}:${fastifyUrl.port}`);
  
  const req = http.request(options, (res) => {
    logToFile(`Fastify backend status code: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      logToFile(`Response data: ${data}`);
      logToFile('Connection test completed');
      logToFile('\n==== DIAGNOSIS RESULT ====');
      
      if (res.statusCode === 200) {
        logToFile('✓ Fastify backend is running and responding normally!');
      } else {
        logToFile(`✗ Fastify backend returned unexpected status code: ${res.statusCode}`);
      }
      
      logToFile('\n==== SOLUTION ====');
      logToFile('To fix the 503 error:');
      logToFile('1. Ensure Fastify backend is running on port 8080');
      logToFile('2. Confirm .env files are properly configured');
      logToFile('3. Check that MongoDB is accessible');
      logToFile('4. Verify proxy settings in server.js and proxy-server.js');
    });
  });

  req.on('error', (e) => {
    logToFile(`Connection error: ${e.message}`);
    logToFile('\n==== DIAGNOSIS RESULT ====');
    logToFile(`✗ This explains the 503 error: The Fastify backend is not running or not accessible at ${process.env.FASTIFY_BACKEND_URL}`);
    
    logToFile('\n==== SOLUTION ====');
    logToFile('1. Start the Fastify backend with: cd fastify-backend && node -r dotenv/config server.ts');
    logToFile('2. Create a .env file in fastify-backend/ directory with:');
    logToFile('   PORT=8080');
    logToFile('   DATABASE_URL=postgres://localhost:5432/freshshare');
    logToFile('3. Install dependencies: npm install fastify pg zod dotenv');
  });

  req.on('timeout', () => {
    logToFile('Connection timed out after 5 seconds');
    logToFile('✗ Fastify backend is not responding');
    req.destroy();
  });

  req.end();
} catch (error) {
  logToFile(`Error setting up request: ${error.message}`);
}
