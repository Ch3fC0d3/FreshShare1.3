// Test file to debug server startup issues
console.log('Starting server test...');

try {
  // Load core dependencies
  console.log('Loading express...');
  const express = require('express');
  const app = express();
  
  console.log('Loading models...');
  const db = require('./models');
  
  console.log('Loading middleware...');
  const middleware = require('./middleware');
  
  console.log('Loading routes...');
  // Try loading each route file individually
  try {
    console.log('Loading auth routes...');
    const authRoutes = require('./routes/auth.routes');
    console.log('Auth routes loaded successfully');
  } catch (error) {
    console.error('Error loading auth routes:', error.message);
  }
  
  try {
    console.log('Loading user routes...');
    const userRoutes = require('./routes/user.routes');
    console.log('User routes loaded successfully');
  } catch (error) {
    console.error('Error loading user routes:', error.message);
  }
  
  try {
    console.log('Loading dashboard routes...');
    const dashboardRoutes = require('./routes/dashboard.routes');
    console.log('Dashboard routes loaded successfully');
  } catch (error) {
    console.error('Error loading dashboard routes:', error.message);
  }
  
  try {
    console.log('Loading marketplace routes...');
    const marketplaceRoutes = require('./routes/marketplace.routes');
    console.log('Marketplace routes loaded successfully');
  } catch (error) {
    console.error('Error loading marketplace routes:', error.message);
  }
  
  try {
    console.log('Loading groups routes...');
    const groupsRoutes = require('./routes/groups.routes');
    console.log('Groups routes loaded successfully');
  } catch (error) {
    console.error('Error loading groups routes:', error.message);
  }
  
  try {
    console.log('Loading orders routes...');
    const ordersRoutes = require('./routes/orders.routes');
    console.log('Orders routes loaded successfully');
  } catch (error) {
    console.error('Error loading orders routes:', error.message);
  }
  
  console.log('All tests completed successfully');
} catch (error) {
  console.error('Error in server test:');
  console.error(error);
}
