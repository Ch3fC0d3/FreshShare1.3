const fs = require('fs');
const path = require('path');

// Files to copy from public_html/js to public/js
const jsFIlesToCopy = [
  'css-fix.js',
  'auth.js',
  'header.js'
];

// Ensure target directory exists
const publicJsDir = path.join(__dirname, 'public', 'js');
if (!fs.existsSync(publicJsDir)) {
  try {
    fs.mkdirSync(publicJsDir, { recursive: true });
    console.log(`Created directory: ${publicJsDir}`);
  } catch (err) {
    console.error(`Error creating directory ${publicJsDir}:`, err.message);
    process.exit(1);
  }
}

// Copy each file
jsFIlesToCopy.forEach(file => {
  const sourceFile = path.join(__dirname, 'public_html', 'js', file);
  const targetFile = path.join(publicJsDir, file);
  
  try {
    if (fs.existsSync(sourceFile)) {
      const content = fs.readFileSync(sourceFile, 'utf8');
      fs.writeFileSync(targetFile, content, 'utf8');
      console.log(`✓ Successfully copied ${file} to public/js`);
    } else {
      console.log(`✗ Source file ${file} not found in public_html/js`);
    }
  } catch (err) {
    console.error(`Error copying ${file}:`, err.message);
  }
});

console.log('\nVerifying copies:');
jsFIlesToCopy.forEach(file => {
  const targetFile = path.join(publicJsDir, file);
  if (fs.existsSync(targetFile)) {
    const stats = fs.statSync(targetFile);
    console.log(`✓ ${file} exists in public/js (${stats.size} bytes)`);
  } else {
    console.log(`✗ ${file} is missing from public/js`);
  }
});

console.log('\nJS file consolidation complete!');
