require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

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
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  ssl,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Test connection
log('\nTesting connection...');
mongoose.connect(uri, options)
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
    }
    process.exit(1);
  });
