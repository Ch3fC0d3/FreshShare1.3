// Temporary configuration for Express server
// Using MongoDB Atlas connection string instead of local MongoDB
process.env.MONGODB_URI = 'mongodb+srv://freshshare_user:password@cluster0.mongodb.net/FreshShareDB';
// Keep the DB name separate for flexibility
process.env.MONGODB_DB = 'FreshShareDB';
process.env.PORT = '3001';
process.env.JWT_SECRET = 'freshshare-secret-key';

// Important: In memory proxy-server.js defaults to 8088 but server.js expects 8080
// Setting both to ensure compatibility
process.env.FASTIFY_BACKEND_URL = 'http://localhost:8080';

console.log('Temporary configuration loaded with MongoDB Atlas');

// NOTE: Replace the placeholder MongoDB Atlas connection string above with your actual connection string
// Format: mongodb+srv://<username>:<password>@<cluster-url>/<database>
