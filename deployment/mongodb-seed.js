// MongoDB Seed Script for FreshShare Express Server
// This script creates initial data for the MongoDB database

// Connect to MongoDB
// In production, you would adjust the connection string
// to match your Namecheap hosting MongoDB configuration
db = db.getSiblingDB('freshshare_db');

// Create roles collection if it doesn't exist
if (!db.getCollectionNames().includes('roles')) {
  db.createCollection('roles');
  
  // Insert roles
  db.roles.insertMany([
    { name: "user" },
    { name: "admin" },
    { name: "moderator" }
  ]);
  
  print("Roles collection created and populated");
}

// Create users collection with hashed passwords
// Note: In production, you should create a proper admin user with a secure password
if (!db.getCollectionNames().includes('users')) {
  db.createCollection('users');
  
  // Using bcrypt hash for password "password123" - in production use a secure password
  // This hash represents "password123" 
  const passwordHash = "$2a$10$m4FJm8yDnAcAUl6Qww9qAuqWsJCkXa8rI/fZP6NXGkBGBPH2wHaZi";
  
  // Insert admin user
  db.users.insertOne({
    username: "admin",
    email: "admin@freshshare.com",
    password: passwordHash,
    roles: ["admin", "user"],
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  print("Users collection created with admin account");
}

// Create groups collection
if (!db.getCollectionNames().includes('groups')) {
  db.createCollection('groups');
  
  // Insert sample groups
  db.groups.insertMany([
    {
      name: "Local Community Group",
      description: "A group for local community members to share food",
      location: "Local Area",
      createdBy: "admin",
      members: ["admin"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "University Food Share",
      description: "Food sharing group for university students",
      location: "University Campus",
      createdBy: "admin",
      members: ["admin"],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  
  print("Groups collection created with sample groups");
}

// Create marketplace listings
if (!db.getCollectionNames().includes('marketplacelistings')) {
  db.createCollection('marketplacelistings');
  
  // Insert sample listings
  db.marketplacelistings.insertMany([
    {
      title: "Fresh Vegetables",
      description: "Assorted fresh vegetables from local farm",
      price: 10.00,
      category: "produce",
      location: "Local Market",
      seller: "admin",
      images: ["vegetables.jpg"],
      available: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Homemade Bread",
      description: "Freshly baked sourdough bread",
      price: 5.50,
      category: "bakery",
      location: "Home Kitchen",
      seller: "admin",
      images: ["bread.jpg"],
      available: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  
  print("Marketplace listings collection created with sample listings");
}

print("MongoDB seed script completed successfully");
