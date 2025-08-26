// Simple diagnostic script
require('./config-temp.js');
console.log('===== FreshShare 503 Error Diagnosis =====');
console.log('Configuration:');
console.log('- MONGODB_HOST:', process.env.MONGODB_HOST);
console.log('- MONGODB_DB:', process.env.MONGODB_DB);
console.log('- PORT:', process.env.PORT);
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '[SET]' : '[NOT SET]');
console.log('- FASTIFY_BACKEND_URL:', process.env.FASTIFY_BACKEND_URL);

// Test Fastify connection
const http = require('http');
const fastifyUrl = new URL(process.env.FASTIFY_BACKEND_URL);
console.log(
  `\nTesting connection to ${fastifyUrl.hostname}:${fastifyUrl.port}...`
);

const req = http.request(
  {
    hostname: fastifyUrl.hostname,
    port: fastifyUrl.port,
    path: '/health',
    method: 'GET',
    timeout: 2000,
  },
  (res) => {
    console.log(`Status code: ${res.statusCode}`);
    res.on('data', () => {});
    res.on('end', () => {
      console.log('Connection successful!');
    });
  }
);

req.on('error', (e) => {
  console.error(`\nCONNECTION ERROR: ${e.message}`);
  console.log(
    '\nDIAGNOSIS: The 503 error is occurring because the Fastify backend is not running.'
  );
  console.log(
    'SOLUTION: Start the Fastify backend service with the following steps:'
  );
  console.log('1. Create fastify-backend/.env file with:');
  console.log('   PORT=8080');
  console.log('   DATABASE_URL=postgres://localhost:5432/freshshare');
  console.log(
    '2. Run: cd fastify-backend && npm install fastify@4 pg zod dotenv'
  );
  console.log('3. Run: npx ts-node server.ts');
});

req.on('timeout', () => {
  console.log('Connection timed out - Fastify backend is not responding');
  req.destroy();
});

req.end();
