const axios = require('axios');

// Test just the signup endpoint
async function testSignup() {
  console.log('\n==== SIGNUP ENDPOINT TEST ====');
  
  const payload = {
    username: 'testuser' + Math.floor(Math.random() * 10000),
    email: `test${Math.floor(Math.random() * 10000)}@example.com`,
    password: 'password123'
  };
  
  console.log('Testing POST http://localhost:3001/api/auth/signup');
  console.log('Payload:', payload);
  
  try {
    const response = await axios.post('http://localhost:3001/api/auth/signup', payload);
    console.log('\n✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('\n❌ ERROR!');
    console.log('Status:', error.response?.status || 'Unknown');
    
    if (error.response) {
      console.log('Headers:', error.response.headers);
      
      if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
        console.log('Received HTML response instead of JSON');
        console.log('HTML snippet:', error.response.data.substring(0, 200) + '...');
      } else {
        console.log('Response data:', error.response.data);
      }
    } else {
      console.log('Error:', error.message);
    }
  }
  
  console.log('\n==== TEST COMPLETE ====');
}

// Run the test
testSignup();
