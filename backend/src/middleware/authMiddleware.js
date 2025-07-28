const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/environment');

/**
 * Authentication Middleware - Validates JWT tokens and protects routes
 * Follows Single Responsibility Principle - only handles authentication verification
 */
class AuthMiddleware {
  /**
   * Verify JWT token and attach user to request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async verifyToken(req, res, next) {
    try {
      // Extract token from Authorization header
      const authHeader = req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Access denied. No token provided.'
        });
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Fetch user from database
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token or user inactive.'
        });
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token.'
        });
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired.'
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Authentication error.'
      });
    }
  }

  /**
   * Optional authentication - doesn't block if no token provided
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async optionalAuth(req, res, next) {
    try {
      const authHeader = req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(); // Continue without user
      }

      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
      }
      
      next();
    } catch (error) {
      // Ignore token errors for optional auth
      next();
    }
  }
}

module.exports = AuthMiddleware; 