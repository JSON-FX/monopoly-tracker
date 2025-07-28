const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const validationMiddleware = require('../middleware/validationMiddleware');

// Create controller instance
const authController = new AuthController();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  validationMiddleware.validateRegistration,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  validationMiddleware.validateLogin,
  authController.login
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT token
 * @access  Public
 */
router.post('/refresh-token',
  authController.refreshToken
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private (requires token in Authorization header)
 */
router.get('/profile',
  authController.getProfile
);

module.exports = router; 