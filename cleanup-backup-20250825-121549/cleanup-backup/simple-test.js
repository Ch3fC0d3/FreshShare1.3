// Simple HTTP test for backend connectivity
const http = require('http');
const url = 'http://localhost:8080/health';

console.log(`Testing connection to: ${url}`);

http.get(url, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  res.setEncoding('utf8');
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`BODY: ${data}`);
    console.log('Connection successful! Fastify backend is running.');
  });
}).on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
  console.log('Fastify backend is not running or accessible at port 8080.');
  console.log('This is the cause of the 503 error in the Express proxy.');
  console.log('\nTo fix this issue:');
  console.log('1. Navigate to fastify-backend directory');
  console.log('2. Make sure config-temp.js is correctly set up with PORT=8080');
  console.log('3. Install required dependencies: npm install fastify@4 pg zod');
  console.log('4. Run the server with: npx ts-node -r ./config-temp.js server.ts');
});
