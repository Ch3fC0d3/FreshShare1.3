/**
 * PostgreSQL Database Initialization Script for FreshShare
 *
 * This script initializes the PostgreSQL database schema for the Fastify backend.
 * It creates all necessary tables if they don't exist.
 */

const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// SQL statements to create tables
const createTableStatements = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Food packages table
  `CREATE TABLE IF NOT EXISTS food_packages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    expiry_date TIMESTAMP,
    location VARCHAR(255),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Categories table
  `CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
  )`,

  // Package categories (many-to-many relationship)
  `CREATE TABLE IF NOT EXISTS package_categories (
    package_id INTEGER REFERENCES food_packages(id),
    category_id INTEGER REFERENCES categories(id),
    PRIMARY KEY (package_id, category_id)
  )`,

  // Images table
  `CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    package_id INTEGER REFERENCES food_packages(id),
    image_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Reservations table
  `CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    package_id INTEGER REFERENCES food_packages(id),
    user_id INTEGER REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
];

// Insert default categories
const insertDefaultCategories = `
  INSERT INTO categories (name)
  VALUES 
    ('Fruits'), 
    ('Vegetables'), 
    ('Dairy'), 
    ('Bakery'), 
    ('Meat'), 
    ('Prepared Meals')
  ON CONFLICT (name) DO NOTHING;
`;

// Initialize database
async function initializeDatabase() {
  const client = await pool.connect();

  try {
    // Begin transaction
    await client.query('BEGIN');

    console.log('Creating tables...');

    // Create tables
    for (const statement of createTableStatements) {
      await client.query(statement);
    }

    // Insert default data
    console.log('Inserting default categories...');
    await client.query(insertDefaultCategories);

    // Commit transaction
    await client.query('COMMIT');

    console.log('Database initialization completed successfully!');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    // Release client back to pool
    client.release();
  }
}

// Run initialization
initializeDatabase()
  .then(() => {
    console.log('Database setup complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
