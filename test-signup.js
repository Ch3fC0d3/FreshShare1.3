const axios = require('axios');

// Test user data with random values to avoid duplicates
const randomNum = Math.floor(Math.random() * 10000);
const testUser = {
  username: "testuser" + randomNum,
  email: `testuser${randomNum}@example.com`,
  password: "Password123!",
  roles: ["user"]
};

console.log('\n==== SIGNUP TEST ====');
console.log('Attempting to create test user:', {
  username: testUser.username,
  email: testUser.email
});

// Make the signup request
axios.post('http://localhost:3001/api/auth/signup', testUser)
  .then(response => {
    console.log('\n✅ SIGNUP SUCCESSFUL!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    console.log('\n==== LOGIN TEST ====');
    console.log('Attempting to login with:', {
      username: testUser.username
    });
    
    // Now try to login with the new user
    return axios.post('http://localhost:3001/api/auth/login', {
      username: testUser.username,
      password: testUser.password
    });
  })
  .then(response => {
    console.log('\n✅ LOGIN SUCCESSFUL!');
    console.log('Username:', response.data.username);
    console.log('Token received:', response.data.accessToken ? 'Yes (truncated for security)' : 'No');
    if (response.data.accessToken) {
      console.log('Token preview:', response.data.accessToken.substring(0, 20) + '...');
    }
    
    console.log('\n==== PROTECTED ROUTE TEST ====');
    console.log('Attempting to access protected route with token...');
    
    // Try to access a protected route
    return axios.get('http://localhost:3001/api/test/user', {
      headers: {
        'x-access-token': response.data.accessToken
      }
    });
  })
  .then(response => {
    console.log('\n✅ PROTECTED ROUTE ACCESS SUCCESSFUL!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n==== ALL TESTS PASSED ====');
  })
  .catch(error => {
    console.error('\n❌ ERROR OCCURRED:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      
      // If it's HTML, it might be a server error page
      if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
        console.error('Received HTML response instead of JSON. Server may have returned an error page.');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Server may be down or unreachable.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    console.error('\n==== TEST FAILED ====');
  });
