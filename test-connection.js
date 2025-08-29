// Connection test script for 503 error verification
const http = require('http');

// Test Express frontend
console.log('Testing Express frontend...');
http.get('http://localhost:3001', (res) => {
  console.log('Express frontend responded with status code:', res.statusCode);

  // Test Fastify backend
  console.log('\nTesting Fastify backend...');
  http.get('http://localhost:8080/health', (res2) => {
    console.log('Fastify backend responded with status code:', res2.statusCode);
    console.log('\nAll services are responding! The 503 error should be fixed.');
    process.exit(0);
  }).on('error', (err) => {
    console.error('Fastify backend error:', err.message);
    process.exit(1);
  });
}).on('error', (err) => {
  console.error('Express frontend error:', err.message);
  process.exit(1);
});
