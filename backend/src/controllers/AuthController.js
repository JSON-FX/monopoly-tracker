const AuthService = require('../services/AuthService');
const ErrorMiddleware = require('../middleware/errorMiddleware');

/**
 * Authentication Controller - Handles auth-related HTTP requests
 * Follows Single Responsibility Principle
 */
class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  register = ErrorMiddleware.asyncWrapper(async (req, res) => {
    const { firstName, middleName, lastName, email, password } = req.body;

    const result = await this.authService.register({
      firstName,
      middleName,
      lastName,
      email,
      password
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      ...result
    });
  });

  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  login = ErrorMiddleware.asyncWrapper(async (req, res) => {
    const { email, password } = req.body;

    const result = await this.authService.login(email, password);

    res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      ...result
    });
  });

  /**
   * Refresh token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  refreshToken = ErrorMiddleware.asyncWrapper(async (req, res) => {
    const { refreshToken } = req.body;

    const result = await this.authService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      ...result
    });
  });

  /**
   * Get user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getProfile = ErrorMiddleware.asyncWrapper(async (req, res) => {
    // User is already attached by authMiddleware
    const user = req.user;

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        initials: user.initials,
        email: user.email,
        isAdmin: user.isAdmin,
        isActive: user.isActive
      }
    });
  });
}

module.exports = AuthController; 