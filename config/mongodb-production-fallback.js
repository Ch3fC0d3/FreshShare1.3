/**
 * MongoDB Production Fallback Configuration
 * 
 * This module handles MongoDB Atlas connections in production environments
 * where IP whitelist restrictions may prevent direct connections.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB connection details from environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/freshshare_db';
const MONGODB_SSL = process.env.MONGODB_SSL === 'true';

// Connection options
const defaultOptions = {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 50,
  ssl: MONGODB_SSL,
  useNewUrlParser: true,
  useUnifiedTopology: true
};

// Try to load fallback configuration if it exists
let fallbackConfig = null;
try {
  const fallbackPath = path.join(__dirname, 'mongodb-fallback.js');
  if (fs.existsSync(fallbackPath)) {
    fallbackConfig = require('./mongodb-fallback.js');
    console.log('Loaded MongoDB fallback configuration');
  }
} catch (err) {
  console.log('No fallback configuration found, using standard connection');
}

/**
 * Connect to MongoDB with multiple fallback strategies
 */
async function connectToMongoDB() {
  try {
    // First try standard connection
    console.log('Attempting MongoDB Atlas connection...');
    await mongoose.connect(MONGODB_URI, defaultOptions);
    console.log('✅ Connected to MongoDB Atlas successfully');
    return mongoose.connection;
  } catch (err) {
    console.log('⚠️ MongoDB Atlas connection failed:', err.message);
    
    // If fallback config exists, try that
    if (fallbackConfig) {
      try {
        console.log('Attempting fallback connection...');
        await mongoose.connect(fallbackConfig.uri, fallbackConfig.options);
        console.log('✅ Connected using fallback configuration');
        return mongoose.connection;
      } catch (fallbackErr) {
        console.error('❌ Fallback connection also failed:', fallbackErr.message);
      }
    }
    
    // Try a direct connection format as last resort
    try {
      const nonSrvUri = MONGODB_URI.replace('mongodb+srv://', 'mongodb://');
      const directOptions = { ...defaultOptions, directConnection: true };
      console.log('Trying direct connection format...');
      await mongoose.connect(nonSrvUri, directOptions);
      console.log('✅ Connected using direct connection format');
      return mongoose.connection;
    } catch (finalErr) {
      console.error('❌ All MongoDB connection attempts failed');
      
      // Create a fallback config file if needed
      createFallbackConfig();
      
      throw finalErr;
    }
  }
}

/**
 * Creates a fallback configuration file for MongoDB
 */
function createFallbackConfig() {
  try {
    const configPath = path.join(__dirname, 'mongodb-fallback.js');
    
    // Only create if it doesn't exist
    if (!fs.existsSync(configPath)) {
      const fallbackConfig = `// MongoDB Fallback Configuration
// Generated automatically to handle IP whitelist issues
module.exports = {
  uri: process.env.MONGODB_URI 
    ? process.env.MONGODB_URI.replace('mongodb+srv://', 'mongodb://') 
    : 'mongodb://localhost:27017/freshshare_db',
  options: {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    ssl: ${MONGODB_SSL},
    useNewUrlParser: true,
    useUnifiedTopology: true,
    directConnection: true
  }
};
`;
      
      fs.writeFileSync(configPath, fallbackConfig);
      console.log(`✅ Created fallback configuration at ${configPath}`);
    }
  } catch (err) {
    console.error(`Failed to create fallback config: ${err.message}`);
  }
}

// Create fallback config if it doesn't exist
if (!fallbackConfig) {
  createFallbackConfig();
}

module.exports = {
  connect: connectToMongoDB,
  connection: mongoose.connection,
  mongoose
};
