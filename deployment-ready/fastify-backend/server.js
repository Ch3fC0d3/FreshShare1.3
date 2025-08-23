// Production server.js - CommonJS version
require('dotenv/config');
const fastify = require('fastify');
const { Pool } = require('pg');

// Config
const PORT = Number(process.env.PORT || 8080);
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/freshshare';
console.log('Starting server on port:', PORT);
console.log('Using database URL (redacted):', DATABASE_URL.replace(/:\\/\\/[^:]+:[^@]+@/, '://***:***@'));

// Create app
const app = fastify({ 
  logger: true,
  trustProxy: true
});

// Basic health check endpoint
app.get('/health', async () => ({ ok: true }));

// Minimal parse-label endpoint
app.post('/parse-label', async (req, reply) => {
  const body = req.body || {};
  return { gtinCase: body.text?.slice(0, 14) || null };
});

// Minimal case-pack endpoint
app.get('/case-pack', async (req, reply) => {
  return { items: [] };
});

// Start server
app.listen({ port: PORT, host: '0.0.0.0' })
  .then(() => {
    console.log(`FreshShare backend listening on port ${PORT}`);
    // Create a status file to indicate successful startup
    require('fs').writeFileSync('.server_running', new Date().toISOString());
  })
  .catch((err) => { 
    console.error('Server startup error:', err); 
    process.exit(1); 
  });
