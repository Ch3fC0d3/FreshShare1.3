// Test file to check if config files can be loaded correctly
console.log('Starting config test...');

try {
  console.log('Loading auth.config.js...');
  const authConfig = require('./config/auth.config');
  console.log('auth.config.js loaded successfully:', authConfig);
  
  console.log('Loading db.config.js...');
  const dbConfig = require('./config/db.config');
  console.log('db.config.js loaded successfully:', dbConfig);
  
  console.log('Loading db.init.js...');
  const dbInit = require('./config/db.init');
  console.log('db.init.js loaded successfully');
  
  console.log('All config files loaded successfully');
} catch (error) {
  console.error('Error loading config files:');
  console.error(error);
}
