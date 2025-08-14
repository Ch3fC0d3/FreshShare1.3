const axios = require('axios');

// Test all API endpoints
async function testEndpoints() {
  console.log('\n==== API ENDPOINT TEST ====');
  
  // Test endpoints
  const endpoints = [
    { method: 'GET', url: 'http://localhost:3001/' },
    { method: 'GET', url: 'http://localhost:3001/api' },
    { method: 'POST', url: 'http://localhost:3001/api/auth/signup' },
    { method: 'POST', url: 'http://localhost:3001/api/auth/login' },
    { method: 'POST', url: 'http://localhost:3001/signup' },
    { method: 'POST', url: 'http://localhost:3001/login' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n-----------------------------------------`);
      console.log(`Testing ${endpoint.method} ${endpoint.url}`);
      console.log(`-----------------------------------------`);
      
      let response;
      if (endpoint.method === 'GET') {
        response = await axios.get(endpoint.url);
      } else {
        // Send a minimal payload for POST requests
        const payload = {
          username: 'testuser' + Math.floor(Math.random() * 10000), // Add random number to avoid duplicate users
          email: `test${Math.floor(Math.random() * 10000)}@example.com`, // Add random number to avoid duplicate emails
          password: 'password123'
        };
        console.log(`Sending payload:`, payload);
        response = await axios.post(endpoint.url, payload);
      }
      
      console.log(`✅ SUCCESS: ${endpoint.method} ${endpoint.url}`);
      console.log(`Status: ${response.status}`);
      console.log(`Response type: ${typeof response.data}`);
      console.log(`Headers:`, response.headers);
      console.log(`Response data:`, JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log(`❌ ERROR: ${endpoint.method} ${endpoint.url}`);
      console.log(`Status: ${error.response?.status || 'Unknown'}`);
      
      if (error.response) {
        console.log(`Headers:`, error.response.headers);
        
        if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
          console.log('Received HTML response instead of JSON');
          console.log(`HTML snippet: ${error.response.data.substring(0, 200)}...`);
        } else {
          console.log(`Response data:`, error.response.data);
        }
      } else {
        console.log(`Error: ${error.message}`);
      }
    }
  }
  
  console.log('\n==== TEST COMPLETE ====');
}

// Run the tests
testEndpoints();
