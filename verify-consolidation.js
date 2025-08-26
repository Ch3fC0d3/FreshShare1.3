const fs = require('fs');
const path = require('path');

// Files to check from both public and public_html directories
const filesToCheck = [
  '/css/reset-styles.css',
  '/css/main.css',
  '/css/color-system.css',
  '/css/design-system.css',
  '/css/groups-custom.css',
  '/css/dashboard-enhancements.css',
  '/js/css-fix.js',
  '/js/auth.js',
  '/js/header.js',
  '/css-test-page.html',
  '/.htaccess'
];

console.log('\n🔍 Verifying Directory Consolidation');
console.log('====================================');

// Check if files exist locally in public and public_html
function checkLocalFiles() {
  const baseDirectories = [
    path.join(__dirname, 'public'),
    path.join(__dirname, 'public_html')
  ];
  
  let publicFilesFound = 0;
  let publicHtmlFilesFound = 0;
  let totalFiles = filesToCheck.length * baseDirectories.length;
  const results = {};
  
  // Create results tracking structure
  filesToCheck.forEach(file => {
    results[file] = {
      public: { exists: false, size: 0, valid: false },
      public_html: { exists: false, size: 0, valid: false }
    };
  });
  
  // Check all files
  baseDirectories.forEach(baseDir => {
    const dirName = path.basename(baseDir);
    
    filesToCheck.forEach(file => {
      const localPath = path.join(baseDir, file.substring(1)); // Remove leading slash
      try {
        const stats = fs.statSync(localPath);
        results[file][dirName].exists = true;
        results[file][dirName].size = stats.size;
        
        // For CSS/JS files, check content to ensure they're valid
        if (file.endsWith('.css') || file.endsWith('.js')) {
          const content = fs.readFileSync(localPath, 'utf8');
          if ((file.endsWith('.css') && content.includes('{')) || 
              (file.endsWith('.js') && content.includes('function'))) {
            results[file][dirName].valid = true;
          }
        } else {
          // Non CSS/JS files are considered valid if they exist
          results[file][dirName].valid = true;
        }
        
        // Count successful finds
        if (dirName === 'public') {
          publicFilesFound++;
        } else {
          publicHtmlFilesFound++;
        }
      } catch (err) {
        // File not found, leave defaults (false)
      }
    });
  });
  
  // Print formatted results - public directory
  console.log('\n📂 PUBLIC DIRECTORY RESULTS:');
  console.log('----------------------------------------------');
  console.log('FILE                      | EXISTS | SIZE     | VALID');
  console.log('----------------------------------------------');
  
  filesToCheck.forEach(file => {
    const status = results[file].public;
    const existsIcon = status.exists ? '✅' : '❌';
    const validIcon = status.valid ? '✅' : (status.exists ? '❌' : '-');
    const sizeText = status.exists ? `${status.size} bytes` : '-';
    const paddedFile = file.padEnd(25, ' ');
    console.log(`${paddedFile} | ${existsIcon}    | ${sizeText.padEnd(9, ' ')} | ${validIcon}`);
  });
  
  // Print formatted results - public_html directory
  console.log('\n📂 PUBLIC_HTML DIRECTORY RESULTS:');
  console.log('----------------------------------------------');
  console.log('FILE                      | EXISTS | SIZE     | VALID');
  console.log('----------------------------------------------');
  
  filesToCheck.forEach(file => {
    const status = results[file].public_html;
    const existsIcon = status.exists ? '✅' : '❌';
    const validIcon = status.valid ? '✅' : (status.exists ? '❌' : '-');
    const sizeText = status.exists ? `${status.size} bytes` : '-';
    const paddedFile = file.padEnd(25, ' ');
    console.log(`${paddedFile} | ${existsIcon}    | ${sizeText.padEnd(9, ' ')} | ${validIcon}`);
  });
  
  // Check server.js static file serving order
  console.log('\n🔍 SERVER CONFIGURATION:');
  console.log('----------------------------------------------');
  try {
    const serverJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    
    if (serverJs.indexOf('express.static(path.join(__dirname, \'public\')') < 
        serverJs.indexOf('express.static(path.join(__dirname, \'public_html\')')) {
      console.log('✅ Server.js is correctly configured to prioritize public directory');
    } else {
      console.log('❌ Server.js is NOT configured to prioritize public directory');
    }
  } catch (err) {
    console.log('❌ Could not read server.js for verification');
  }
  
  // Check CSS-fix.js file path prioritization
  console.log('\n🔍 CSS-FIX.JS PATH PRIORITIZATION:');
  console.log('----------------------------------------------');
  try {
    const cssFixJs = fs.readFileSync(path.join(__dirname, 'public_html/js/css-fix.js'), 'utf8');
    if (cssFixJs.indexOf('`${basePath}/public/css/${file}') < 
        cssFixJs.indexOf('`${basePath}/public_html/css/${file}')) {
      console.log('✅ CSS-fix.js is correctly configured to prioritize public directory paths');
    } else {
      console.log('❌ CSS-fix.js is NOT configured to prioritize public directory paths');
    }
  } catch (err) {
    console.log('❌ Could not read CSS-fix.js for verification');
  }
  
  // Final summary
  console.log('\n📊 CONSOLIDATION SUMMARY:');
  console.log('----------------------------------------------');
  console.log(`Files in public directory:      ${publicFilesFound}/${filesToCheck.length}`);
  console.log(`Files in public_html directory: ${publicHtmlFilesFound}/${filesToCheck.length}`);
  console.log(`Overall completeness:           ${Math.round((publicFilesFound/filesToCheck.length)*100)}%`);
  
  // Recommendation
  console.log('\n📝 RECOMMENDATION:');
  console.log('----------------------------------------------');
  if (publicFilesFound < filesToCheck.length) {
    console.log('⚠️ Consolidation is incomplete. Missing files should be copied from public_html to public.');
    const missingFiles = filesToCheck.filter(file => !results[file].public.exists && results[file].public_html.exists);
    if (missingFiles.length > 0) {
      console.log('\nMissing files in public directory:');
      missingFiles.forEach(file => console.log(`- ${file}`));
    }
  } else {
    console.log('✅ Consolidation appears complete! All necessary files exist in the public directory.');
  }
};

// Run the verification
checkLocalFiles();
