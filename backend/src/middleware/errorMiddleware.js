/**
 * Error Handling Middleware - Centralized error handling for the application
 * Follows Single Responsibility Principle - only handles error processing and responses
 */
class ErrorMiddleware {
  /**
   * Global error handler
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static handleError(err, req, res, next) {
    console.error('Error occurred:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    // Default error response
    let statusCode = 500;
    let message = 'Internal server error';
    let details = null;

    // Handle specific error types
    if (err.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation failed';
      details = err.details;
    } else if (err.message === 'Invalid credentials') {
      statusCode = 401;
      message = 'Invalid email or password';
    } else if (err.message === 'Email already registered') {
      statusCode = 409;
      message = 'Email is already registered';
    } else if (err.message === 'User not found') {
      statusCode = 404;
      message = 'User not found';
    } else if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid authentication token';
    } else if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Authentication token has expired';
    } else if (err.code === 'ER_DUP_ENTRY') {
      statusCode = 409;
      message = 'Email already exists';
    } else if (err.message.includes('Database')) {
      statusCode = 503;
      message = 'Database service unavailable';
    }

    const errorResponse = {
      success: false,
      error: message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        originalMessage: err.message 
      })
    };

    res.status(statusCode).json(errorResponse);
  }

  /**
   * 404 Not Found handler
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static handleNotFound(req, res) {
    res.status(404).json({
      success: false,
      error: `Route ${req.method} ${req.url} not found`
    });
  }

  /**
   * Async error wrapper - catches async errors and passes to error handler
   * @param {Function} fn - Async function to wrap
   * @returns {Function} Wrapped function
   */
  static asyncWrapper(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

module.exports = ErrorMiddleware; 