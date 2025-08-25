// Simple test client to check if the mock Fastify server is running
const http = require('http');

console.log('Testing connection to mock Fastify server...');
console.log('Target: http://localhost:8080/health');

http.get('http://localhost:8080/health', (res) => {
  console.log('CONNECTION SUCCESSFUL!');
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    console.log('\nTest Result: The mock Fastify server is running correctly.');
    console.log('This means the 503 error is NOT caused by server availability.');
    console.log('Check the proxy configuration in server.js and proxy-server.js');
  });
}).on('error', (err) => {
  console.error('CONNECTION ERROR:', err.message);
  console.log('\nTest Result: The mock Fastify server is NOT running or accessible.');
  console.log('This is likely causing the 503 Service Unavailable error.');
  console.log('\nSOLUTION:');
  console.log('1. Start the mock server: node mock-fastify-server.js');
  console.log('2. Verify no other process is using port 8080');
  console.log('3. Check Windows Defender Firewall settings for port 8080');
});
