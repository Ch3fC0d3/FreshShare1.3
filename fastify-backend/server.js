// Production server.js - CommonJS version
require('dotenv/config');
const fastify = require('fastify');
const { Pool } = require('pg');
const fs = require('fs');

// Config
const PORT = Number(process.env.PORT || 8080);
const DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://localhost:5432/freshshare';
const DATABASE_SSL = process.env.DATABASE_SSL === 'true';

console.log('Starting server on port:', PORT);
console.log(
  'Using database URL (redacted):',
  DATABASE_URL.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@')
);

// Initialize database pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_SSL ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test database connection
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✓ Database connection successful');
    return true;
  } catch (err) {
    console.error('✗ Database connection failed:', err.message);
    return false;
  }
}

// Create app
const app = fastify({
  logger: true,
  trustProxy: true,
});

// Basic health check endpoint
app.get('/health', async () => ({ ok: true }));

// Minimal parse-label endpoint
app.post('/parse-label', async (req) => {
  const body = req.body || {};
  const text = body.text || '';
  return { gtinCase: text.slice(0, 14) || null };
});

// Minimal case-pack endpoint
app.get('/case-pack', async () => {
  return { items: [] };
});

// Register error handler
app.setErrorHandler((error, _request, reply) => {
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    reply.status(503).send({
      error: 'Database connection failed',
      message: 'Service temporarily unavailable',
    });
    return;
  }
  reply.status(500).send({
    error: error.message,
    code: error.code,
  });
});

// Start server with database check
async function startServer() {
  if (!(await testDatabaseConnection())) {
    console.error(
      'Failed to connect to database. Check configuration and try again.'
    );
    process.exit(1);
  }

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`FreshShare backend listening on port ${PORT}`);
    fs.writeFileSync('.server_running', new Date().toISOString());
  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

startServer();
