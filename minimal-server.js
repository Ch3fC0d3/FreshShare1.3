// Minimal server with only essential components
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Basic route
app.get('/', (req, res) => {
  res.send('Minimal server is working!');
});

// Dashboard page route (no authentication)
app.get('/dashboard', (req, res) => {
  res.render('pages/dashboard', { 
    title: 'FreshShare - Dashboard',
    user: { username: 'testuser' } // Mock user for testing
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Minimal server is running on http://localhost:${PORT}`);
});
