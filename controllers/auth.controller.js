const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.user;

// Retrieve JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET;

// Function to escape special characters for use in a regular expression
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with status and message
 */
exports.signup = async (req, res) => {
  try {
    console.log('Signup request received:', req.body);

    // Validate request body
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      address,
      city,
      zipCode,
    } = req.body;

    if (!username || !email || !password) {
      console.log('Signup validation failed - missing required fields:', {
        hasUsername: !!username,
        hasEmail: !!email,
        hasPassword: !!password,
      });
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required!',
      });
    }

    console.log('Checking for existing user with username or email:', {
      username,
      email,
    });

    try {
      // Check if user already exists - with detailed logging and case-insensitive comparison
      console.log(
        'Running User.findOne query with case-insensitive comparison...'
      );
      const sanitizedUsername = escapeRegExp(username);
      const sanitizedEmail = escapeRegExp(email);
      const existingUser = await User.findOne({
        $or: [
          {
            username: {
              $regex: new RegExp('^' + sanitizedUsername + '$', 'i'),
            },
          },
          { email: { $regex: new RegExp('^' + sanitizedEmail + '$', 'i') } },
        ],
      });
      console.log(
        'Query completed. Result:',
        existingUser ? 'User found' : 'No user found'
      );

      if (existingUser) {
        console.log('User already exists:', {
          existingUsername: existingUser.username,
          existingEmail: existingUser.email,
          existingId: existingUser._id,
        });

        // Check if this is a test environment and allow overwriting
        const isTestEnv =
          process.env.NODE_ENV === 'development' ||
          process.env.NODE_ENV === 'test';
        const forceOverwrite = req.body.forceOverwrite === true;

        if (isTestEnv && forceOverwrite) {
          console.log(
            'Test environment with force overwrite flag - deleting existing user'
          );
          await User.deleteOne({ _id: existingUser._id });
          console.log('Existing user deleted, proceeding with registration');
        } else {
          return res.status(400).json({
            success: false,
            message: 'Username or email is already in use!',
          });
        }
      }

      console.log(
        'No existing user found or user deleted, proceeding with registration'
      );
    } catch (findError) {
      console.error('Error checking for existing user:', findError);
      return res.status(500).json({
        success: false,
        message: 'Error checking for existing user',
        error: findError.message,
      });
    }

    // Create new user
    const hashedPassword = bcrypt.hashSync(password, 8);

    console.log('Creating new user:', {
      username,
      email,
      hasFirstName: !!firstName,
      hasLastName: !!lastName,
      hasAddress: !!address,
      hasCity: !!city,
      hasZipCode: !!zipCode,
    });

    const user = new User({
      username: username,
      email: email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      location: {
        street: address || '',
        city: city || '',
        zipCode: zipCode || '',
      },
    });

    // Save user to database
    console.log('Attempting to save user to database...');
    await user.save();
    console.log('User saved successfully with ID:', user._id);

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'User registered successfully!',
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration.',
      error: error.message,
    });
  }
};

/**
 * Authenticate a user and generate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with token and user info
 */
exports.login = async (req, res) => {
  try {
    // Validate request body
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required!',
      });
    }

    // Find user by username
    const user = await User.findOne({ username: username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found!',
      });
    }

    // Check password
    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password!',
      });
    }

    // Generate JWT token (expires in 24 hours)
    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: 86400, // 24 hours
    });

    // Set token as cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400000, // 24 hours in milliseconds
      path: '/', // Make cookie available for the entire domain
      sameSite: 'lax', // Less restrictive than 'strict' for better compatibility
    });

    // Create user object without password
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
      location: {
        street: user.location.street,
        city: user.location.city,
        state: user.state,
        zipCode: user.location.zipCode,
      },
      phoneNumber: user.phoneNumber,
      privacy: user.privacy || {},
      notifications: user.notifications || {},
    };

    // Return token and user info
    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token: token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login.',
      error: error.message,
    });
  }
};

/**
 * Get current user profile information
 * @param {Object} req - Express request object (with user attached from middleware)
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with user info
 */
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.userId; // Set by authJwt middleware

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found!',
      });
    }

    // Return user info without password
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        nickname: user.nickname,
        profileImage: user.profileImage,
        phoneNumber: user.phoneNumber,
        street: user.location.street,
        city: user.location.city,
        state: user.state,
        zipCode: user.location.zipCode,
        privacy: user.privacy || {},
        notifications: user.notifications || {},
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving user profile.',
      error: error.message,
    });
  }
};

/**
 * Update user profile information
 * @param {Object} req - Express request object (with user attached from middleware)
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with updated user info
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.userId; // Set by authJwt middleware

    // Get fields to update
    const { username, email, street, city, state, zipCode, phoneNumber } =
      req.body;

    // Check if username or email already in use by another user
    if (username || email) {
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        $or: [{ username: username }, { email: email }],
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username or email is already in use by another user!',
        });
      }
    }

    // Create update object
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (street) updateData.location.street = street;
    if (city) updateData.location.city = city;
    if (state) updateData.state = state;
    if (zipCode) updateData.location.zipCode = zipCode;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true } // Return updated user
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found!',
      });
    }

    // Return updated user info without password
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage,
        street: updatedUser.location.street,
        city: updatedUser.location.city,
        state: updatedUser.state,
        zipCode: updatedUser.location.zipCode,
        phoneNumber: updatedUser.phoneNumber,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating user profile.',
      error: error.message,
    });
  }
};
