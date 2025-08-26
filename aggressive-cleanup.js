/**
 * FreshShare Aggressive Cleanup Script
 *
 * This script aggressively removes unnecessary files from the project
 * to prepare for production deployment.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const rootDir = __dirname;
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(rootDir, `cleanup-backup-${timestamp}`);

// Create backup directory
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`\x1b[32mCreated backup directory: ${backupDir}\x1b[0m`);
}

// Files to remove
const filesToRemove = [
  // Duplicate deployment scripts
  'deploy-nodejs-production.sh',
  'deploy-to-production.js',
  'deployment-preparation.js',

  // Temporary files
  'temp.env',
  'myfrovov.coreftp',
  'Secure myfrovov.coreftp',
  'commit-message.txt',

  // Redundant MD files with overlapping content
  '503-NODEJS-SOLUTION-SUMMARY.md',
  '503-error-fix.md',
  '503-fix-steps.md',
  'CPANEL_SETUP_INSTRUCTIONS.md',
  'CSS_CONSOLIDATION.md',
  'DEPLOYMENT_CHECKLIST.md',
  'DEPLOYMENT_STEPS.md',
  'GITHUB_SECRETS_SETUP.md',
  'GITHUB_WORKFLOW_USAGE.md',
  'NODEJS_IMPLEMENTATION_GUIDE.md',
  'NODEJS_PRODUCTION_SETUP.md',
  'NODEJS_SOLUTION_SUMMARY.md',
  'PRODUCTION_FIX_GUIDE.md',
  'PRODUCTION_SETUP_GUIDE.md',
  'cpanel-nodejs-setup.md',
  'deployment-trigger.md',
  'htaccess-fix.txt',
  'mongodb-atlas-setup.md',

  // Old test scripts
  'connection-test.js',
  'cpanel-connection-test.js',
  'cpanel-test.sh',
  'test-connection.js',
  'test-proxy-connection.js',
  'test-server.js',
  'simple-test.js',

  // Duplicate config files
  'config-temp.js',
];

// Directories to remove
const dirsToRemove = [
  'cleanup-backup',
  'deployment-packages',
  'deployment-package',
  'data',
  // We keep deployment directory as it has useful reference files
];

// Log function with colors
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m%s\x1b[0m', // Cyan
    success: '\x1b[32m%s\x1b[0m', // Green
    warning: '\x1b[33m%s\x1b[0m', // Yellow
    error: '\x1b[31m%s\x1b[0m', // Red
  };

  console.log(colors[type], message);
}

// Backup a file before removing it
function backupFile(filePath) {
  try {
    const relativePath = path.relative(rootDir, filePath);
    const backupPath = path.join(backupDir, relativePath);

    // Create directory structure
    const backupDirPath = path.dirname(backupPath);
    if (!fs.existsSync(backupDirPath)) {
      fs.mkdirSync(backupDirPath, { recursive: true });
    }

    fs.copyFileSync(filePath, backupPath);
    return true;
  } catch (error) {
    log(`Failed to backup ${filePath}: ${error.message}`, 'error');
    return false;
  }
}

// Backup a directory before removing it
function backupDirectory(dirPath) {
  try {
    const relativePath = path.relative(rootDir, dirPath);
    const backupPath = path.join(backupDir, relativePath);

    // Create parent directories
    if (!fs.existsSync(path.dirname(backupPath))) {
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    }

    // Copy directory recursively
    copyRecursiveSync(dirPath, backupPath);
    return true;
  } catch (error) {
    log(`Failed to backup directory ${dirPath}: ${error.message}`, 'error');
    return false;
  }
}

// Copy directory recursively
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Remove individual files
function removeFiles() {
  let removedCount = 0;

  for (const file of filesToRemove) {
    const filePath = path.join(rootDir, file);

    if (fs.existsSync(filePath)) {
      if (backupFile(filePath)) {
        try {
          fs.unlinkSync(filePath);
          log(`Removed: ${file}`, 'success');
          removedCount++;
        } catch (error) {
          log(`Failed to remove ${file}: ${error.message}`, 'error');
        }
      }
    }
  }

  return removedCount;
}

// Remove directories
function removeDirectories() {
  let removedCount = 0;

  for (const dir of dirsToRemove) {
    const dirPath = path.join(rootDir, dir);

    if (fs.existsSync(dirPath)) {
      try {
        // Backup directory content
        backupDirectory(dirPath);

        // Remove directory
        fs.rmSync(dirPath, { recursive: true, force: true });
        log(`Removed directory: ${dir}`, 'success');
        removedCount++;
      } catch (error) {
        log(`Failed to remove directory ${dir}: ${error.message}`, 'error');
      }
    }
  }

  return removedCount;
}

// Clean up package-lock.json duplicates
function cleanupPackageLockDuplicates() {
  const packageLockPaths = [];

  // Find all package-lock.json files except in node_modules
  function findPackageLocks(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && !entry.name.includes('backup')) {
            findPackageLocks(fullPath);
          }
        } else if (entry.name === 'package-lock.json') {
          packageLockPaths.push(fullPath);
        }
      }
    } catch (error) {
      // Skip inaccessible directories
    }
  }

  // Start search
  findPackageLocks(rootDir);

  // Keep root package-lock.json and remove others
  if (packageLockPaths.length > 1) {
    const rootPackageLock = path.join(rootDir, 'package-lock.json');

    for (const lockPath of packageLockPaths) {
      if (lockPath !== rootPackageLock) {
        if (backupFile(lockPath)) {
          fs.unlinkSync(lockPath);
          log(
            `Removed duplicate package-lock.json: ${path.relative(rootDir, lockPath)}`,
            'success'
          );
        }
      }
    }

    return packageLockPaths.length - 1;
  }

  return 0;
}

// Clean up node_modules except in root
function cleanupNodeModules() {
  let removedCount = 0;

  function findNodeModules(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.includes('backup')) continue;

        const fullPath = path.join(dir, entry.name);

        if (
          entry.name === 'node_modules' &&
          fullPath !== path.join(rootDir, 'node_modules')
        ) {
          try {
            backupDirectory(fullPath);
            fs.rmSync(fullPath, { recursive: true, force: true });
            log(
              `Removed non-root node_modules: ${path.relative(rootDir, fullPath)}`,
              'success'
            );
            removedCount++;
          } catch (error) {
            log(`Failed to remove ${fullPath}: ${error.message}`, 'error');
          }
          continue;
        }

        findNodeModules(fullPath);
      }
    } catch (error) {
      // Skip inaccessible directories
    }
  }

  findNodeModules(rootDir);
  return removedCount;
}

// Clean uploads but maintain structure
function cleanUploads() {
  const uploadsDir = path.join(rootDir, 'public/uploads');
  const marketplaceDir = path.join(uploadsDir, 'marketplace');

  if (fs.existsSync(uploadsDir)) {
    try {
      // Backup files
      backupDirectory(uploadsDir);

      // Remove all files
      function removeAllFiles(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            removeAllFiles(fullPath);
          } else {
            fs.unlinkSync(fullPath);
          }
        }
      }

      removeAllFiles(uploadsDir);
      log('Cleaned uploads directory', 'success');

      // Create necessary directory structure and placeholder files
      if (!fs.existsSync(marketplaceDir)) {
        fs.mkdirSync(marketplaceDir, { recursive: true });
      }

      fs.writeFileSync(path.join(uploadsDir, '.gitkeep'), '');
      fs.writeFileSync(path.join(marketplaceDir, '.gitkeep'), '');

      return true;
    } catch (error) {
      log(`Error cleaning uploads: ${error.message}`, 'error');
      return false;
    }
  }

  return false;
}

// Clean large image files
function cleanLargeImages() {
  const imagesDir = path.join(rootDir, 'public/images');
  let removedCount = 0;

  if (fs.existsSync(imagesDir)) {
    try {
      function processDir(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            processDir(fullPath);
          } else {
            try {
              const stats = fs.statSync(fullPath);
              // Remove files larger than 500KB
              if (stats.size > 500 * 1024) {
                if (backupFile(fullPath)) {
                  fs.unlinkSync(fullPath);
                  log(
                    `Removed large image: ${path.relative(rootDir, fullPath)} (${(stats.size / 1024).toFixed(2)} KB)`,
                    'success'
                  );
                  removedCount++;
                }
              }
            } catch (error) {
              // Skip problematic files
            }
          }
        }
      }

      processDir(imagesDir);
    } catch (error) {
      log(`Error processing images: ${error.message}`, 'error');
    }
  }

  return removedCount;
}

// Main cleanup function
function cleanup() {
  log('Starting aggressive cleanup...', 'info');

  const removedFilesCount = removeFiles();
  const removedDirsCount = removeDirectories();
  const removedPackageLocks = cleanupPackageLockDuplicates();
  const removedNodeModules = cleanupNodeModules();
  const removedLargeImages = cleanLargeImages();
  const cleanedUploads = cleanUploads();

  log('Cleanup complete!', 'success');
  log(`Removed ${removedFilesCount} files`, 'info');
  log(`Removed ${removedDirsCount} directories`, 'info');
  log(
    `Removed ${removedPackageLocks} duplicate package-lock.json files`,
    'info'
  );
  log(
    `Removed ${removedNodeModules} non-root node_modules directories`,
    'info'
  );
  log(`Removed ${removedLargeImages} large image files`, 'info');
  log(`All removed files are backed up in: ${backupDir}`, 'info');

  log('\nNext steps for deployment:', 'info');
  log('1. Review the cleaned repository', 'info');
  log('2. Commit the cleaned state:            git add .', 'info');
  log(
    '3. Commit with message:                 git commit -m "Clean repository for production"',
    'info'
  );
  log(
    '4. Push to deployment branch:           git push origin restore_branch',
    'info'
  );
  log('5. Monitor GitHub Actions deployment', 'info');
}

// Run cleanup
cleanup();
