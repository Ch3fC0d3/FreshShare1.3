const fs = require('fs');
const path = require('path');

// Files to check in both directories
const filesToCheck = [
  { path: '/css/reset-styles.css', type: 'css' },
  { path: '/css/main.css', type: 'css' },
  { path: '/css/color-system.css', type: 'css' },
  { path: '/css/design-system.css', type: 'css' },
  { path: '/css/groups-custom.css', type: 'css' },
  { path: '/css/dashboard-enhancements.css', type: 'css' },
  { path: '/js/css-fix.js', type: 'js' },
  { path: '/js/auth.js', type: 'js' },
  { path: '/js/header.js', type: 'js' },
  { path: '/.htaccess', type: 'config' },
  { path: '/css/.htaccess', type: 'config' }
];

// Simple function to check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Main verification function
function verifyConsolidation() {
  console.log('Directory Consolidation Verification');
  console.log('===================================\n');
  
  const publicResults = [];
  const publicHtmlResults = [];
  let publicCount = 0;
  let publicHtmlCount = 0;
  
  // Check each file in both directories
  filesToCheck.forEach(file => {
    const publicPath = path.join(__dirname, 'public', file.path);
    const publicHtmlPath = path.join(__dirname, 'public_html', file.path);
    
    const inPublic = fileExists(publicPath);
    const inPublicHtml = fileExists(publicHtmlPath);
    
    if (inPublic) publicCount++;
    if (inPublicHtml) publicHtmlCount++;
    
    publicResults.push({
      file: file.path,
      exists: inPublic,
      type: file.type
    });
    
    publicHtmlResults.push({
      file: file.path,
      exists: inPublicHtml,
      type: file.type
    });
  });
  
  // Display results
  console.log('PUBLIC DIRECTORY:');
  console.log('-----------------');
  publicResults.forEach(result => {
    console.log(`${result.exists ? '[✓]' : '[✗]'} ${result.file} (${result.type})`);
  });
  
  console.log('\nPUBLIC_HTML DIRECTORY:');
  console.log('----------------------');
  publicHtmlResults.forEach(result => {
    console.log(`${result.exists ? '[✓]' : '[✗]'} ${result.file} (${result.type})`);
  });
  
  // Calculate completion percentage
  const completionPercentage = Math.round((publicCount / filesToCheck.length) * 100);
  
  console.log('\nSUMMARY:');
  console.log('--------');
  console.log(`Files in public: ${publicCount}/${filesToCheck.length} (${completionPercentage}% complete)`);
  console.log(`Files in public_html: ${publicHtmlCount}/${filesToCheck.length}`);
  
  // List missing files that need to be copied
  const missingFiles = publicResults
    .filter(result => !result.exists && publicHtmlResults.find(r => r.file === result.file).exists)
    .map(result => result.file);
  
  if (missingFiles.length > 0) {
    console.log('\nACTION NEEDED:');
    console.log('-------------');
    console.log('The following files need to be copied from public_html to public:');
    missingFiles.forEach(file => console.log(`- ${file}`));
    
    // Generate copy commands
    console.log('\nSUGGESTED COMMANDS:');
    console.log('-----------------');
    missingFiles.forEach(file => {
      const dirPath = path.dirname(file);
      if (dirPath !== '/') {
        console.log(`mkdir -p public${dirPath}`);
      }
      console.log(`copy "public_html${file}" "public${file}"`);
    });
  } else if (publicCount === filesToCheck.length) {
    console.log('\nCONSOLIDATION COMPLETE! ✓');
    console.log('All necessary files exist in the public directory.');
  }
  
  // Verify server.js configuration
  try {
    const serverJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    const publicFirst = serverJs.indexOf("express.static(path.join(__dirname, 'public')") < 
                        serverJs.indexOf("express.static(path.join(__dirname, 'public_html')");
    
    console.log('\nSERVER CONFIGURATION:');
    console.log('-------------------');
    if (publicFirst) {
      console.log('[✓] Server correctly prioritizes public over public_html');
    } else {
      console.log('[✗] Server does NOT prioritize public over public_html');
    }
  } catch (err) {
    console.log('\nCould not verify server.js configuration');
  }
}

// Run the verification
try {
  verifyConsolidation();
  console.log('\nVerification complete!');
} catch (err) {
  console.error('Error running verification:', err);
}
