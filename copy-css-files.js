const fs = require('fs');
const path = require('path');

// Source and destination directories
const sourceDir = path.join(__dirname, 'public_html', 'css');
const destDir = path.join(__dirname, 'public', 'css');

// Create the destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  console.log(`Creating directory: ${destDir}`);
  fs.mkdirSync(destDir, { recursive: true });
}

// Create the components subdirectory if it exists in the source
const sourceComponentsDir = path.join(sourceDir, 'components');
const destComponentsDir = path.join(destDir, 'components');

if (fs.existsSync(sourceComponentsDir) && !fs.existsSync(destComponentsDir)) {
  console.log(`Creating components directory: ${destComponentsDir}`);
  fs.mkdirSync(destComponentsDir, { recursive: true });
}

// Copy CSS files from the source directory to the destination
const copyFiles = (src, dest) => {
  try {
    // Get all files in the source directory
    const files = fs.readdirSync(src);
    
    files.forEach(file => {
      const sourcePath = path.join(src, file);
      const destPath = path.join(dest, file);
      
      // Check if it's a file (not a directory)
      const stats = fs.statSync(sourcePath);
      
      if (stats.isFile() && path.extname(file).toLowerCase() === '.css') {
        // Copy the file
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied: ${sourcePath} → ${destPath}`);
      } else if (stats.isDirectory()) {
        // Recursively copy subdirectories
        if (!fs.existsSync(path.join(dest, file))) {
          fs.mkdirSync(path.join(dest, file), { recursive: true });
        }
        copyFiles(sourcePath, path.join(dest, file));
      }
    });
    
    console.log(`All CSS files copied from ${src} to ${dest}`);
  } catch (error) {
    console.error(`Error copying files: ${error.message}`);
  }
};

// Start the copy process
copyFiles(sourceDir, destDir);
