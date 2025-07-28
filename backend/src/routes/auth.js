const express = require('express');
const AuthController = require('../controllers/AuthController');
const AuthMiddleware = require('../middleware/authMiddleware');
const ValidationMiddleware = require('../middleware/validationMiddleware');

/**
 * Authentication Routes - RESTful authentication endpoints
 * Follows RESTful principles and includes proper middleware chain
 */
const router = express.Router();

// Public routes (no authentication required)
router.post('/register', 
  ValidationMiddleware.validateRegistration,
  AuthController.register
);

router.post('/login',
  ValidationMiddleware.validateLogin,
  AuthController.login
);

router.post('/refresh-token',
  AuthController.refreshToken
);

// Protected routes (authentication required)
router.post('/logout',
  AuthMiddleware.verifyToken,
  AuthController.logout
);

router.get('/me',
  AuthMiddleware.verifyToken,
  AuthController.getProfile
);

router.get('/check',
  AuthMiddleware.verifyToken,
  AuthController.checkAuth
);

module.exports = router; 