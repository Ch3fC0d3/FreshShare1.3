require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
const { promisify } = require('util');

// Promisify DNS lookup
const dnsLookup = promisify(dns.lookup);

// Log file setup
const logFile = path.join(__dirname, 'mongodb-diagnostic.log');
const log = (msg) => {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${msg}\n`;
  console.log(entry.trim());
  fs.appendFileSync(logFile, entry);
};

// Get connection details
const uri = process.env.MONGODB_URI;
const ssl = process.env.MONGODB_SSL === 'true';
const db = process.env.MONGODB_DB || 'FreshShareDB';

if (!uri) {
  log('❌ ERROR: MONGODB_URI not set');
  process.exit(1);
}

log('MongoDB Diagnostic Tool');
log('--------------------');
log(`Environment: ${process.env.NODE_ENV}`);
log(`Database: ${db}`);
log(`SSL Enabled: ${ssl}`);
log(`Connection URI: ${uri.replace(/:[^:@]+@/, ':***@')}`);

// Connection options
const options = {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  ssl,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  directConnection: false, // Will be set to true for non-SRV connections
};

// DNS resolution test for SRV records
async function testDnsResolution() {
  // Check if using SRV format
  if (uri.includes('mongodb+srv://')) {
    const hostnameMatch = uri.match(/mongodb\+srv:\/\/(?:[^:@]+:[^:@]+@)?([^/:]+)/);
    
    if (hostnameMatch && hostnameMatch[1]) {
      const hostname = hostnameMatch[1];
      log(`Testing DNS resolution for ${hostname}...`);
      
      try {
        await dnsLookup(hostname);
        log(`✅ DNS resolution successful for ${hostname}`);
        
        // Try to resolve SRV record
        const srvHost = `_mongodb._tcp.${hostname}`;
        log(`Testing SRV record resolution for ${srvHost}...`);
        
        try {
          const resolveSrv = promisify(dns.resolveSrv);
          const records = await resolveSrv(srvHost);
          log(`✅ SRV records found: ${records.length} entries`);
          return { success: true, useSrv: true };
        } catch (srvErr) {
          log(`❌ SRV record lookup failed: ${srvErr.message}`);
          log('Will attempt standard connection format instead');
          return { success: false, useSrv: false };
        }
      } catch (err) {
        log(`❌ DNS resolution failed: ${err.message}`);
        log('Will attempt standard connection format instead');
        return { success: false, useSrv: false };
      }
    }
  }
  
  return { success: true, useSrv: !uri.includes('mongodb+srv://') };
}

// Main connection test function
async function testMongoConnection() {
  // First check DNS resolution
  const dnsResult = await testDnsResolution();
  
  // Adjust URI and options based on DNS test
  let connectionUri = uri;
  if (!dnsResult.useSrv) {
    connectionUri = uri.replace('mongodb+srv://', 'mongodb://');
    options.directConnection = true;
    log(`Using standard URI format: ${connectionUri.replace(/:[^:@]+@/, ':***@')}`);
  }
  
  // Test connection
  log('\nTesting MongoDB connection...');
  return mongoose.connect(connectionUri, options);
}

// Run the tests
testMongoConnection()
  .then(async () => {
    log('✅ MongoDB connection successful');
    
    // Test basic operations
    try {
      const testDoc = await mongoose.connection.db
        .collection('connection_tests')
        .insertOne({ test: true, timestamp: new Date() });
      log('✅ Write test successful');
      
      await mongoose.connection.db
        .collection('connection_tests')
        .deleteOne({ _id: testDoc.insertedId });
      log('✅ Delete test successful');
      
      // Get server status
      const status = await mongoose.connection.db.admin().serverStatus();
      log('\nServer Status:');
      log(`Version: ${status.version}`);
      log(`Uptime: ${Math.round(status.uptime / 3600)} hours`);
      log(`Active Connections: ${status.connections.current}`);
      log(`Available Connections: ${status.connections.available}`);
    } catch (err) {
      log(`❌ Operation test failed: ${err.message}`);
    }
    
    await mongoose.disconnect();
    log('\n✅ All tests completed');
    process.exit(0);
  })
  .catch(err => {
    log(`❌ Connection failed: ${err.message}`);
    if (err.name === 'MongoServerSelectionError') {
      log('\nPossible causes:');
      log('1. Network connectivity issues');
      log('2. MongoDB Atlas IP whitelist restrictions');
      log('3. Invalid connection string');
      log('4. Database server is down');
      
      // Try alternate connection string if using SRV format
      if (uri.includes('mongodb+srv://')) {
        log('\nTrying alternative connection format...');
        const nonSrvUri = uri.replace('mongodb+srv://', 'mongodb://');
        log(`Alternative URI: ${nonSrvUri.replace(/:[^:@]+@/, ':***@')}`);
        
        // Create a fallback config file
        try {
          const configPath = path.join(__dirname, 'config', 'mongodb-fallback.js');
          const fallbackConfig = `// Fallback MongoDB configuration
// Generated by diagnose-mongodb.js on ${new Date().toISOString()}
module.exports = {
  uri: process.env.MONGODB_URI 
    ? process.env.MONGODB_URI.replace('mongodb+srv://', 'mongodb://')
    : 'mongodb://localhost:27017/freshshare_db',
  options: {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    ssl: ${ssl},
    useNewUrlParser: true,
    useUnifiedTopology: true,
    directConnection: true
  }
};
`;
          
          fs.mkdirSync(path.dirname(configPath), { recursive: true });
          fs.writeFileSync(configPath, fallbackConfig);
          log(`✅ Created fallback config at ${configPath}`);
          
          // Try connection with fallback options
          log('\nTrying fallback connection...');
          const fallbackOptions = { ...options, directConnection: true };
          mongoose.connect(nonSrvUri, fallbackOptions)
            .then(() => {
              log('✅ Fallback connection successful!');
              mongoose.disconnect();
              log('You should update the MongoDB connection string in production');
              process.exit(0);
            })
            .catch(fallbackErr => {
              log(`❌ Fallback connection also failed: ${fallbackErr.message}`);
              process.exit(1);
            });
          return; // Don't exit yet
        } catch (configErr) {
          log(`❌ Error creating fallback config: ${configErr.message}`);
        }
      }
    }
    process.exit(1);
  });
