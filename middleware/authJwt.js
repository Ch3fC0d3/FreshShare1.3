const jwt = require('jsonwebtoken');
const db = require('../models');

const User = db.user;

// Retrieve JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET;

const getTokenFromRequest = (req) => {
  const getHeaderCaseInsensitive = (headers, headerName) => {
    const headerKeys = Object.keys(headers);
    const key = headerKeys.find(
      (k) => k.toLowerCase() === headerName.toLowerCase()
    );
    return key ? headers[key] : null;
  };

  const token =
    getHeaderCaseInsensitive(req.headers, 'x-access-token') ||
    getHeaderCaseInsensitive(req.headers, 'authorization') ||
    req.cookies?.token;

  if (token && token.startsWith('Bearer ')) {
    return token.slice(7);
  }
  return token;
};

const verifyToken = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(403).json({
        success: false,
        message: 'No token provided!',
      });
    }
    return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized! Token is invalid or expired.',
      });
    }
    res.clearCookie('token');
    return res.redirect(
      `/login?redirect=${encodeURIComponent(
        req.originalUrl
      )}&error=${encodeURIComponent(
        'Your session has expired. Please log in again.'
      )}`
    );
  }
};

const optionalAuth = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.id;
    } catch (error) {
      // Ignore error for optional authentication
      console.error('Optional auth token verification failed:', error.message);
    }
  }
  next();
};

const isAuthenticated = async (req, res, next) => {
  if (!req.userId) {
    // This should not happen if verifyToken is used before this middleware
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({
          success: false,
          message: 'User not found!',
        });
      }
      res.clearCookie('token');
      return res.redirect(
        `/login?error=${encodeURIComponent(
          'User account not found. Please log in again.'
        )}`
      );
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while authenticating user.',
      error: error.message,
    });
  }
};

const isAdmin = async (req, res, next) => {
  if (!req.user) {
    // This should not happen if isAuthenticated is used before this middleware
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (req.user.roles && req.user.roles.includes('admin')) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Requires Admin Role!',
  });
};

const isModerator = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (req.user.roles && req.user.roles.includes('moderator')) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Requires Moderator Role!',
  });
};

const isModeratorOrAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (
    req.user.roles &&
    (req.user.roles.includes('moderator') || req.user.roles.includes('admin'))
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Requires Moderator or Admin Role!',
  });
};

const authJwt = {
  verifyToken,
  optionalAuth,
  isAuthenticated,
  isAdmin,
  isModerator,
  isModeratorOrAdmin,
};

module.exports = authJwt;
