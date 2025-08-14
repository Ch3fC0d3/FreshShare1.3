// Minimal server focused on dashboard functionality
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Connect to MongoDB
const dbConfig = require('./config/db.config');
const connectionURL = `mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`;

console.log('Attempting to connect to MongoDB...', connectionURL);

mongoose.connect(connectionURL, dbConfig.options)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    
    // Load models
    const db = require('./models');
    console.log('Models loaded successfully');
    
    // Load middleware
    const middleware = require('./middleware');
    console.log('Middleware loaded successfully');
    
    // Set up EJS
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
    
    // Basic authentication middleware for views
    app.use((req, res, next) => {
      // For this test, we'll skip authentication
      res.locals.user = { _id: 'test-user-id', username: 'testuser' };
      next();
    });
    
    // Dashboard route
    app.get('/dashboard', (req, res) => {
      res.render('pages/dashboard', { 
        title: 'FreshShare - Dashboard'
      });
    });
    
    // Dashboard API route
    const dashboardController = require('./controllers/dashboard.controller');
    app.get('/api/dashboard/data', (req, res) => {
      // For testing, we'll set a userId
      req.userId = 'test-user-id';
      dashboardController.getDashboardData(req, res);
    });
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Dashboard server is running on http://localhost:${PORT}`);
      console.log(`Visit http://localhost:${PORT}/dashboard to view the dashboard`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
