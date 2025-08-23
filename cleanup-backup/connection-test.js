/**
 * FreshShare Connection Test Script
 * 
 * This script tests connectivity between Express server, Fastify backend,
 * and checks if the proxy forwarding is working correctly.
 */

const http = require('http');
const https = require('https');

// Configuration
const EXPRESS_PORT = process.env.EXPRESS_PORT || 3001;
const FASTIFY_PORT = process.env.FASTIFY_PORT || 8080;
const FASTIFY_HOST = process.env.FASTIFY_HOST || 'localhost';
const EXPRESS_HOST = process.env.EXPRESS_HOST || 'localhost';

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}===== FreshShare Connection Test =====\n${colors.reset}`);

// Helper function to make HTTP requests
async function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// Test Express server connection
async function testExpressServer() {
  console.log(`${colors.bright}Testing Express Server (${EXPRESS_HOST}:${EXPRESS_PORT})...${colors.reset}`);
  
  try {
    const response = await makeRequest({
      hostname: EXPRESS_HOST,
      port: EXPRESS_PORT,
      path: '/',
      method: 'GET'
    });
    
    if (response.statusCode === 200) {
      console.log(`${colors.green}✓ Express server is responding (Status: ${response.statusCode})${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.yellow}⚠ Express server responded with status: ${response.statusCode}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}✗ Failed to connect to Express server: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Possible causes:
    - Express server is not running
    - Port ${EXPRESS_PORT} is not accessible
    - Firewall is blocking the connection${colors.reset}`);
    return false;
  }
}

// Test Fastify backend connection
async function testFastifyBackend() {
  console.log(`\n${colors.bright}Testing Fastify Backend (${FASTIFY_HOST}:${FASTIFY_PORT})...${colors.reset}`);
  
  try {
    const response = await makeRequest({
      hostname: FASTIFY_HOST,
      port: FASTIFY_PORT,
      path: '/health',
      method: 'GET'
    });
    
    if (response.statusCode === 200) {
      console.log(`${colors.green}✓ Fastify backend is responding (Status: ${response.statusCode})${colors.reset}`);
      try {
        const data = JSON.parse(response.data);
        console.log(`${colors.cyan}Response: ${JSON.stringify(data)}${colors.reset}`);
      } catch (e) {
        console.log(`${colors.cyan}Response: ${response.data.substring(0, 100)}${colors.reset}`);
      }
      return true;
    } else {
      console.log(`${colors.yellow}⚠ Fastify backend responded with status: ${response.statusCode}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}✗ Failed to connect to Fastify backend: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Possible causes:
    - Fastify backend is not running
    - Port ${FASTIFY_PORT} is not accessible
    - Firewall is blocking the connection${colors.reset}`);
    return false;
  }
}

// Test proxy forwarding
async function testProxyForwarding() {
  console.log(`\n${colors.bright}Testing Proxy Forwarding...${colors.reset}`);
  
  try {
    const response = await makeRequest({
      hostname: EXPRESS_HOST,
      port: EXPRESS_PORT,
      path: '/api/pack/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200) {
      console.log(`${colors.green}✓ Proxy forwarding is working (Status: ${response.statusCode})${colors.reset}`);
      try {
        const data = JSON.parse(response.data);
        console.log(`${colors.cyan}Response: ${JSON.stringify(data)}${colors.reset}`);
      } catch (e) {
        console.log(`${colors.cyan}Response: ${response.data.substring(0, 100)}${colors.reset}`);
      }
      return true;
    } else if (response.statusCode === 401 || response.statusCode === 403) {
      console.log(`${colors.yellow}⚠ Authentication required (Status: ${response.statusCode})${colors.reset}`);
      console.log(`${colors.yellow}This may be expected if the route requires authentication.${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.yellow}⚠ Proxy forwarding responded with status: ${response.statusCode}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}✗ Failed to test proxy forwarding: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Possible causes:
    - Express server is not properly forwarding requests
    - Fastify backend is not accessible from Express
    - Authentication middleware is blocking the request${colors.reset}`);
    return false;
  }
}

// Check port availability
function checkPortAvailability(host, port) {
  return new Promise((resolve) => {
    const socket = require('net').createConnection(port, host);
    
    socket.on('connect', () => {
      socket.end();
      resolve(false); // Port is in use
    });
    
    socket.on('error', () => {
      resolve(true); // Port is available
    });
  });
}

// Run all tests
async function runTests() {
  console.log(`${colors.bright}System Information:${colors.reset}`);
  console.log(`- Node.js: ${process.version}`);
  console.log(`- Platform: ${process.platform}`);
  console.log(`- Express URL: http://${EXPRESS_HOST}:${EXPRESS_PORT}`);
  console.log(`- Fastify URL: http://${FASTIFY_HOST}:${FASTIFY_PORT}\n`);
  
  // Check port availability first
  console.log(`${colors.bright}Checking port availability...${colors.reset}`);
  
  const expressPortAvailable = await checkPortAvailability(EXPRESS_HOST, EXPRESS_PORT);
  if (expressPortAvailable) {
    console.log(`${colors.red}✗ Express port ${EXPRESS_PORT} is not in use - server may not be running${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Express port ${EXPRESS_PORT} is in use - something is listening${colors.reset}`);
  }
  
  const fastifyPortAvailable = await checkPortAvailability(FASTIFY_HOST, FASTIFY_PORT);
  if (fastifyPortAvailable) {
    console.log(`${colors.red}✗ Fastify port ${FASTIFY_PORT} is not in use - server may not be running${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Fastify port ${FASTIFY_PORT} is in use - something is listening${colors.reset}`);
  }
  
  console.log(''); // Empty line for readability
  
  // Run the main tests
  const expressResult = await testExpressServer();
  const fastifyResult = await testFastifyBackend();
  
  // Only test proxy forwarding if both servers are responding
  let proxyResult = false;
  if (expressResult && fastifyResult) {
    proxyResult = await testProxyForwarding();
  } else {
    console.log(`\n${colors.yellow}⚠ Skipping proxy test because one or both servers are not responding${colors.reset}`);
  }
  
  // Print summary
  console.log(`\n${colors.bright}${colors.cyan}===== Test Summary =====\n${colors.reset}`);
  console.log(`Express Server: ${expressResult ? colors.green + '✓ PASS' : colors.red + '✗ FAIL'}${colors.reset}`);
  console.log(`Fastify Backend: ${fastifyResult ? colors.green + '✓ PASS' : colors.red + '✗ FAIL'}${colors.reset}`);
  console.log(`Proxy Forwarding: ${proxyResult ? colors.green + '✓ PASS' : colors.red + '✗ FAIL'}${colors.reset}`);
  
  // Provide recommendations based on test results
  console.log(`\n${colors.bright}${colors.cyan}===== Recommendations =====\n${colors.reset}`);
  
  if (!expressResult && !fastifyResult) {
    console.log(`${colors.red}Both servers appear to be down. Try these steps:${colors.reset}`);
    console.log(`1. Check if Node.js is installed and in PATH: ${colors.cyan}which node${colors.reset}`);
    console.log(`2. Kill any existing Node processes: ${colors.cyan}pkill -f node${colors.reset}`);
    console.log(`3. Start both servers using the startup scripts`);
    console.log(`4. Check server logs for errors`);
  } else if (!expressResult) {
    console.log(`${colors.yellow}Express server is down but Fastify is running. Try these steps:${colors.reset}`);
    console.log(`1. Check Express server logs: ${colors.cyan}tail -f ~/public_html/express.log${colors.reset}`);
    console.log(`2. Restart Express server: ${colors.cyan}cd ~/public_html && ./start-express.sh${colors.reset}`);
    console.log(`3. Verify environment variables are set correctly`);
  } else if (!fastifyResult) {
    console.log(`${colors.yellow}Fastify backend is down but Express is running. Try these steps:${colors.reset}`);
    console.log(`1. Check Fastify logs: ${colors.cyan}tail -f ~/fastify-backend/fastify.log${colors.reset}`);
    console.log(`2. Restart Fastify backend: ${colors.cyan}cd ~/fastify-backend && ./start-fastify.sh${colors.reset}`);
    console.log(`3. Check if MongoDB connection string is correct`);
  } else if (!proxyResult) {
    console.log(`${colors.yellow}Both servers are running but proxy forwarding isn't working. Try these steps:${colors.reset}`);
    console.log(`1. Check if FASTIFY_BACKEND_URL is set correctly in Express server`);
    console.log(`2. Verify that the authJwt middleware is configured properly`);
    console.log(`3. Check Express server logs for proxy-related errors`);
  } else {
    console.log(`${colors.green}All tests passed! If you're still seeing 503 errors, check:${colors.reset}`);
    console.log(`1. Apache configuration and .htaccess file`);
    console.log(`2. cPanel proxy settings`);
    console.log(`3. Apache error logs: ${colors.cyan}tail -100 /var/log/apache2/error_log${colors.reset}`);
  }
}

// Run all tests
runTests().catch(error => {
  console.error(`${colors.red}Test failed with error: ${error.message}${colors.reset}`);
});
