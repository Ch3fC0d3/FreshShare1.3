const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authJwt } = require('../middleware');

const signupValidation = [
  check('username', 'Username is required').not().isEmpty(),
  check('username', 'Username must be at least 3 characters long').isLength({ min: 3 }),
  check('username', 'Username must be alphanumeric').isAlphanumeric(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').not().isEmpty(),
  check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
];

const loginValidation = [
  check('username', 'Username is required').not().isEmpty(),
  check('password', 'Password is required').not().isEmpty(),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Authentication Routes
 */

// Page routes
router.get('/login', (req, res) => {
  res.render('pages/login', {
    title: 'FreshShare - Login',
  });
});

router.get('/signup', (req, res) => {
  res.render('pages/signup', {
    title: 'FreshShare - Sign Up',
  });
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

// API routes
// Register a new user
router.post(
  '/api/auth/signup',
  signupValidation,
  handleValidationErrors,
  authController.signup
);

// Login a user
router.post(
  '/api/auth/login',
  loginValidation,
  handleValidationErrors,
  authController.login
);

// Get user profile (protected route)
router.get(
  '/api/auth/profile',
  [authJwt.verifyToken],
  authController.getUserProfile
);

// Update user profile (protected route)
router.put(
  '/api/auth/profile',
  [authJwt.verifyToken],
  authController.updateUserProfile
);

// Duplicate routes with relative paths for proper API mounting
// Register a new user
router.post('/signup', signupValidation, handleValidationErrors, authController.signup);

// Login a user
router.post('/login', loginValidation, handleValidationErrors, authController.login);

// Get user profile (protected route)
router.get('/profile', [authJwt.verifyToken], authController.getUserProfile);

// Update user profile (protected route)
router.put('/profile', [authJwt.verifyToken], authController.updateUserProfile);

module.exports = router;
