require('dotenv').config();

/**
 * Environment configuration and validation
 * Follows Single Responsibility Principle - handles only environment setup
 */
class EnvironmentConfig {
  constructor() {
    this.validateEnvironment();
  }

  /**
   * Validate required environment variables
   */
  validateEnvironment() {
    const required = [
      'DB_HOST',
      'DB_USER',
      'DB_NAME',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET'
    ];

    const missing = required.filter(key => {
      const value = process.env[key];
      return !value || value.trim() === '';
    });

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate JWT secret length
    if (process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    if (process.env.JWT_REFRESH_SECRET.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
    }
  }

  /**
   * Get database configuration
   */
  get database() {
    return {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '', // Allow empty password for local development
      database: process.env.DB_NAME
    };
  }

  /**
   * Get JWT configuration
   */
  get jwt() {
    return {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    };
  }

  /**
   * Get server configuration
   */
  get server() {
    return {
      port: parseInt(process.env.PORT) || 5001,
      nodeEnv: process.env.NODE_ENV || 'development',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    };
  }
}

// Export singleton instance
const envConfig = new EnvironmentConfig();
module.exports = envConfig; 