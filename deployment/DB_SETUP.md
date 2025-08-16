# Database Setup for FreshShare Deployment

## MongoDB Setup (Express Server)

1. **Create a MongoDB Database**:
   - Log in to cPanel
   - Navigate to the "Databases" section
   - Click on "MongoDB Databases"
   - Create a new database named `freshshare_db`
   - Create a new user with a strong password
   - Add the user to the database with all privileges

2. **Configure Connection String**:
   - In your Express server's `.env` file, update the MongoDB connection:
   ```
   MONGODB_HOST=your_cpanel_mongodb_host
   MONGODB_DB=freshshare_db
   MONGODB_USER=your_mongodb_user
   MONGODB_PASSWORD=your_mongodb_password
   ```

3. **Initialize MongoDB Collections**:
   - After deployment, run the seed script to create initial data:
   ```
   node seed.js
   ```

## PostgreSQL Setup (Fastify Backend)

1. **Create a PostgreSQL Database**:
   - Log in to cPanel
   - Navigate to the "Databases" section
   - Click on "PostgreSQL Databases"
   - Create a new database named `freshshare`
   - Create a new user with a strong password
   - Grant all privileges to the user

2. **Configure Connection String**:
   - In your Fastify backend's `.env` file, update the PostgreSQL connection:
   ```
   DATABASE_URL=postgres://username:password@localhost:5432/freshshare
   ```
   - Replace `username`, `password` with your PostgreSQL credentials
   - The hostname may need to be updated based on your specific Namecheap configuration

3. **Initialize PostgreSQL Tables**:
   - The Fastify backend should automatically create tables on first run
   - If you need to manually initialize, you can run any SQL scripts you have
