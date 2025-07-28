const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/environment');

/**
 * Authentication Service - Handles authentication business logic
 * Follows Single Responsibility Principle - only handles authentication operations
 */
class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - Registration data
   * @returns {Object} User data and tokens
   */
  async register(userData) {
    const { firstName, middleName, lastName, email, password } = userData;

    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Generate initials
    const initials = this.generateInitials(firstName, middleName, lastName);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      firstName,
      middleName: middleName || null,
      lastName,
      initials,
      email,
      passwordHash
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    return {
      user: user.getProfile(),
      ...tokens
    };
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} User data and tokens
   */
  async login(email, password) {
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate tokens
    const tokens = this.generateTokens(user);

    return {
      user: user.getProfile(),
      ...tokens
    };
  }

  /**
   * Refresh JWT token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} New tokens
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new Error('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Generate initials from names
   * @param {string} firstName - First name
   * @param {string} middleName - Middle name (optional)
   * @param {string} lastName - Last name
   * @returns {string} Formatted initials (e.g., "J.R.A" or "J.A")
   */
  generateInitials(firstName, middleName, lastName) {
    const initials = [
      firstName?.charAt(0)?.toUpperCase(),
      middleName ? middleName.charAt(0).toUpperCase() : null,
      lastName?.charAt(0)?.toUpperCase()
    ].filter(Boolean).join('.');

    return initials;
  }

  /**
   * Generate JWT tokens
   * @param {User} user - User instance
   * @returns {Object} Access and refresh tokens
   */
  generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      initials: user.initials
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwt.expiresIn
    };
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Get user profile by token
   * @param {string} token - JWT token
   * @returns {Object} User profile
   */
  async getProfile(token) {
    const decoded = this.verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user.getProfile();
  }
}

module.exports = new AuthService(); 