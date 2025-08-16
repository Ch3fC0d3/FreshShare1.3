// Proxy-only Express server to forward /api/pack/* to Fastify backend without MongoDB dependency
const express = require('express');
const cookieParser = require('cookie-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authJwt = require('./middleware/authJwt');
const querystring = require('querystring');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;
const FASTIFY_BACKEND_URL = process.env.FASTIFY_BACKEND_URL || 'http://localhost:8089';

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Simple request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Reverse proxy to Fastify backend (secured)
app.use(
  '/api/pack',
  authJwt.verifyToken,
  createProxyMiddleware({
    target: FASTIFY_BACKEND_URL,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: { '^/api/pack': '' },
    onProxyReq: (proxyReq, req, res) => {
      if (!req.body || !Object.keys(req.body).length) return;
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const bodyData = querystring.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      if (!res.headersSent) {
        res.status(502).json({ success: false, message: 'Upstream service unavailable' });
      }
    }
  })
);

app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Proxy server running', target: FASTIFY_BACKEND_URL });
});

app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
  console.log(`Forwarding /api/pack/* -> ${FASTIFY_BACKEND_URL}`);
});
