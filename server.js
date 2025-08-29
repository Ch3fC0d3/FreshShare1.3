const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const config = require('./config/auth.config');
require('dotenv').config();
const { createProxyMiddleware } = require('http-proxy-middleware');
const authJwt = require('./middleware/authJwt');
const querystring = require('querystring');
const fetch = require('node-fetch');

// Configure base URL for deployment in subdirectories
// Convert '/' to empty string for root deployment
const BASE_URL = process.env.BASE_URL === '/' ? '' : (process.env.BASE_URL || '');

// Custom error logging to a public file
const logErrorToFile = (error) => {
  try {
    const logFilePath = path.join(__dirname, 'public', 'startup_error.log');
    const errorMessage = `[${new Date().toISOString()}] ERROR: ${error.stack || error}\n\n`;
    const fs = require('fs');
    fs.appendFileSync(logFilePath, errorMessage);
  } catch (e) {
    console.error('Failed to write to custom log file:', e);
  }
};

process.on('uncaughtException', (err, origin) => {
  console.error(`Caught exception: ${err}\n` + `Exception origin: ${origin}`);
  logErrorToFile(err);
  process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 3001;

// Set global template variables
app.locals.baseUrl = BASE_URL;
app.locals.title = 'FreshShare';

// Database configuration
const dbConfig = require('./config/db.config');

// Get MongoDB connection URL and options from config
const connectionURL = dbConfig.getUri();
const mongooseOptions = {
  ...dbConfig.options,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 30000,
  heartbeatFrequencyMS: 30000,
  keepAlive: true,
  keepAliveInitialDelay: 300000
};

// Track MongoDB connection state
let isMongoConnected = false;
let connectionAttempts = 0;
const maxAttempts = 5;
const retryDelay = 5000;

// Log connection details (safely)
const safeUrl = connectionURL.replace(/:[^:@]+@/, ':***@');
console.log('MongoDB connection details:', {
  url: safeUrl,
  database: dbConfig.DB,
  ssl: mongooseOptions.ssl,
  environment: process.env.NODE_ENV
});

// Handle MongoDB connection state changes
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established');
  isMongoConnected = true;
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB connection lost');
  isMongoConnected = false;
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  logErrorToFile(err);
  isMongoConnected = false;
});

// Graceful shutdown handler
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  });
});

// Connect with retries using exponential backoff
async function connectWithRetry() {
  const baseDelay = 1000; // Start with 1 second
  const maxDelay = 30000; // Max 30 seconds between retries

  while (connectionAttempts < maxAttempts) {
    connectionAttempts++;
    try {
      console.log(`MongoDB connection attempt ${connectionAttempts}/${maxAttempts}...`);
      await mongoose.connect(connectionURL, mongooseOptions);
      console.log('Successfully connected to MongoDB');
      isMongoConnected = true;
      initializeDatabase();
      
      // Reset connection state listeners
      mongoose.connection.on('disconnected', async () => {
        console.log('MongoDB connection lost - attempting reconnection...');
        isMongoConnected = false;
        connectionAttempts = 0; // Reset attempts for reconnection
        await connectWithRetry();
      });
      
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${connectionAttempts} failed:`, err.message);
      logErrorToFile(err);
      
      if (connectionAttempts < maxAttempts) {
        // Calculate delay with exponential backoff and jitter
        const exponentialDelay = Math.min(
          maxDelay,
          baseDelay * Math.pow(2, connectionAttempts - 1)
        );
        const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
        const delay = exponentialDelay + jitter;
        
        console.log(`Retrying in ${Math.round(delay/1000)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('All MongoDB connection attempts failed - running in fallback mode');
        break;
      }
    }
  }
}

connectWithRetry();

// Define CORS options
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
};

// Configure Express middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files first
app.use(express.static(path.join(__dirname, 'public')));

// Add middleware to check MongoDB connection
app.use((req, res, next) => {
  // Skip MongoDB check for static files, base URL fix script, and health check
  if (req.path.startsWith('/css/') || 
      req.path.startsWith('/js/') || 
      req.path.startsWith('/images/') || 
      req.path === '/js/base-url-fix.js' ||
      req.path === '/favicon.ico' ||
      req.path === '/health') {
    return next();
  }

  // For API routes, return 503 if MongoDB is down
  if (req.path.startsWith('/api/') && !isMongoConnected) {
    return res.status(503).json({
      success: false,
      message: 'Database service temporarily unavailable'
    });
  }

  // For page routes, show maintenance page if MongoDB is down
  if (!isMongoConnected) {
    return res.render('pages/maintenance', {
      title: 'FreshShare - Maintenance',
      baseUrl: BASE_URL,
      error: 'Database connection is currently unavailable. Please try again later.'
    });
  }

  next();
});

// Initialize database with better error handling
async function initializeDatabase() {
  try {
    // First check if we can query the database
    const isConnected = mongoose.connection.readyState === 1;
    if (!isConnected) {
      throw new Error('Cannot initialize database - MongoDB not connected');
    }

    const db = require('./models');
    const Role = db.role;
    
    // Check if roles exist
    const count = await Role.estimatedDocumentCount();
    
    if (count === 0) {
      await Promise.all([
        new Role({ name: "user" }).save(),
        new Role({ name: "moderator" }).save(),
        new Role({ name: "admin" }).save()
      ]);
      console.log('Added roles to database');
    }
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Content Security Policy middleware - Must be applied before serving static files
app.use((req, res, next) => {
  // In development, allow 'unsafe-eval' for easier debugging
  // In production, this should be more restrictive
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.googleapis.com; img-src 'self' data: blob:; font-src 'self' data: https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.gstatic.com; connect-src 'self';"
  );
  
  // Also add legacy headers for older browsers
  res.setHeader(
    'X-Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );
  
  next();
});

// CSP violation reporting endpoint
app.post('/csp-violation', (req, res) => {
  if (req.body) {
    console.log('CSP Violation:', req.body);
  } else {
    console.log('CSP Violation: No data received');
  }
  res.status(204).end();
});

// Set explicit MIME types and serve static files
// Prioritize public over public_html for consolidated directory approach
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
  }
}));
// Fallback to public_html for backward compatibility
app.use(express.static(path.join(__dirname, 'public_html'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
  }
}));
app.use(cookieParser());

// Reverse proxy to Fastify backend (secured)
const FASTIFY_BACKEND_URL = process.env.FASTIFY_BACKEND_URL || 'http://localhost:8080';
app.use(
  '/api/pack',
  authJwt.verifyToken,
  createProxyMiddleware({
    target: FASTIFY_BACKEND_URL,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: { '^/api/pack': '' },
    onProxyReq: (proxyReq, req, res) => {
      // If body was parsed by express.json/urlencoded, re-send it to the target
      if (!req.body || !Object.keys(req.body).length) return;
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const bodyData = querystring.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      if (!res.headersSent) {
        res.status(502).json({ success: false, message: 'Upstream service unavailable' });
      }
    }
  })
);

// CSP middleware moved above before static file serving

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body,
    headers: req.headers,
    mongoConnected: isMongoConnected
  });

  // Log error to file
  logErrorToFile({
    timestamp: new Date().toISOString(),
    error: err.message,
    stack: err.stack,
    request: {
      path: req.path,
      method: req.method,
      query: req.query,
      headers: req.headers
    },
    mongoConnected: isMongoConnected
  });

  // Handle database connection errors
  if (!isMongoConnected || err.name === 'MongoError' || err.name === 'MongooseError') {
    if (req.accepts('html')) {
      return res.status(503).sendFile(path.join(__dirname, 'public', '503.html'));
    } else {
      return res.status(503).json({
        success: false,
        message: 'Database service temporarily unavailable'
      });
    }
  }

  // Default error response
  if (req.accepts('html')) {
    res.status(500).sendFile(path.join(__dirname, 'public', '503.html'));
  } else {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Ensure uploads directory exists
const fs = require('fs');
const uploadDir = path.join(__dirname, 'public/uploads/marketplace');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/layout');

// Authentication middleware for views
app.use(async (req, res, next) => {
  try {
    // Get token from various sources
    const token = req.headers.authorization?.split(' ')[1] || 
                 req.cookies?.token || 
                 req.query?.token;

    if (token) {
      try {
        // Verify token using the same secret as in auth.controller.js
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'freshShare-auth-secret');
        const User = require('./models/user.model');
        const user = await User.findById(decoded.id).select('-password');
        
        if (user) {
          // Add user data to locals for all views
          res.locals.user = user;
          console.log('User authenticated:', user.username, 'ID:', user._id); // Enhanced debug log
        } else {
          console.log('Token valid but user not found in database');
          res.clearCookie('token'); // Clear token if user doesn't exist
        }
      } catch (err) {
        console.error('Token verification failed:', err);
        res.clearCookie('token'); // Clear invalid token
      }
    } else {
      console.log('No authentication token found');
    }
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    next();
  }
});

// API Routes with error handling
const wrapAsync = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Auth routes (both pages and API)
const authRoutes = require('./routes/auth.routes');

// Mount auth routes at root for page routes
app.use('/', authRoutes);

// Mount auth routes at /api for API routes
app.use('/api', authRoutes);

// Additional routes
require('./routes/user.routes')(app);
require('./routes/dashboard.routes')(app);

// Other API routes
app.use('/api/marketplace', require('./routes/marketplace.routes'));
app.use('/api/groups', require('./routes/groups.routes'));
app.use('/api/orders', require('./routes/orders.routes'));
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const mongoState = mongoose.connection.readyState;
    const mongoStatus = {
      connected: mongoState === 1,
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoState] || 'unknown',
      lastError: mongoose.connection.lastError?.message
    };

    // Check Fastify backend
    let fastifyStatus = { connected: false, error: null };
    try {
      const fastifyResponse = await fetch(`${FASTIFY_BACKEND_URL}/health`, {
        timeout: 5000
      });
      fastifyStatus.connected = fastifyResponse.ok;
    } catch (err) {
      fastifyStatus.error = err.message;
    }

    // Check system resources
    const systemStatus = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };

    // Determine overall status
    const isHealthy = mongoStatus.connected && fastifyStatus.connected;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus,
        fastify: fastifyStatus
      },
      system: systemStatus
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Page Routes
app.get('/', (req, res) => {
  res.render('pages/index', { 
    title: 'FreshShare - Home',
    baseUrl: BASE_URL
  });
});

app.get('/marketplace', (req, res) => {
  res.render('pages/marketplace', { 
    title: 'FreshShare - Marketplace',
    baseUrl: BASE_URL
  });
});

app.get('/create-listing', (req, res) => {
  res.render('pages/create-listing', { 
    title: 'FreshShare - Create Listing',
    baseUrl: BASE_URL
  });
});

app.get('/forum', (req, res) => {
  res.render('pages/forum', { 
    title: 'FreshShare - Forum',
    baseUrl: BASE_URL
  });
});

app.get('/groups', (req, res) => {
  res.render('pages/groups', { 
    title: 'FreshShare - Groups',
    baseUrl: BASE_URL
  });
});

app.get('/create-group', (req, res) => {
  res.render('pages/create-group', { 
    title: 'FreshShare - Create New Group',
    baseUrl: BASE_URL
  });
});

app.get('/group-details', (req, res) => {
  res.render('pages/group-details', { 
    title: 'FreshShare - Group Details',
    groupId: req.query.id,
    baseUrl: BASE_URL
  });
});

app.get('/groups/:id/shopping', (req, res) => {
  res.render('pages/group_shopping', { 
    title: 'FreshShare - Group Shopping',
    groupId: req.params.id,
    baseUrl: BASE_URL
  });
});

app.get('/groups/:id/orders', (req, res) => {
  res.render('pages/group_orders', { 
    title: 'FreshShare - Group Orders',
    groupId: req.params.id,
    baseUrl: BASE_URL
  });
});

app.get('/orders/:id', (req, res) => {
  res.render('pages/order_details', { 
    title: 'FreshShare - Order Details',
    orderId: req.params.id,
    baseUrl: BASE_URL
  });
});

app.get('/about', (req, res) => {
  res.render('pages/about', { 
    title: 'FreshShare - About',
    baseUrl: BASE_URL
  });
});

app.get('/contact', (req, res) => {
  res.render('pages/contact', { 
    title: 'FreshShare - Contact',
    baseUrl: BASE_URL
  });
});

app.get('/profile', async (req, res) => {
  try {
    // Check if user is logged in
    if (!res.locals.user) {
      console.log('Profile access attempted without authentication, redirecting to login');
      return res.redirect('/login?redirect=/profile&error=' + encodeURIComponent('Please log in to view your profile'));
    }

    // User is logged in, use their data
    const userData = res.locals.user;
    console.log(`Rendering profile page for user: ${userData.username} (${userData._id})`);

    // Add debug information
    console.log('User data available:', {
      id: userData._id,
      username: userData.username,
      email: userData.email
    });

    // Ensure userData is properly formatted for the template
    const formattedUserData = {
      _id: userData._id,
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      profileImage: userData.profileImage || '/assets/images/avatar-placeholder.jpg',
      location: {
        street: userData.location?.street || '',
        city: userData.location?.city || '',
        state: userData.location?.state || '',
        zipCode: userData.location?.zipCode || ''
      },
      phoneNumber: userData.phoneNumber || ''
    };

    // Render the profile page with the user data
    res.render('pages/profile', {
      title: 'FreshShare - Profile',
      user: formattedUserData,
      baseUrl: BASE_URL
    });
  } catch (error) {
    console.error('Profile page error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load profile page: ' + error.message
    });
  }
});

app.get('/profile-edit', async (req, res) => {
  try {
    // Check if user is logged in
    if (!res.locals.user) {
      return res.redirect('/login');
    }
    
    // Use the user data from locals
    const userData = res.locals.user;

    res.render('pages/profile-edit', {
      title: 'FreshShare - Edit Profile',
      user: userData,
      baseUrl: BASE_URL
    });
  } catch (error) {
    console.error('Profile edit page error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load profile edit page'
    });
  }
});

app.get('/dashboard', (req, res) => {
  // Always render dashboard; client will fetch data and handle auth redirects
  res.render('pages/dashboard', { 
    title: 'FreshShare - Dashboard',
    baseUrl: BASE_URL
  });
});

app.get('/login', (req, res) => {
  if (res.locals.user) {
    return res.redirect('/dashboard');
  }
  res.render('pages/login', { 
    title: 'FreshShare - Login',
    baseUrl: BASE_URL
  });
});

app.get('/signup', (req, res) => {
  if (res.locals.user) {
    return res.redirect('/dashboard');
  }
  res.render('pages/signup', { 
    title: 'FreshShare - Sign Up',
    baseUrl: BASE_URL
  });
});

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
