// Comprehensive connection test for FreshShare in cPanel environment
const http = require('http');
const fs = require('fs');

// Configuration
const tests = [
  {
    name: 'Mock Fastify Server Health Check',
    url: 'http://localhost:8080/health',
    description: 'Tests if the mock Fastify server is running and responding'
  },
  {
    name: 'Proxy Server Connection Test',
    url: 'http://localhost:3001/api/health',
    description: 'Tests if the Express proxy server is running and can be accessed'
  },
  {
    name: 'Proxy to Fastify Connection Test',
    url: 'http://localhost:3001/api/pack/health',
    description: 'Tests if the Express proxy server can forward requests to the Fastify backend'
  }
];

// Results storage
const results = {
  success: [],
  failure: [],
  summary: {
    total: tests.length,
    passed: 0,
    failed: 0
  }
};

// Check if required files exist
console.log('=== File Existence Check ===');
const requiredFiles = [
  { path: './mock-fastify-server.js', description: 'Mock Fastify Server' },
  { path: './proxy-server.js', description: 'Express Proxy Server' },
  { path: './config-temp.js', description: 'Configuration File' }
];

requiredFiles.forEach(file => {
  try {
    if (fs.existsSync(file.path)) {
      console.log(`✅ ${file.description} (${file.path}) exists`);
    } else {
      console.log(`❌ ${file.description} (${file.path}) is missing`);
    }
  } catch (err) {
    console.error(`Error checking ${file.path}:`, err.message);
  }
});

console.log('\n=== Connection Tests ===');

// Run tests sequentially
function runTest(index) {
  if (index >= tests.length) {
    // All tests complete, show summary
    showResults();
    return;
  }

  const test = tests[index];
  console.log(`\nRunning Test: ${test.name}`);
  console.log(`Description: ${test.description}`);
  console.log(`URL: ${test.url}`);

  const req = http.get(test.url, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        console.log('✅ TEST PASSED');
        console.log('Response:', data);
        results.success.push({
          name: test.name,
          statusCode: res.statusCode,
          response: data
        });
        results.summary.passed++;
      } else {
        console.log('❌ TEST FAILED');
        console.log('Response:', data);
        results.failure.push({
          name: test.name,
          statusCode: res.statusCode,
          response: data,
          error: `HTTP Error: ${res.statusCode}`
        });
        results.summary.failed++;
      }
      
      // Run next test
      setTimeout(() => runTest(index + 1), 500);
    });
  });
  
  req.on('error', (err) => {
    console.log('❌ TEST FAILED');
    console.error('Error:', err.message);
    results.failure.push({
      name: test.name,
      error: err.message
    });
    results.summary.failed++;
    
    // Run next test
    setTimeout(() => runTest(index + 1), 500);
  });
  
  // Set timeout
  req.setTimeout(5000, () => {
    req.destroy();
    console.log('❌ TEST FAILED (Timeout)');
    results.failure.push({
      name: test.name,
      error: 'Request timed out after 5 seconds'
    });
    results.summary.failed++;
    
    // Run next test
    setTimeout(() => runTest(index + 1), 500);
  });
}

function showResults() {
  console.log('\n=== Test Results Summary ===');
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  
  if (results.failure.length > 0) {
    console.log('\n=== Failed Tests ===');
    results.failure.forEach((test, index) => {
      console.log(`${index + 1}. ${test.name}`);
      console.log(`   Error: ${test.error}`);
      if (test.statusCode) {
        console.log(`   Status Code: ${test.statusCode}`);
      }
      console.log('');
    });
    
    console.log('=== Troubleshooting Guide ===');
    
    // Check for common patterns and provide specific advice
    const errors = results.failure.map(f => f.error);
    
    if (errors.some(e => e.includes('ECONNREFUSED'))) {
      console.log('1. Connection Refused Issues:');
      console.log('   - Check if servers are running: ps aux | grep node');
      console.log('   - Start mock server: node mock-fastify-server.js');
      console.log('   - Start proxy server: node proxy-server.js');
      console.log('   - Verify ports 3001 and 8080 are not blocked by firewall');
    }
    
    if (errors.some(e => e.includes('EADDRINUSE'))) {
      console.log('2. Address In Use Issues:');
      console.log('   - Check for processes using ports: netstat -tulpn | grep -E "3001|8080"');
      console.log('   - Kill conflicting processes: kill -9 [PID]');
    }
    
    if (results.failure.some(f => f.name.includes('Proxy to Fastify'))) {
      console.log('3. Proxy Configuration Issues:');
      console.log('   - Check config-temp.js for correct FASTIFY_BACKEND_URL');
      console.log('   - Verify proxy-server.js is using the correct target URL');
      console.log('   - Check for JWT authentication issues in the proxy');
    }
    
    console.log('\n4. General Fixes:');
    console.log('   - Run the emergency fix scripts from EMERGENCY_FIX_GUIDE.md');
    console.log('   - Check logs: cat ~/public_html/mock.log and cat ~/public_html/proxy.log');
    console.log('   - Ensure Node.js path is set: export PATH=$HOME/nodevenv/freshshare1.3/14/bin:$PATH');
  } else if (results.success.length === results.summary.total) {
    console.log('\n✅ ALL TESTS PASSED!');
    console.log('Your FreshShare application appears to be working correctly.');
    console.log('If you are still experiencing 503 errors, check:');
    console.log('1. Apache/cPanel configuration');
    console.log('2. .htaccess file settings');
    console.log('3. Domain DNS configuration');
  }
  
  console.log('\nFor more information, refer to:');
  console.log('- EMERGENCY_FIX_GUIDE.md');
  console.log('- cPanel-NODE-SETUP.md');
  console.log('- 503-fix-steps.md');
}

// Start running tests
console.log('Starting connection tests...');
runTest(0);
