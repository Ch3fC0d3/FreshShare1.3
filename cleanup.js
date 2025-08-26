/**
 * FreshShare Project Cleanup Script
 *
 * This script aggressively removes unnecessary files from the project,
 * including duplicate deployment scripts, old packages, and temporary files.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const rootDir = __dirname;
const backupDir = path.join(rootDir, 'cleanup-backup');

// Create backup directory
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Files and directories to remove
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

  // Cleanup script itself (for future cleanup)
  // 'cleanup.js',
];

// Directories to remove
const dirsToRemove = [
  'deployment-packages',
  'data',
  // We keep deployment directory as it has useful reference files
];

// Log function
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
        execSync(`xcopy "${dirPath}" "${backupDir}\\${dir}" /E /I /H`);

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
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') {
          findPackageLocks(fullPath);
        }
      } else if (entry.name === 'package-lock.json') {
        packageLockPaths.push(fullPath);
      }
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

// Clean empty directories (except node_modules and .git)
function cleanEmptyDirectories(dir = rootDir) {
  if (dir.includes('node_modules') || dir.includes('.git')) {
    return 0;
  }

  let removedCount = 0;
  let files;

  try {
    files = fs.readdirSync(dir);
  } catch (error) {
    return 0;
  }

  for (const file of files) {
    const fullPath = path.join(dir, file);

    try {
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        removedCount += cleanEmptyDirectories(fullPath);

        // Check if directory is now empty
        const remainingFiles = fs.readdirSync(fullPath);
        if (remainingFiles.length === 0) {
          fs.rmdirSync(fullPath);
          log(
            `Removed empty directory: ${path.relative(rootDir, fullPath)}`,
            'success'
          );
          removedCount++;
        }
      }
    } catch (error) {
      // Skip if error
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
  const removedEmptyDirs = cleanEmptyDirectories();

  log('Cleanup complete!', 'success');
  log(`Removed ${removedFilesCount} files`, 'info');
  log(`Removed ${removedDirsCount} directories`, 'info');
  log(
    `Removed ${removedPackageLocks} duplicate package-lock.json files`,
    'info'
  );
  log(`Removed ${removedEmptyDirs} empty directories`, 'info');
  log(`All removed files are backed up in: ${backupDir}`, 'info');
}

// Run cleanup
cleanup();
