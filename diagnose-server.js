const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Log all environment variables (redacted)
console.log('Environment variables:');
Object.keys(process.env).forEach(key => {
  if (key.includes('MONGODB') || key.includes('DATABASE')) {
    console.log(`${key}=${process.env[key].replace(/:[^:@]+@/, ':***@')}`);
  } else if (!key.includes('SECRET')) {
    console.log(`${key}=${process.env[key]}`);
  }
});

// Database configuration
console.log('\nAttempting MongoDB connection...');
const connectionURL = process.env.MONGODB_URI || 
                     (process.env.MONGODB_HOST ? 
                      `${process.env.MONGODB_HOST}${process.env.MONGODB_DB || 'freshshare_db'}` : 
                      'mongodb://127.0.0.1:27017/freshshare_db');

console.log(`Connection URL (redacted): ${connectionURL.replace(/:[^:@]+@/, ':***@')}`);

mongoose.connect(connectionURL, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
})
.then(() => {
  console.log('Successfully connected to MongoDB.');
  
  // Start server only after DB connection
  app.listen(PORT, () => {
    console.log(`Diagnostic server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
