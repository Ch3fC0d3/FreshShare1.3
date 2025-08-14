// Test file to check if models can be loaded correctly
console.log('Starting model test...');

try {
  const db = require('./models');
  console.log('Models loaded successfully:');
  console.log('Available models:', Object.keys(db));
} catch (error) {
  console.error('Error loading models:');
  console.error(error);
}
