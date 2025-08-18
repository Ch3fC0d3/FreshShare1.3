// Test script to verify proxy connection to backend
const http = require('http');

// Test direct connection to mock Fastify server
console.log('Testing direct connection to mock Fastify server...');
http.get('http://localhost:8080/health', (res) => {
  console.log(`Direct connection: Status ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Response: ${data}\n`);
    
    // Now test the connection through the proxy
    console.log('Testing connection through Express proxy...');
    http.get('http://localhost:3001/api/pack/test', (proxyRes) => {
      console.log(`Proxy connection: Status ${proxyRes.statusCode}`);
      let proxyData = '';
      proxyRes.on('data', (chunk) => { proxyData += chunk; });
      proxyRes.on('end', () => {
        console.log(`Response: ${proxyData}`);
        console.log('\nDIAGNOSIS: If both tests returned 200 status codes, the 503 error is fixed!');
      });
    }).on('error', (err) => {
      console.error(`Proxy connection error: ${err.message}`);
      console.log('\nDIAGNOSIS: Express proxy is not running properly. Start it with:');
      console.log('node -r ./config-temp.js proxy-server.js');
    });
  });
}).on('error', (err) => {
  console.error(`Direct connection error: ${err.message}`);
  console.log('\nDIAGNOSIS: Mock Fastify server is not running. Start it with:');
  console.log('node mock-fastify-server.js');
});
