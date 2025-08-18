// Wrapper to start the Fastify TypeScript backend
require('./config-temp.js');
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Fastify backend with configuration:');
console.log('- PORT:', process.env.PORT);
console.log('- DATABASE_URL:', process.env.DATABASE_URL);

// Try to use locally installed ts-node first
try {
  // Method 1: Use ts-node from node_modules
  console.log('Attempting to start with local ts-node...');
  require('ts-node/register');
  require('./server.ts');
} catch (e) {
  console.log('Failed to start with local ts-node:', e.message);
  
  try {
    // Method 2: Use child process to run npx ts-node
    console.log('Trying with npx ts-node...');
    const child = spawn('npx', ['ts-node', 'server.ts'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env }
    });

    child.on('error', (err) => {
      console.error('Failed to start backend:', err);
      console.log('\nFIX: Install TypeScript dependencies with:');
      console.log('npm install -D ts-node typescript @types/node');
    });
  } catch (spawnError) {
    console.error('Failed to spawn ts-node process:', spawnError);
    
    console.log('\nALTERNATIVE SOLUTION:');
    console.log('1. Run the server using ts-node manually:');
    console.log('   cd fastify-backend');
    console.log('   npm install -D ts-node typescript @types/node');
    console.log('   npx ts-node -r ./config-temp.js server.ts');
  }
}
