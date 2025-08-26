const http = require('http');
const fs = require('fs');
const path = require('path');

// Files to check from both public and public_html directories
const filesToCheck = [
  '/css/reset-styles.css',
  '/css/main.css',
  '/css/color-system.css',
  '/css/design-system.css',
  '/css/groups-custom.css',
  '/js/css-fix.js',
  '/css-test-page.html',
];

// Test server connection
async function testServer() {
  console.log('🔍 Testing Express server static file serving...');
  console.log('🔄 Checking if server is running on port 3001...');
  
  try {
    // First check if server is running
    await checkServerConnection();
    
    // Now check each file
    console.log('\n📁 Testing static file access:');
    for (const file of filesToCheck) {
      await checkFile(file);
    }
    
    console.log('\n✅ All tests completed!');
    
    // Check local files to verify they exist
    console.log('\n📂 Verifying local files:');
    checkLocalFiles();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Check if server is responsive
function checkServerConnection() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3001', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Server is running!');
        resolve();
      } else {
        reject(new Error(`Server responded with status code ${res.statusCode}`));
      }
    });
    
    req.on('error', (error) => {
      reject(new Error(`Cannot connect to server: ${error.message}`));
    });
    
    // Set a timeout
    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error('Connection timeout - server might not be running'));
    });
  });
}

// Check if a specific file is accessible
function checkFile(filePath) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3001${filePath}`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${filePath}: ${res.statusCode} OK (${data.length} bytes)`);
          
          // For CSS files, check if they appear to be valid
          if (filePath.endsWith('.css') && data.includes('{')) {
            console.log(`   Valid CSS content detected`);
          }
        } else {
          console.log(`❌ ${filePath}: ${res.statusCode} Not Found`);
        }
        resolve();
      });
    });
    
    req.on('error', () => {
      console.log(`❌ ${filePath}: Connection Error`);
      resolve();
    });
  });
}

// Check if files exist locally in public and public_html
function checkLocalFiles() {
  const baseDirectories = [
    path.join(__dirname, 'public'),
    path.join(__dirname, 'public_html')
  ];
  
  baseDirectories.forEach(baseDir => {
    const dirName = path.basename(baseDir);
    console.log(`\nChecking ${dirName} directory:`);
    
    filesToCheck.forEach(file => {
      const localPath = path.join(baseDir, file.substring(1)); // Remove leading slash
      try {
        const stats = fs.statSync(localPath);
        console.log(`✅ ${file}: Found (${stats.size} bytes)`);
      } catch (err) {
        console.log(`❌ ${file}: Not found`);
      }
    });
  });
}

// Run the tests
testServer();
