/**
 * FreshShare Production Diagnostics Tool (Node.js-only version)
 *
 * This script checks for common issues that might cause 503 errors
 * in a Node.js-only production environment on cPanel.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Helper functions
function printHeader(text) {
  console.log(`\n${colors.bold}${colors.blue}=== ${text} ===${colors.reset}\n`);
}

function printSuccess(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

function printWarning(text) {
  console.log(`${colors.yellow}⚠ ${text}${colors.reset}`);
}

function printError(text) {
  console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

function printInfo(text) {
  console.log(`${colors.cyan}ℹ ${text}${colors.reset}`);
}

function runCommand(command) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    return error.stdout || error.stderr || error.message;
  }
}

function checkFileExists(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      printSuccess(`${description} exists: ${filePath}`);
      return true;
    } else {
      printError(`${description} not found: ${filePath}`);
      return false;
    }
  } catch (error) {
    printError(`Error checking ${description}: ${error.message}`);
    return false;
  }
}

function checkFilePermissions(filePath, description) {
  try {
    const stats = fs.statSync(filePath);
    const isExecutable = !!(stats.mode & fs.constants.S_IXUSR);

    if (isExecutable) {
      printSuccess(`${description} is executable`);
      return true;
    } else {
      printWarning(
        `${description} is not executable. Run: chmod +x ${filePath}`
      );
      return false;
    }
  } catch (error) {
    printError(
      `Error checking permissions for ${description}: ${error.message}`
    );
    return false;
  }
}

function checkProcessRunning(processName, grepPattern) {
  try {
    const isWindows = process.platform === 'win32';
    const command = isWindows
      ? `tasklist | findstr "${grepPattern}"`
      : `ps aux | grep "${grepPattern}" | grep -v grep`;

    const result = runCommand(command);

    if (result && result.includes(grepPattern)) {
      printSuccess(
        `${processName} is running: ${result.trim().split('\n')[0]}`
      );
      return true;
    } else {
      printError(`${processName} is not running`);
      return false;
    }
  } catch (error) {
    printError(`Error checking if ${processName} is running: ${error.message}`);
    return false;
  }
}

function checkPortInUse(port, description) {
  try {
    const isWindows = process.platform === 'win32';
    const command = isWindows
      ? `netstat -ano | findstr :${port}`
      : `netstat -tulpn | grep :${port}`;

    const result = runCommand(command);

    if (result && result.includes(`:${port}`)) {
      printSuccess(
        `${description} port ${port} is in use: ${result.trim().split('\n')[0]}`
      );
      return true;
    } else {
      printError(`${description} port ${port} is not in use`);
      return false;
    }
  } catch (error) {
    printError(`Error checking if port ${port} is in use: ${error.message}`);
    return false;
  }
}

function checkEnvFile(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content
        .split('\n')
        .filter((line) => line.trim() && !line.startsWith('#'));

      printSuccess(`${description} exists with ${lines.length} settings`);

      // Check for critical variables
      const criticalVars = ['PORT', 'NODE_ENV', 'MONGODB_URI', 'JWT_SECRET'];
      const missingVars = [];

      criticalVars.forEach((variable) => {
        if (!content.includes(`${variable}=`)) {
          missingVars.push(variable);
        }
      });

      if (missingVars.length > 0) {
        printWarning(
          `${description} is missing critical variables: ${missingVars.join(', ')}`
        );
      } else {
        printSuccess(`${description} contains all critical variables`);
      }

      return true;
    } else {
      printError(`${description} not found: ${filePath}`);
      return false;
    }
  } catch (error) {
    printError(`Error checking ${description}: ${error.message}`);
    return false;
  }
}

function checkLogFile(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      const lastModified = new Date(stats.mtime);

      printSuccess(
        `${description} exists (${fileSizeInMB.toFixed(2)} MB, last modified: ${lastModified.toLocaleString()})`
      );

      // Check for recent errors
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const lastLines = lines.slice(-100).join('\n');

      if (
        lastLines.toLowerCase().includes('error') ||
        lastLines.toLowerCase().includes('exception')
      ) {
        printWarning(
          `${description} contains recent errors. Last 3 error lines:`
        );

        const errorLines = lines
          .filter(
            (line) =>
              line.toLowerCase().includes('error') ||
              line.toLowerCase().includes('exception')
          )
          .slice(-3);

        errorLines.forEach((line) => {
          console.log(`  ${colors.yellow}${line}${colors.reset}`);
        });
      } else {
        printSuccess(
          `${description} has no recent errors in the last 100 lines`
        );
      }

      return true;
    } else {
      printWarning(
        `${description} not found: ${filePath}. This might be normal if the service hasn't started yet.`
      );
      return false;
    }
  } catch (error) {
    printError(`Error checking ${description}: ${error.message}`);
    return false;
  }
}

function checkNodeVersion() {
  try {
    const nodeVersion = runCommand('node -v');
    const npmVersion = runCommand('npm -v');

    printInfo(`Node.js version: ${nodeVersion.trim()}`);
    printInfo(`npm version: ${npmVersion.trim()}`);

    const versionNumber = nodeVersion.trim().replace('v', '').split('.');
    const majorVersion = parseInt(versionNumber[0], 10);

    if (majorVersion >= 14) {
      printSuccess(
        `Node.js version ${majorVersion} is compatible (14+ recommended)`
      );
      return true;
    } else {
      printWarning(
        `Node.js version ${majorVersion} is below recommended (14+ recommended)`
      );
      return false;
    }
  } catch (error) {
    printError(`Error checking Node.js version: ${error.message}`);
    return false;
  }
}

function checkCronJobs() {
  try {
    const crontab = runCommand('crontab -l');

    if (
      crontab.includes('start-express.sh') &&
      crontab.includes('start-fastify.sh')
    ) {
      printSuccess('Cron jobs are set up for automatic restart');
      return true;
    } else {
      printWarning(
        'Cron jobs for automatic restart are not set up or incomplete'
      );
      printInfo('Run setup-cron-jobs.sh to configure automatic restarts');
      return false;
    }
  } catch (error) {
    printError(`Error checking cron jobs: ${error.message}`);
    return false;
  }
}

function checkDependencies(directory, packageName) {
  try {
    const packageJsonPath = path.join(directory, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      if (dependencies[packageName]) {
        printSuccess(
          `${packageName} is in package.json dependencies (${dependencies[packageName]})`
        );

        const nodeModulesPath = path.join(
          directory,
          'node_modules',
          packageName
        );
        if (fs.existsSync(nodeModulesPath)) {
          printSuccess(`${packageName} is installed in node_modules`);
          return true;
        } else {
          printWarning(
            `${packageName} is in package.json but not installed. Run: cd ${directory} && npm install`
          );
          return false;
        }
      } else {
        printError(`${packageName} is not in package.json dependencies`);
        return false;
      }
    } else {
      printError(`package.json not found in ${directory}`);
      return false;
    }
  } catch (error) {
    printError(`Error checking dependencies: ${error.message}`);
    return false;
  }
}

// Main diagnostic function
async function runDiagnostics() {
  console.log(`${colors.bold}${colors.magenta}
===========================================
FreshShare Production Diagnostics (Node.js)
===========================================
${colors.reset}`);

  // Get home directory
  const homeDir = os.homedir();
  const publicHtmlDir = path.join(homeDir, 'public_html');
  const fastifyBackendDir = path.join(homeDir, 'fastify-backend');

  // Check Node.js installation
  printHeader('Node.js Environment');
  checkNodeVersion();

  // Check if services are running
  printHeader('Service Status');
  const expressRunning = checkProcessRunning(
    'Express server',
    'node server.js'
  );
  const fastifyRunning = checkProcessRunning('Fastify backend', 'server.ts');

  // Check ports
  printHeader('Port Availability');
  checkPortInUse(3001, 'Express server');
  checkPortInUse(8080, 'Fastify backend');

  // Check startup scripts
  printHeader('Startup Scripts');
  const expressScriptExists = checkFileExists(
    path.join(publicHtmlDir, 'start-express.sh'),
    'Express startup script'
  );
  const fastifyScriptExists = checkFileExists(
    path.join(fastifyBackendDir, 'start-fastify.sh'),
    'Fastify startup script'
  );

  if (expressScriptExists) {
    checkFilePermissions(
      path.join(publicHtmlDir, 'start-express.sh'),
      'Express startup script'
    );
  }

  if (fastifyScriptExists) {
    checkFilePermissions(
      path.join(fastifyBackendDir, 'start-fastify.sh'),
      'Fastify startup script'
    );
  }

  // Check environment files
  printHeader('Environment Files');
  checkEnvFile(path.join(publicHtmlDir, '.env'), 'Express .env file');
  checkEnvFile(path.join(fastifyBackendDir, '.env'), 'Fastify .env file');

  // Check log files
  printHeader('Log Files');
  checkLogFile(path.join(publicHtmlDir, 'express.log'), 'Express log file');
  checkLogFile(path.join(fastifyBackendDir, 'fastify.log'), 'Fastify log file');

  // Check cron jobs
  printHeader('Cron Jobs');
  checkCronJobs();

  // Check dependencies
  printHeader('Dependencies');
  checkDependencies(publicHtmlDir, 'express');
  checkDependencies(fastifyBackendDir, 'fastify');

  // Summary and recommendations
  printHeader('Summary and Recommendations');

  if (!expressRunning) {
    printInfo(
      'To start Express server: cd ~/public_html && ./start-express.sh'
    );
  }

  if (!fastifyRunning) {
    printInfo(
      'To start Fastify backend: cd ~/fastify-backend && ./start-fastify.sh'
    );
  }

  printInfo(
    'To check logs: tail -f ~/public_html/express.log ~/fastify-backend/fastify.log'
  );
  printInfo(
    'To restart both services: cd ~/fastify-backend && ./start-fastify.sh && sleep 5 && cd ~/public_html && ./start-express.sh'
  );

  console.log(`\n${colors.bold}${colors.magenta}
===========================================
Diagnostic Complete
===========================================
${colors.reset}`);
}

// Run the diagnostics
runDiagnostics().catch((error) => {
  console.error('Diagnostic failed:', error);
});
