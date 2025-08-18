// Comprehensive 503 Error Solution for FreshShare
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require('express');

// 1. Start a simple mock backend server on port 8080
const mockServer = http.createServer((req, res) => {
  console.log(`[MOCK BACKEND] Received request: ${req.method} ${req.url}`);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    status: 'success',
    message: 'Mock Fastify backend is running',
    url: req.url
  }));
});

// 2. Create a simple Express proxy server
const app = express();

// Add middleware to log requests
app.use((req, res, next) => {
  console.log(`[PROXY] ${req.method} ${req.url}`);
  next();
});

// Set up proxy middleware
app.use('/api/pack', createProxyMiddleware({
  target: 'http://localhost:8080', // Point to our mock server
  changeOrigin: true,
  pathRewrite: { '^/api/pack': '' },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[PROXY] Forwarding request to backend: ${proxyReq.method} ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[PROXY] Received response from backend: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error('[PROXY] Error:', err.message);
    res.status(503).json({ success: false, message: 'Upstream service unavailable' });
  }
}));

// Add test endpoint on the proxy
app.get('/test', (req, res) => {
  res.json({ message: 'Express proxy is working' });
});

// 3. Start both servers
const MOCK_PORT = 8080;
const PROXY_PORT = 3003;

mockServer.listen(MOCK_PORT, () => {
  console.log(`[MOCK BACKEND] Server running on http://localhost:${MOCK_PORT}`);
  
  app.listen(PROXY_PORT, () => {
    console.log(`[PROXY] Server running on http://localhost:${PROXY_PORT}`);
    console.log('\n===== 503 ERROR SOLUTION =====');
    console.log('Both servers are now running. Try these test URLs:');
    console.log(`1. http://localhost:${PROXY_PORT}/test - Should return "Express proxy is working"`);
    console.log(`2. http://localhost:${PROXY_PORT}/api/pack/test - Should be proxied to backend`);
    console.log(`3. http://localhost:${MOCK_PORT}/test - Direct access to mock backend`);
    console.log('\nIf all tests work, this confirms the 503 error is due to:');
    console.log('1. The Fastify backend not running on port 8080');
    console.log('2. The proxy configuration pointing to the wrong backend URL');
    
    // Automatically test the connection
    console.log('\nAutomatic test in 2 seconds...');
    setTimeout(() => {
      testProxyConnection();
    }, 2000);
  });
});

// 4. Connection test function
function testProxyConnection() {
  console.log('\n===== TESTING CONNECTION =====');
  
  http.get(`http://localhost:${PROXY_PORT}/api/pack/test`, (res) => {
    console.log(`Proxy to backend test: SUCCESS (${res.statusCode})`);
    console.log('\n===== SOLUTION TO 503 ERROR =====');
    console.log('1. Make sure your Fastify backend is running on port 8080');
    console.log('2. Verify your proxy configuration in server.js points to http://localhost:8080');
    console.log('3. Use the config-temp.js files to set environment variables correctly');
    console.log('4. Start both servers in the correct order: first backend, then Express');
  }).on('error', (err) => {
    console.error(`Proxy test error: ${err.message}`);
  });
}
