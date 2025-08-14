// Debug server startup with better error handling
try {
  // Load core dependencies
  console.log('Loading express...');
  const express = require('express');
  const app = express();
  const path = require('path');
  const cors = require('cors');
  const cookieParser = require('cookie-parser');
  
  // Middleware
  console.log('Setting up middleware...');
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(cookieParser());
  
  // Load routes one by one with error handling
  console.log('Loading auth routes...');
  try {
    const authRoutes = require('./routes/auth.routes');
    app.use('/', authRoutes);
    console.log('Auth routes loaded successfully');
  } catch (error) {
    console.error('Error loading auth routes:', error);
  }
  
  console.log('Loading user routes...');
  try {
    require('./routes/user.routes')(app);
    console.log('User routes loaded successfully');
  } catch (error) {
    console.error('Error loading user routes:', error);
  }
  
  console.log('Loading dashboard routes...');
  try {
    require('./routes/dashboard.routes')(app);
    console.log('Dashboard routes loaded successfully');
  } catch (error) {
    console.error('Error loading dashboard routes:', error);
  }
  
  console.log('Loading marketplace routes...');
  try {
    app.use('/api/marketplace', require('./routes/marketplace.routes'));
    console.log('Marketplace routes loaded successfully');
  } catch (error) {
    console.error('Error loading marketplace routes:', error);
  }
  
  console.log('Loading groups routes...');
  try {
    app.use('/api/groups', require('./routes/groups.routes'));
    console.log('Groups routes loaded successfully');
  } catch (error) {
    console.error('Error loading groups routes:', error);
  }
  
  console.log('Loading orders routes...');
  try {
    app.use('/api/orders', require('./routes/orders.routes'));
    console.log('Orders routes loaded successfully');
  } catch (error) {
    console.error('Error loading orders routes:', error);
  }
  
  // Start server
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
} catch (error) {
  console.error('Fatal error during server startup:');
  console.error(error);
}
