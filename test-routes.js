const express = require('express');
const app = express();
const PORT = 3002; // Use a different port to avoid conflict

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Basic routes for testing
app.get('/', (req, res) => {
  res.json({ message: 'Root path works!' });
});

app.post('/signup', (req, res) => {
  res.json({ message: 'Signup endpoint works!' });
});

app.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint works!' });
});

app.post('/api/auth/signup', (req, res) => {
  res.json({ message: 'API auth signup endpoint works!' });
});

app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'API auth login endpoint works!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET  /');
  console.log('- POST /signup');
  console.log('- POST /login');
  console.log('- POST /api/auth/signup');
  console.log('- POST /api/auth/login');
  console.log('Use curl or Postman to test these endpoints');
});
