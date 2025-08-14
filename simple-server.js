// Simplified server.js to debug startup issues
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
    
    // Load routes one by one
    console.log('Loading routes...');
    
    // Auth routes
    const authRoutes = require('./routes/auth.routes');
    app.use('/', authRoutes);
    console.log('Auth routes loaded');
    
    // User routes
    require('./routes/user.routes')(app);
    console.log('User routes loaded');
    
    // Dashboard routes
    require('./routes/dashboard.routes')(app);
    console.log('Dashboard routes loaded');
    
    // Marketplace routes
    app.use('/api/marketplace', require('./routes/marketplace.routes'));
    console.log('Marketplace routes loaded');
    
    // Groups routes
    app.use('/api/groups', require('./routes/groups.routes'));
    console.log('Groups routes loaded');
    
    // Orders routes
    app.use('/api/orders', require('./routes/orders.routes'));
    console.log('Orders routes loaded');
    
    // Basic route for testing
    app.get('/api/test', (req, res) => {
      res.json({ message: "Server is working!" });
    });
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
