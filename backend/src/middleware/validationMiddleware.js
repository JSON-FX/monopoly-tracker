const Joi = require('joi');

/**
 * Validation Middleware - Validates request data using Joi schemas
 * Follows Single Responsibility Principle - only handles input validation
 */
class ValidationMiddleware {
  /**
   * Registration validation schema
   */
  static registrationSchema = Joi.object({
    firstName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .required()
      .messages({
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name cannot exceed 50 characters',
        'string.pattern.base': 'First name can only contain letters and spaces'
      }),
    
    middleName: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Middle name cannot exceed 50 characters',
        'string.pattern.base': 'Middle name can only contain letters and spaces'
      }),
    
    lastName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .required()
      .messages({
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name cannot exceed 50 characters',
        'string.pattern.base': 'Last name can only contain letters and spaces'
      }),
    
    email: Joi.string()
      .trim()
      .lowercase()
      .email()
      .max(100)
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': 'Email cannot exceed 100 characters'
      }),
    
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      }),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords do not match'
      })
  });

  /**
   * Login validation schema
   */
  static loginSchema = Joi.object({
    email: Joi.string()
      .trim()
      .lowercase()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required'
      })
  });

  /**
   * Generic validation middleware factory
   * @param {Joi.Schema} schema - Joi validation schema
   * @param {string} property - Request property to validate ('body', 'params', 'query')
   * @returns {Function} Express middleware function
   */
  static validate(schema, property = 'body') {
    return (req, res, next) => {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false, // Show all validation errors
        stripUnknown: true // Remove unknown fields
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
      }

      // Replace request property with validated/sanitized value
      req[property] = value;
      next();
    };
  }

  /**
   * Registration validation middleware
   */
  static validateRegistration = ValidationMiddleware.validate(ValidationMiddleware.registrationSchema);

  /**
   * Login validation middleware
   */
  static validateLogin = ValidationMiddleware.validate(ValidationMiddleware.loginSchema);
}

module.exports = ValidationMiddleware; 