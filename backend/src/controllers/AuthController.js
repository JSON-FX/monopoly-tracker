const AuthService = require('../services/AuthService');
const ErrorMiddleware = require('../middleware/errorMiddleware');

/**
 * Authentication Controller - Handles authentication HTTP requests
 * Follows Single Responsibility Principle - only handles authentication HTTP logic
 */
class AuthController {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static register = ErrorMiddleware.asyncWrapper(async (req, res) => {
    const { firstName, middleName, lastName, email, password } = req.body;

    const result = await AuthService.register({
      firstName,
      middleName,
      lastName,
      email,
      password
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  });

  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static login = ErrorMiddleware.asyncWrapper(async (req, res) => {
    const { email, password } = req.body;

    const result = await AuthService.login(email, password);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  });

  /**
   * Logout user (client-side token removal)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static logout = ErrorMiddleware.asyncWrapper(async (req, res) => {
    // In a stateless JWT system, logout is handled client-side
    // Server could maintain a blacklist for enhanced security
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  });

  /**
   * Refresh authentication token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static refreshToken = ErrorMiddleware.asyncWrapper(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const result = await AuthService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  });

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static getProfile = ErrorMiddleware.asyncWrapper(async (req, res) => {
    // User is attached to req by auth middleware
    const userProfile = req.user.getProfile();

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user: userProfile }
    });
  });

  /**
   * Check authentication status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static checkAuth = ErrorMiddleware.asyncWrapper(async (req, res) => {
    // If this endpoint is reached, user is authenticated (auth middleware passed)
    res.status(200).json({
      success: true,
      message: 'User is authenticated',
      data: {
        authenticated: true,
        user: req.user.getProfile()
      }
    });
  });
}

module.exports = AuthController; 