/**
 * PostgreSQL Connection Fix for FreshShare
 * 
 * This script attempts different PostgreSQL connection configurations
 * and identifies the working one for your cPanel environment.
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

// Get DATABASE_URL from .env or use fallback
const DATABASE_URL = process.env.DATABASE_URL || 
  'postgres://myfrovov_freshshare_user:BjgjX2Vev2vmLwh@localhost:5432/myfrovov_freshshare';

console.log('Testing database connection options...');
console.log('Using database URL (redacted):', DATABASE_URL.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'));

// Test connection configurations
async function testConnection(config, name) {
  try {
    console.log(`Testing ${name} configuration...`);
    const pool = new Pool(config);
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time');
    client.release();
    await pool.end();
    console.log(`✅ SUCCESS with ${name} configuration`);
    console.log(`Server time: ${result.rows[0].time}`);
    return true;
  } catch (error) {
    console.log(`❌ FAILED with ${name} configuration: ${error.message}`);
    return false;
  }
}

// Create configurations to test
const configs = [
  {
    name: 'Default configuration (no SSL)',
    config: {
      connectionString: DATABASE_URL,
      ssl: false
    }
  },
  {
    name: 'SSL with reject unauthorized disabled',
    config: {
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
  },
  {
    name: 'Full SSL configuration',
    config: {
      connectionString: DATABASE_URL,
      ssl: true
    }
  },
  {
    name: 'Connection parameters with no SSL',
    config: {
      host: 'localhost',
      port: 5432,
      database: 'myfrovov_freshshare',
      user: DATABASE_URL.split('@')[0].split('://')[1].split(':')[0],
      password: DATABASE_URL.split('@')[0].split(':')[2],
      ssl: false
    }
  },
  {
    name: 'Connection parameters with SSL disabled',
    config: {
      host: 'localhost',
      port: 5432,
      database: 'myfrovov_freshshare',
      user: DATABASE_URL.split('@')[0].split('://')[1].split(':')[0],
      password: DATABASE_URL.split('@')[0].split(':')[2],
      ssl: {
        rejectUnauthorized: false
      }
    }
  }
];

// Test all configurations
async function runTests() {
  console.log('=== PostgreSQL Connection Tests ===');
  
  const results = [];
  
  for (const { name, config } of configs) {
    const success = await testConnection(config, name);
    results.push({ name, success, config });
  }
  
  const successful = results.filter(r => r.success);
  
  if (successful.length === 0) {
    console.log('\n❌ All connection configurations failed');
    console.log('Please verify your database credentials and server configuration');
    return false;
  }
  
  console.log('\n✅ Working configurations found!');
  successful.forEach(({ name }) => {
    console.log(`- ${name}`);
  });
  
  // Create the fix file with working configuration
  const bestConfig = successful[0];
  console.log(`\nCreating fix with: ${bestConfig.name}`);
  
  // Create server.js fix
  const fixContent = `
// Updated by db-fix.js with working connection parameters
module.exports = {
  connectionConfig: ${JSON.stringify(bestConfig.config, null, 2)}
};
`;
  
  fs.writeFileSync('fastify-backend/db-config.js', fixContent);
  console.log('✅ Created fastify-backend/db-config.js with working configuration');
  
  // Create patch file for server.js
  const serverPatch = `
// Updated database connection code
const dbConfig = require('./db-config');
const pool = new Pool(dbConfig.connectionConfig);
`;
  
  fs.writeFileSync('fastify-backend/db-connection-patch.js', serverPatch);
  console.log('✅ Created fastify-backend/db-connection-patch.js with patch code');
  
  console.log('\nTo apply the fix:');
  console.log('1. Update server.js to use the new db-config.js module');
  console.log('2. Push changes to trigger redeployment');
  
  return true;
}

// Run the tests
runTests().catch(err => {
  console.error('Error running tests:', err);
  process.exit(1);
});
