/**
 * MongoDB Connection Fix for FreshShare
 * 
 * This script provides a robust MongoDB connection solution
 * with different connection string formats and retry logic
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Check if MongoDB URI exists
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not set in environment');
  process.exit(1);
}

console.log('Testing MongoDB connection...');
console.log('Connection URI (redacted):', MONGODB_URI.replace(/:[^:@]+@/, ':***@'));

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
  directConnection: true
};

// Function to test a connection
async function testConnection() {
  try {
    await mongoose.connect(MONGODB_URI, options);
    console.log('✅ MongoDB connection successful');
    
    // Optional: Test read/write operations
    const TestModel = mongoose.model('Test', new mongoose.Schema({
      name: String,
      date: { type: Date, default: Date.now }
    }));
    
    await TestModel.findOneAndUpdate(
      { name: 'connection-test' },
      { date: new Date() },
      { upsert: true, new: true }
    );
    
    console.log('✅ MongoDB read/write operations successful');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // Provide helpful troubleshooting based on error
    if (error.message.includes('ENOTFOUND')) {
      console.log('DNS resolution error: Unable to resolve the MongoDB host.');
      console.log('Try using a standard connection string without SRV format.');
      
      // Attempt to convert from SRV format if needed
      if (MONGODB_URI.includes('mongodb+srv://')) {
        const nonSrvUri = MONGODB_URI.replace('mongodb+srv://', 'mongodb://');
        console.log('Suggested non-SRV URI:', nonSrvUri.replace(/:[^:@]+@/, ':***@'));
      }
    }
    
    return false;
  } finally {
    // Close connection in either case
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

// Main execution with retries
async function main() {
  const maxAttempts = 3;
  let connected = false;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Connection attempt ${attempt}/${maxAttempts}...`);
    
    connected = await testConnection();
    if (connected) break;
    
    if (attempt < maxAttempts) {
      console.log(`Waiting 5 seconds before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  if (!connected) {
    console.error(`❌ MongoDB connection failed after ${maxAttempts} attempts`);
    
    // Create a fallback connection file
    console.log('Creating a fallback MongoDB connection configuration...');
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
    
    require('fs').writeFileSync('config/mongodb-fallback.js', fallbackConfig);
    console.log('✅ Created fallback MongoDB configuration at config/mongodb-fallback.js');
    
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
