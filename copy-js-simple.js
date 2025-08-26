const fs = require('fs');
const path = require('path');

// Source and destination directories
const sourceDir = path.join(__dirname, 'public_html', 'js');
const targetDir = path.join(__dirname, 'public', 'js');

// List files in source directory
console.log('Reading source directory:', sourceDir);
try {
  const files = fs.readdirSync(sourceDir);
  console.log('Found files:', files);
  
  // Ensure target directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log('Created target directory:', targetDir);
  }
  
  // Copy each file
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    try {
      const data = fs.readFileSync(sourcePath);
      fs.writeFileSync(targetPath, data);
      console.log(`✓ Copied ${file} (${data.length} bytes)`);
    } catch (err) {
      console.error(`Error copying ${file}:`, err);
    }
  });
  
  // Verify files were copied
  console.log('\nVerifying files in target directory:');
  const copiedFiles = fs.readdirSync(targetDir);
  console.log('Files in target directory:', copiedFiles);
  
} catch (err) {
  console.error('Error:', err);
}
