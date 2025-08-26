// Deployment Monitor Script
// Run this to check if your deployment has been successful
const http = require('http');
const https = require('https');

// Configuration
const SITE_URL = 'https://myfrovov.com'; // Update to your actual domain
const EXPRESS_PORT = 3001;
const FASTIFY_PORT = 8080;
const LOCAL_CHECK = true; // Set to false if you're not on the server

console.log('=== FreshShare Deployment Monitor ===');
console.log('Running checks at:', new Date().toISOString());

// Check remote site
function checkRemoteSite() {
  return new Promise((resolve) => {
    console.log(`\n[Remote] Checking site: ${SITE_URL}`);

    const client = SITE_URL.startsWith('https') ? https : http;
    const req = client.request(SITE_URL, (res) => {
      console.log(`[Remote] Status: ${res.statusCode}`);
      const headers = JSON.stringify(res.headers, null, 2);
      console.log(`[Remote] Headers: ${headers}`);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        // Check for Content-Security-Policy header
        if (res.headers['content-security-policy']) {
          const csp = res.headers['content-security-policy'];
          console.log('[Remote] CSP Header found:');
          console.log(csp);

          if (csp.includes("'unsafe-eval'")) {
            console.log('[Remote] ✅ CSP includes unsafe-eval');
          } else {
            console.log('[Remote] ❌ CSP does not include unsafe-eval');
          }
        } else {
          console.log('[Remote] ⚠️ No CSP header found');
        }

        // Check CSS loading
        if (
          data.includes('<link rel="stylesheet" href="/css/color-system.css">')
        ) {
          console.log('[Remote] ✅ Found color-system.css link');
        } else {
          console.log('[Remote] ❌ Could not find color-system.css link');
        }

        // Check for common errors in the HTML
        if (data.includes('503 Service Unavailable')) {
          console.log(
            '[Remote] ❌ 503 Service Unavailable detected in page content'
          );
        }

        if (data.includes('Error establishing a database connection')) {
          console.log('[Remote] ❌ Database connection error detected');
        }

        console.log(`[Remote] Page size: ${data.length} bytes`);
        resolve(true);
      });
    });

    req.on('error', (err) => {
      console.error(`[Remote] Error: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.error(`[Remote] Request timed out`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Check local services if running on server
function checkLocalServices() {
  if (!LOCAL_CHECK) {
    console.log('\n[Local] Skipping local checks (not running on server)');
    return Promise.resolve();
  }

  return Promise.all([
    checkService('Express', 'localhost', EXPRESS_PORT),
    checkService('Fastify', 'localhost', FASTIFY_PORT),
  ]);
}

function checkService(name, host, port) {
  return new Promise((resolve) => {
    console.log(`\n[${name}] Checking service on ${host}:${port}...`);

    const req = http.request(
      {
        host,
        port,
        path: name === 'Fastify' ? '/health' : '/',
        method: 'GET',
        timeout: 3000,
      },
      (res) => {
        console.log(`[${name}] Status: ${res.statusCode}`);
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          console.log(
            `[${name}] Response: ${data.substring(0, 100)}${data.length > 100 ? '...' : ''}`
          );
          resolve(true);
        });
      }
    );

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

// Run checks
async function runChecks() {
  await checkRemoteSite();
  await checkLocalServices();

  console.log('\n=== Check Complete ===');
  console.log(
    'If you see any issues above, please check the GitHub Actions logs'
  );
  console.log('and server logs for more detailed information.');
}

runChecks();
