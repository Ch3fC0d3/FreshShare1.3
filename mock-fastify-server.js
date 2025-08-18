// Simple mock Fastify server to test connectivity
const http = require('http');
const PORT = 8080;

console.log(`Starting mock Fastify server on port ${PORT}...`);

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  
  // Simple routing
  if (req.url === '/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', message: 'Mock Fastify server is running' }));
  } 
  else if (req.url.startsWith('/api')) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', message: 'Mock API response', endpoint: req.url }));
  }
  else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'error', message: 'Not Found' }));
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Mock Fastify server running on http://localhost:${PORT}`);
  console.log('Routes available:');
  console.log('- GET /health - Health check endpoint');
  console.log('- GET /api/... - Mock API responses');
  console.log('\nPress Ctrl+C to stop the server');
});
