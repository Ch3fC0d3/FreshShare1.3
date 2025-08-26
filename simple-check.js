const fs = require('fs');
const path = require('path');

console.log('===== Directory Consolidation Check =====\n');

// Files to check
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
  '/.htaccess',
  '/css/.htaccess'
];

// Check files in both directories
console.log('Files in public directory:');
console.log('--------------------------');
let publicCount = 0;
for (const file of filesToCheck) {
  const exists = fs.existsSync(path.join(__dirname, 'public', file.substring(1)));
  console.log(`${exists ? '✓' : '✗'} ${file}`);
  if (exists) publicCount++;
}

console.log('\nFiles in public_html directory:');
console.log('-----------------------------');
let publicHtmlCount = 0;
for (const file of filesToCheck) {
  const exists = fs.existsSync(path.join(__dirname, 'public_html', file.substring(1)));
  console.log(`${exists ? '✓' : '✗'} ${file}`);
  if (exists) publicHtmlCount++;
}

console.log('\nSummary:');
console.log('--------');
console.log(`Public: ${publicCount}/${filesToCheck.length} files`);
console.log(`Public_html: ${publicHtmlCount}/${filesToCheck.length} files`);
console.log(`Consolidation: ${Math.round((publicCount/filesToCheck.length)*100)}% complete`);

// Check server.js configuration
try {
  const serverContent = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
  const publicFirst = serverContent.indexOf("express.static(path.join(__dirname, 'public')") < 
                    serverContent.indexOf("express.static(path.join(__dirname, 'public_html')");
  
  console.log('\nServer Configuration:');
  console.log('--------------------');
  console.log(`${publicFirst ? '✓' : '✗'} Server prioritizes public over public_html`);
} catch (err) {
  console.log('\nCould not check server.js configuration');
}
