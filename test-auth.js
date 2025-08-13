const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// JWT Secret - using the same one we standardized on
const JWT_SECRET = process.env.JWT_SECRET || 'freshShare-auth-secret';

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    await mongoose.connect('mongodb://127.0.0.1:27017/freshshare_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connection successful');
    
    // Test JWT signing and verification
    console.log('\nTesting JWT functionality...');
    const testPayload = { id: 'test-user-id' };
    
    const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: 86400 });
    console.log('✅ JWT token created successfully');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ JWT token verified successfully');
    console.log('Decoded payload:', decoded);
    
    // Close connection
    await mongoose.connection.close();
    console.log('\nTest completed successfully');
  } catch (err) {
    console.error('❌ Error during test:', err);
  }
}

testConnection();
