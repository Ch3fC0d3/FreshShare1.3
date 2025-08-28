/**
 * MongoDB Atlas IP Whitelisting Bypass Configuration
 *
 * This module provides a robust connection handling solution for MongoDB Atlas
 * when IP whitelisting restrictions prevent direct connections. It:
 *
 * 1. Attempts connection with standard MongoDB Atlas SRV format
 * 2. Falls back to direct connection format with directConnection flag
 * 3. Uses retry logic to improve connection reliability
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
const { promisify } = require('util');

// Promisify DNS lookup
const dnsLookup = promisify(dns.lookup);

// Get MongoDB connection details from environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/freshshare_db';
const MONGODB_SSL = process.env.MONGODB_SSL === 'true';

// Connection options with optimized settings
const defaultOptions = {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 50,
  ssl: MONGODB_SSL,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

/**
 * Tests if DNS resolution works for a MongoDB Atlas SRV URI
 * @param {string} uri - MongoDB connection URI
 * @returns {Promise<boolean>} - True if DNS resolution succeeds
 */
async function testDnsResolution(uri) {
  if (!uri.includes('mongodb+srv://')) {
    return { success: true, useSrv: false };
  }

  // Extract hostname from SRV format URI
  const hostnameMatch = uri.match(
    /mongodb\+srv:\/\/(?:[^:@]+:[^:@]+@)?([^/?]+)/i
  );
  if (!hostnameMatch || !hostnameMatch[1]) {
    return { success: false, useSrv: false };
  }

  try {
    const hostname = hostnameMatch[1];
    console.log(`Testing DNS resolution for ${hostname}...`);
    await dnsLookup(hostname);
    return { success: true, useSrv: true };
  } catch (err) {
    console.log(`❌ DNS resolution failed: ${err.message}`);
    return { success: false, useSrv: false };
  }
}

/**
 * Connect to MongoDB with retry logic and fallback options
 * @returns {Promise<mongoose.Connection>} - Mongoose connection object
 */
/**
 * Connect to MongoDB with retry logic and fallback options
 * @returns {Promise<mongoose.Connection>} - Mongoose connection object
 */
async function connect() {
  const maxRetries = 3;
  let lastError = null;

  // Create fallback config function declaration (moved up to avoid hoisting issues)
  const createFallbackConfig = () => {
    try {
      const configPath = path.join(__dirname, 'mongodb-fallback.js');
      
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
    } catch (err) {
      console.error(`Failed to create fallback config: ${err.message}`);
    }
  };

  // Try connection with retries
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}: Connecting to MongoDB...`);
      
      // Check DNS resolution first
      const dnsCheck = await testDnsResolution(MONGODB_URI);
      
      if (dnsCheck.success && dnsCheck.useSrv) {
        // If DNS works and it's SRV format, use standard connection
        console.log('Using standard MongoDB Atlas SRV connection format');
        await mongoose.connect(MONGODB_URI, defaultOptions);
      } else {
        // If DNS fails or it's not SRV format, use direct connection
        console.log('Using direct connection format with SRV bypass');
        const directUri = MONGODB_URI.replace('mongodb+srv://', 'mongodb://');
        await mongoose.connect(directUri, { 
          ...defaultOptions,
          directConnection: true 
        });
      }
      
      console.log('✅ MongoDB connection successful');
      return mongoose.connection;
    } catch (err) {
      console.log(`❌ Connection attempt ${attempt} failed: ${err.message}`);
      lastError = err;
      
      if (attempt < maxRetries) {
        // Wait before next retry with exponential backoff
        const delay = attempt * 2000;
        console.log(`Waiting ${delay}ms before next attempt...`);
        await new Promise((resolve) => {
          setTimeout(resolve, delay);
        });
      }
    }
  }
  
  // Create fallback config file if all attempts fail
  console.log(
    'All connection attempts failed, creating fallback configuration'
  );
  createFallbackConfig();
  
  throw (
    lastError || 
    new Error('Failed to connect to MongoDB after multiple attempts')
  );
}

/**
 * Creates a fallback configuration file for MongoDB
 */
// Function moved inside connect() to avoid hoisting issues

// Export functions and mongoose instance
module.exports = {
  connect,
  mongoose,
  connection: mongoose.connection,
  testDnsResolution,
};
