# FreshShare 503 Error - Solution Guide

## Root Cause Analysis

The 503 Service Unavailable error in the FreshShare application is occurring due to:

1. **Missing Fastify backend service** - The Express server is attempting to proxy requests to a Fastify backend that is not running
2. **Configuration mismatch** - Port and URL configuration between Express proxy and Fastify backend don't align
3. **Missing environment variables** - Both services require specific environment variables to operate

## Configuration Requirements

### Express Server (Root directory)
```javascript
// config-temp.js
process.env.MONGODB_HOST = 'mongodb+srv://localhost:27017';
process.env.MONGODB_DB = 'FreshShareDB';
process.env.PORT = '3001';
process.env.JWT_SECRET = 'freshshare-secret-key';
process.env.FASTIFY_BACKEND_URL = 'http://localhost:8080';
```

### Fastify Backend (fastify-backend directory)
```javascript
// config-temp.js
process.env.PORT = '8080'; 
process.env.DATABASE_URL = 'postgres://localhost:5432/freshshare';
```

## Steps to Fix the 503 Error

1. **Start the Fastify backend first**:
   ```bash
   cd fastify-backend
   npm install fastify@4 pg zod dotenv
   npm install -D ts-node typescript @types/node
   node -r ./config-temp.js server.ts
   # OR if using TypeScript
   npx ts-node -r ./config-temp.js server.ts
   ```

2. **Then start the Express server in a separate terminal**:
   ```bash
   # In the root directory
   npm install express express-ejs-layouts cors mongoose cookie-parser jsonwebtoken http-proxy-middleware dotenv
   node -r ./config-temp.js proxy-server.js
   # OR for full server
   node -r ./config-temp.js server.js
   ```

3. **Verify connectivity**:
   - Test Fastify backend directly: http://localhost:8080/health
   - Test Express proxy: http://localhost:3001/api/pack/test

## Alternative Quick Solution

If you're still experiencing issues with the TypeScript Fastify backend, use the mock server:

```bash
# Start the mock backend
node mock-fastify-server.js

# In another terminal, start the proxy server
node -r ./config-temp.js proxy-server.js
```

## Long-term Fixes

1. Create proper `.env` files in both root and fastify-backend directories
2. Fix TypeScript configuration in the Fastify backend
3. Document the proper startup sequence in README.md
4. Ensure consistent port configuration across all services
