function checkDependency(name) {
  try {
    require.resolve(name);
    return true;
  } catch (e) {
    return false;
  }
}

const missingDeps = [];

const requiredDeps = ['dotenv', 'mongoose', 'pg', 'chalk'];

requiredDeps.forEach((dep) => {
  if (!checkDependency(dep)) {
    missingDeps.push(dep);
  }
});

if (missingDeps.length > 0) {
  console.error('\nMissing required dependencies:', missingDeps.join(', '));
  console.log('\nPlease install missing dependencies with:');
  console.log(`npm install --save ${missingDeps.join(' ')}\n`);
  process.exit(1);
}

require('dotenv').config();
const mongoose = require('mongoose');
const { Pool } = require('pg');
const http = require('http');
const chalk = require('chalk');
const { promises: fs } = require('fs');
const path = require('path');
const { exec } = require('child_process');

const execAsync = (cmd) => new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve({ stdout, stderr });
      });
    });

const MONGODB_URI = 
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/myfrovov_freshshare';

const MONGODB_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  ssl: process.env.MONGODB_SSL === 'true',
};

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://myfrovov_freshshare_user@localhost:5432/myfrovov_freshshare';

const LOG_FILES = [
  'express.log',
  'fastify.log',
  'express_cron.log',
  'diagnostic.log',
].map((file) => path.join(__dirname, file));

async function checkMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI, MONGODB_OPTIONS);
    console.log(chalk.green('✓ MongoDB connection successful'));

    await mongoose.connection.db.collection('test').insertOne({ test: true });
    await mongoose.connection.db.collection('test').deleteOne({ test: true });
    console.log(chalk.green('✓ MongoDB read/write test successful'));

    await mongoose.connection.close();
  } catch (error) {
    console.error(chalk.red('✗ MongoDB connection failed:'), error.message);
    throw error;
  }
}

async function checkPostgreSQL() {
  console.log('\n=== PostgreSQL Status ===');
  if (!DATABASE_URL) {
    console.error(chalk.red('✗ DATABASE_URL not set'));
    console.log(chalk.yellow('Please set DATABASE_URL environment variable'));
    return;
  }
  try {
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true'
        ? {
          rejectUnauthorized: false
        }
        : false
    });

    const client = await pool.connect();
    console.log(chalk.green('✓ PostgreSQL connection successful'));

    const { rows } = await client.query('SELECT NOW()');
    console.log(chalk.green('✓ PostgreSQL query successful'), rows[0]);

    client.release();
    await pool.end();
  } catch (error) {
    console.error(chalk.red('✗ PostgreSQL Error:'), error.message);
  }
}

async function checkExpressFrontend() {
  return new Promise((resolve, reject) => {
    http
      .get('http://localhost:3001', (res) => {
        res.on('data', () => {});

        res.on('end', () => {
          console.log(chalk.green('✓ Express Frontend:'), res.statusCode);
          resolve();
        });
      })
      .on('error', (error) => {
        console.error(chalk.red('✗ Express Frontend Error:'), error.message);
        reject(error);
      });
  });
}

async function checkFastifyBackend() {
  return new Promise((resolve, reject) => {
    http
      .get('http://localhost:8080/health', (res) => {
        res.on('data', () => {});
        res.on('end', () => {
          console.log(
            chalk.green('✓ Fastify backend responding:'),
            res.statusCode
          );
          resolve();
        });
      })
      .on('error', (error) => {
        console.error(chalk.red('✗ Fastify backend failed:'), error.message);
        reject(error);
      });
  });
}

async function checkServices() {
  console.log('\n=== Service Health ===');
  await checkExpressFrontend();
  await checkFastifyBackend();
}

async function checkLogs() {
  try {
    const logContents = await Promise.all(
      LOG_FILES.map(async (file) => {
        try {
          return await fs.readFile(file, 'utf8');
        } catch (error) {
          if (error.code === 'ENOENT') {
            console.log(chalk.yellow(`! Log file not found: ${file}`));
            return '';
          }
          throw error;
        }
      }),
    );

    const lines = logContents
      .join('\n')
      .split('\n')
      .filter((line) => line.trim());

    const errors = lines.filter(
      (line) =>
        /error|exception|fail|crash/i.test(line) &&
        !/successfully|recovered|resolved/.test(line)
    );

    if (errors.length > 0) {
      console.log(chalk.yellow('! Recent errors found in logs:'));
      errors.forEach((err) => {
        console.log(chalk.yellow(`  ${err}`));
      });
    } else {
      console.log(chalk.green('✓ No recent errors in logs'));
    }
  } catch (error) {
    console.error(chalk.red('✗ Log check failed:'), error.message);
    throw error;
  }
}

async function checkCronJobs() {
  console.log('\n=== Cron Jobs ===');
  if (process.platform === 'win32') {
    console.log(chalk.yellow('! Cron jobs not supported on Windows'));
    return;
  }
  try {
    const { stdout } = await execAsync('crontab -l');
    const jobs = stdout.split('\n').filter((line) => line.trim());

    if (jobs.length > 0) {
      console.log(chalk.green('✓ Cron jobs found:'));
      jobs.forEach((job) => console.log(`  ${job}`));
    } else {
      console.log(chalk.yellow('! No cron jobs found'));
    }
  } catch (error) {
    if (error.message.includes('no crontab')) {
      console.log(chalk.yellow('! No crontab for user'));
    } else {
      console.error(chalk.red('✗ Error checking cron jobs:'), error.message);
      throw error;
    }
  }
}

async function checkProcesses() {
  console.log('\n=== Process Status ===');
  try {
    const cmd = process.platform === 'win32'
      ? 'tasklist /FI "IMAGENAME eq node.exe" /FI "IMAGENAME eq npm.cmd" /NH /FO CSV'
      : 'ps aux | grep -E "node|npm" | grep -v grep';
    const { stdout } = await execAsync(cmd);
    const processes = stdout.split('\n')
      .filter(Boolean)
      .map((line) => {
        return process.platform === 'win32'
          ? line.split('","')[0].replace('"', '') // Extract process name from CSV
          : line;
      });

    if (processes.length > 0) {
      console.log(chalk.green('✓ Found Node.js processes:'));
      processes.forEach((proc) => {
        console.log('  -', proc);
      });
    } else {
      console.log(chalk.red('✗ No Node.js processes found'));
    }
  } catch (err) {
    console.error(chalk.red('✗ Error checking processes:'), err.message);
  }
}

async function runDiagnostics() {
  try {
    console.log('\n=== FreshShare Production Diagnostics ===\n');
    console.log('Started at:', new Date().toISOString(), '\n');
    console.log('Environment:', process.env.NODE_ENV || 'not set', '\n');

    let mongoOk = false;
    let pgOk = false;

    try {
      await checkMongoDB();
      mongoOk = true;
    } catch (error) {
      console.error(chalk.red('✗ MongoDB check failed:'), error.message);
    }

    try {
      await checkPostgreSQL();
      pgOk = true;
    } catch (error) {
      console.error(chalk.red('✗ PostgreSQL check failed:'), error.message);
    }

    try {
      await checkServices();
    } catch (error) {
      console.error(chalk.red('✗ Service check failed:'), error.message);
    }

    try {
      await checkLogs();
    } catch (error) {
      console.error(chalk.red('✗ Log check failed:'), error.message);
    }

    try {
      await checkCronJobs();
    } catch (error) {
      console.error(chalk.red('✗ Cron job check failed:'), error.message);
    }

    try {
      await checkProcesses();
    } catch (error) {
      console.error(chalk.red('✗ Process check failed:'), error.message);
    }

    console.log('\n=== Final Summary ===');
    console.log(
      'MongoDB:',
      mongoOk ? chalk.green('✓ OK') : chalk.red('✗ Failed')
    );
    console.log(
      'PostgreSQL:',
      pgOk ? chalk.green('✓ OK') : chalk.red('✗ Failed')
    );

    if (!mongoOk || !pgOk) {
      console.log(chalk.yellow('\n⚠️ Action Required:'));
      if (!mongoOk) {
        console.log('- Verify MongoDB Atlas connection string in .env');
        console.log('- Check MongoDB Atlas IP whitelist');
        console.log('- Verify SSL settings');
      }
      if (!pgOk) {
        console.log('- Verify PostgreSQL connection string');
        console.log('- Check database credentials');
        console.log('- Verify SSL settings');
      }
    }
  } catch (error) {
    console.error(chalk.red('✗ Unexpected error:'), error.message);
    throw error;
  }
}

// Run diagnostics
runDiagnostics().catch((error) => {
  console.error(chalk.red('✗ Fatal error:'), error.message);
  process.exit(1);
});
