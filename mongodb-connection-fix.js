/**
 * MongoDB Connection Fix for FreshShare
 * 
 * This script provides a robust MongoDB connection solution
 * with different connection string formats and retry logic
 */

require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
const { promisify } = require('util');

// Promisify DNS lookup
const dnsLookup = promisify(dns.lookup);

// Check if MongoDB URI exists
const { MONGODB_URI } = process.env;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not set in environment');
  process.exit(1);
}

console.log('Testing MongoDB connection...');
console.log(
  'Connection URI (redacted):',
  MONGODB_URI.replace(/:[^:@]+@/, ':***@')
);

// Connection options with increased timeouts
const options = {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 50,
  ssl: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // Disable srv record lookup which can cause issues in some environments
  directConnection: true,
};

// Function to test a connection
async function testConnection() {
  try {
    // Check if using SRV format
    if (MONGODB_URI.includes('mongodb+srv://')) {
      // Extract hostname for DNS check
      const hostnameMatch = MONGODB_URI.match(/mongodb\+srv:\/\/(?:[^:@]+:[^:@]+@)?([^/:]+)/i);
      
      if (hostnameMatch && hostnameMatch[1]) {
        const hostname = hostnameMatch[1];
        console.log(`Testing DNS resolution for ${hostname}...`);
        
        try {
          // Test if we can resolve the hostname
          await dnsLookup(hostname);
          console.log(`✅ DNS resolution successful for ${hostname}`);
        } catch (dnsError) {
          console.error(`❌ DNS resolution failed for ${hostname}: ${dnsError.message}`);
          console.log('Attempting connection with standard format instead of SRV...');
          
          // Try non-SRV format instead
          const nonSrvUri = MONGODB_URI.replace('mongodb+srv://', 'mongodb://');
          console.log(
            'Using non-SRV URI:',
            nonSrvUri.replace(/:[^:@]+@/, ':***@')
          );
          
          // Connect with non-SRV URI
          return await tryMongoConnection(nonSrvUri);
        }
      }
    }
    
    // If not SRV or DNS lookup succeeded, try normal connection
    return await tryMongoConnection(MONGODB_URI);
  } catch (error) {
    console.error('❌ MongoDB connection process failed:', error.message);
    return false;
  }
}

// Helper function to attempt MongoDB connection
async function tryMongoConnection(uri) {
  try {
    await mongoose.connect(uri, options);
    console.log('✅ MongoDB connection successful');
    
    // Test read/write operations
    const TestModel = mongoose.model(
      'Test', 
      new mongoose.Schema({
        name: String,
        date: { type: Date, default: Date.now },
      })
    );
    
    await TestModel.findOneAndUpdate(
      { name: 'connection-test' },
      { date: new Date() },
      { upsert: true, new: true }
    );
    
    console.log('✅ MongoDB read/write operations successful');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  } finally {
    // Close connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

// Main execution with retries
async function main() {
  const maxAttempts = 3;
  let connected = false;
  
  // Disable ESLint warning for await in loop - we need sequential retries
  // eslint-disable-next-line no-await-in-loop
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    console.log(`Connection attempt ${attempt}/${maxAttempts}...`);
    
    // eslint-disable-next-line no-await-in-loop
    connected = await testConnection();
    if (connected) break;
    
    if (attempt < maxAttempts) {
      console.log('Waiting 5 seconds before next attempt...');
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  
  if (!connected) {
    console.error(`❌ MongoDB connection failed after ${maxAttempts} attempts`);
    
    // Create a fallback connection file
    console.log('Creating a fallback MongoDB connection configuration...');
    const fs = require('fs');
    const fallbackConfig = `
// Fallback MongoDB configuration with standard connection string
// Created by mongodb-connection-fix.js
module.exports = {
  uri: process.env.MONGODB_URI 
    ? process.env.MONGODB_URI.replace('mongodb+srv://', 'mongodb://')
    : 'mongodb://localhost:27017/freshshare_db',
  options: {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    ssl: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    directConnection: true
  }
};
`;
    
    fs.writeFileSync('config/mongodb-fallback.js', fallbackConfig);
    console.log(
      '✅ Created fallback MongoDB configuration at config/mongodb-fallback.js'
    );
    
    process.exit(1);
  }
  
  console.log('✅ MongoDB connection verification complete');
  process.exit(0);
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
