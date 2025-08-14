const axios = require('axios');

// Test just the login endpoint
async function testLogin() {
  console.log('\n==== LOGIN ENDPOINT TEST ====');
  
  // First create a test user
  const username = 'testuser' + Math.floor(Math.random() * 10000);
  const email = `test${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'password123';
  
  const signupPayload = {
    username,
    email,
    password
  };
  
  console.log('Step 1: Creating test user');
  console.log('Signup Payload:', signupPayload);
  
  try {
    // First create the user
    const signupResponse = await axios.post('http://localhost:3001/api/auth/signup', signupPayload);
    console.log('\n✅ User created successfully!');
    console.log('Status:', signupResponse.status);
    console.log('Response:', JSON.stringify(signupResponse.data, null, 2));
    
    // Now try to login
    console.log('\nStep 2: Testing login with created user');
    const loginPayload = {
      username,
      password
    };
    console.log('Login Payload:', loginPayload);
    
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', loginPayload);
    console.log('\n✅ Login successful!');
    console.log('Status:', loginResponse.status);
    console.log('Headers:', loginResponse.headers);
    console.log('Response data:', JSON.stringify(loginResponse.data, null, 2));
    
    // If we got a token, test accessing a protected endpoint
    if (loginResponse.data.token) {
      console.log('\nStep 3: Testing protected endpoint with token');
      const token = loginResponse.data.token;
      
      const profileResponse = await axios.get('http://localhost:3001/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('\n✅ Protected endpoint access successful!');
      console.log('Status:', profileResponse.status);
      console.log('Response data:', JSON.stringify(profileResponse.data, null, 2));
    }
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
testLogin();
