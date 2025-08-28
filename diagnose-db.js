require('dotenv').config();
const mongoose = require('mongoose');
const { Client } = require('pg');
const http = require('http');

async function checkMongoDB() {
  console.log('\n=== MongoDB Status ===');
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/freshshare_db';
  console.log('URI (redacted):', uri.replace(/:[^:@]+@/, ':***@'));

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      ssl: process.env.MONGODB_SSL === 'true',
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connection successful');
    
    const testDoc = await mongoose.connection.db
      .collection('connection_tests')
      .insertOne({ test: true, timestamp: new Date() });
    console.log('✅ MongoDB write test successful');

    await mongoose.connection.db
      .collection('connection_tests')
      .deleteOne({ _id: testDoc.insertedId });
    console.log('✅ MongoDB delete test successful');

    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.error('❌ MongoDB Error:', err.message);
    if (err.name === 'MongoServerSelectionError') {
      console.log('\nPossible causes:');
      console.log('1. Network connectivity issues');
      console.log('2. MongoDB Atlas IP whitelist restrictions');
      console.log('3. Invalid connection string');
      console.log('4. Database server is down');
    }
    return false;
  }
}

async function checkPostgres() {
  console.log('\n=== PostgreSQL Status ===');
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('❌ DATABASE_URL not set');
    return false;
  }
  console.log('URL (redacted):', url.replace(/:[^:@]+@/, ':***@'));

  const client = new Client({
    connectionString: url,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL connection successful');

    const result = await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL query test successful:', result.rows[0].now);

    await client.end();
    return true;
  } catch (err) {
    console.error('❌ PostgreSQL Error:', err.message);
    console.log('\nPossible causes:');
    console.log('1. Invalid connection string');
    console.log('2. Database not running');
    console.log('3. Network connectivity issues');
    console.log('4. Wrong credentials');
    return false;
  }
}

async function checkServices() {
  console.log('\n=== Service Status ===');
  
  // Check Express frontend
  try {
    await new Promise((resolve, reject) => {
      http.get('http://localhost:3001', res => {
        console.log('✅ Express frontend responding:', res.statusCode);
        resolve();
      }).on('error', reject);
    });
  } catch (err) {
    console.error('❌ Express frontend error:', err.message);
  }

  // Check Fastify backend
  try {
    await new Promise((resolve, reject) => {
      http.get('http://localhost:8080/health', res => {
        console.log('✅ Fastify backend responding:', res.statusCode);
        resolve();
      }).on('error', reject);
    });
  } catch (err) {
    console.error('❌ Fastify backend error:', err.message);
  }
}

async function runDiagnostics() {
  console.log('=== FreshShare Deployment Diagnostics ===');
  console.log('Running checks at:', new Date().toISOString());

  const mongoOk = await checkMongoDB();
  const pgOk = await checkPostgres();
  await checkServices();

  console.log('\n=== Summary ===');
  console.log('MongoDB:', mongoOk ? '✅ OK' : '❌ Failed');
  console.log('PostgreSQL:', pgOk ? '✅ OK' : '❌ Failed');

  if (!mongoOk || !pgOk) {
    console.log('\n⚠️ Action Required:');
    if (!mongoOk) console.log('- Verify MongoDB connection string and network access');
    if (!pgOk) console.log('- Verify PostgreSQL connection string and credentials');
  }
}

runDiagnostics().catch(console.error);
