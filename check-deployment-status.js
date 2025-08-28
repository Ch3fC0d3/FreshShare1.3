// Deployment Status Check Script for FreshShare
const fs = require('fs');
const path = require('path');
const http = require('http');

require('dotenv').config();
const mongoose = require('mongoose');

// Configuration
const EXPRESS_PORT = process.env.PORT || 3001;
const FASTIFY_PORT = process.env.FASTIFY_PORT || 8080;
const LOG_FILES = {
  express: path.join(
    process.env.HOME || '/home/myfrovov',
    'public_html/express.log'
  ),
  fastify: path.join(
    process.env.HOME || '/home/myfrovov',
    'public_html/fastify-backend/fastify.log'
  ),
  mongodb: path.join(
    process.env.HOME || '/home/myfrovov',
    'public_html/mongodb.log'
  )
};

console.log('=== FreshShare Deployment Status Check ===');
console.log('Running checks at:', new Date().toISOString());

// 1. Check if services are running
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

// 2. Check log files for errors
function checkLogs(name, logFile) {
  console.log(`\n[${name}] Checking log file: ${logFile}`);

  try {
    if (fs.existsSync(logFile)) {
      // Get last 20 lines of log
      const data = fs.readFileSync(logFile, 'utf8');
      const lines = data.split('\n').slice(-20);

      console.log(`[${name}] Last ${lines.length} log entries:`);
      lines.forEach((line) => {
        if (
          line.toLowerCase().includes('error') ||
          line.toLowerCase().includes('exception')
        ) {
          console.log(`[${name}] ERROR: ${line}`);
        } else if (line.trim()) {
          console.log(`[${name}] ${line}`);
        }
      });
    } else {
      console.error(`[${name}] Log file not found`);
    }
  } catch (err) {
    console.error(`[${name}] Error reading log: ${err.message}`);
  }
}

// 3. Check environment files
function checkEnvFiles() {
  console.log('\n[Config] Checking environment files');

  const envFiles = [
    path.join(process.env.HOME || '/home/myfrovov', 'public_html/.env'),
    path.join(
      process.env.HOME || '/home/myfrovov',
      'public_html/fastify-backend/.env'
    ),
  ];

  envFiles.forEach((file) => {
    try {
      if (fs.existsSync(file)) {
        console.log(`[Config] ${file} exists`);

        // Check for critical variables without showing values
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');

        console.log(`[Config] ${file} contains:`);
        lines.forEach((line) => {
          if (line.trim() && !line.startsWith('#')) {
            const parts = line.split('=');
            if (parts.length >= 2) {
              console.log(`[Config] - ${parts[0]} is set`);
            }
          }
        });
      } else {
        console.error(`[Config] ${file} not found`);
      }
    } catch (err) {
      console.error(`[Config] Error checking ${file}: ${err.message}`);
    }
  });
}

// 4. Check database initialization marker
function checkDbInitialization() {
  console.log('\n[Database] Checking initialization status');

  const dbMarkerFile = path.join(
    process.env.HOME || '/home/myfrovov',
    'public_html/fastify-backend/.db_initialized'
  );

  try {
    if (fs.existsSync(dbMarkerFile)) {
      console.log('[Database] Database has been initialized');
    } else {
      console.error('[Database] Database initialization marker not found');
      console.log(
        '[Database] This may indicate the database was never initialized'
      );
    }
  } catch (err) {
    console.error(`[Database] Error checking initialization: ${err.message}`);
  }
}

// Test MongoDB connection
async function checkMongoDB() {
  console.log('\n[MongoDB] Testing connection...');
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[MongoDB] Error: MONGODB_URI not set in environment');
    return false;
  }

  console.log('[MongoDB] Connection URI:', uri.replace(/:[^:@]+@/, ':***@'));
  
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      ssl: process.env.MONGODB_SSL === 'true',
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('[MongoDB] Connection successful');
    
    // Test write operation
    const testDoc = await mongoose.connection.db
      .collection('connection_tests')
      .insertOne({ test: true, timestamp: new Date() });
    console.log('[MongoDB] Write test successful');

    // Clean up test document
    await mongoose.connection.db
      .collection('connection_tests')
      .deleteOne({ _id: testDoc.insertedId });
    console.log('[MongoDB] Delete test successful');

    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message);
    if (err.name === 'MongoServerSelectionError') {
      console.log('\n[MongoDB] Possible causes:');
      console.log('1. Network connectivity issues');
      console.log('2. MongoDB Atlas IP whitelist restrictions');
      console.log('3. Invalid connection string');
      console.log('4. Database server is down');
    }
    return false;
  }
}

// Run all checks
async function runChecks() {
  console.log('=== FreshShare Deployment Status Check ===');
  console.log('Running checks at:', new Date().toISOString());

  // Check MongoDB first
  const mongodbOk = await checkMongoDB();

  // Check services
  const expressOk = await checkService('Express', 'localhost', EXPRESS_PORT);
  const fastifyOk = await checkService('Fastify', 'localhost', FASTIFY_PORT);

  // Check logs
  Object.entries(LOG_FILES).forEach(([name, file]) => {
    checkLogs(name.charAt(0).toUpperCase() + name.slice(1), file);
  });

  // Check environment files
  checkEnvFiles();

  // Check database initialization
  checkDbInitialization();

  console.log('\n=== Check Complete ===');
  console.log('Status Summary:');
  console.log('- MongoDB Connection:', mongodbOk ? '✅ OK' : '❌ Failed');
  console.log('- Express Server:', expressOk ? '✅ OK' : '❌ Failed');
  console.log('- Fastify Backend:', fastifyOk ? '✅ OK' : '❌ Failed');

  if (!mongodbOk || !expressOk || !fastifyOk) {
    console.log('\n⚠️ Action Required:');
    if (!mongodbOk) console.log('- Check MongoDB connection string and network access');
    if (!expressOk) console.log('- Verify Express server is running and check express.log');
    if (!fastifyOk) console.log('- Verify Fastify backend is running and check fastify.log');
  }
}

runChecks();
