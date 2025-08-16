// Update MongoDB Configuration Helper
// This script shows how to update the Express server config to use MongoDB Atlas

// 1. Original db.config.js structure (file to be modified)
/*
module.exports = {
  HOST: "127.0.0.1",
  PORT: 27017,
  DB: "freshshare_db",
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    autoIndex: true,
    maxPoolSize: 10,
    socketTimeoutMS: 45000,
    family: 4,
    retryWrites: true,
    w: "majority"
  }
};
*/

// 2. Modified connection approach for MongoDB Atlas
// Replace the contents of server.js where it connects to MongoDB with:

/*
// Load environment variables
require("dotenv").config();

// MongoDB connection setup - using MongoDB Atlas connection string
const uri = process.env.MONGODB_URI;
const dbOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  autoIndex: true,
  maxPoolSize: 10,
  socketTimeoutMS: 45000,
  family: 4,
  retryWrites: true,
  w: "majority"
};

// Connect to MongoDB Atlas
mongoose
  .connect(uri, dbOptions)
  .then(() => {
    console.log("Connected to MongoDB Atlas!");
    initial(); // Initialize roles if needed
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit(1);
  });
*/

// 3. Make sure your .env file contains:
// MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freshshare_db

console.log("To implement this change:");
console.log("1. Update server.js to use MONGODB_URI from environment variables");
console.log("2. Create a .env file with your MongoDB Atlas connection string");
console.log("3. Ensure dotenv package is installed (npm install dotenv)");
console.log("4. Test the connection before deploying");
