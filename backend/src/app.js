const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const sessionRoutes = require('./routes/sessions');
const zonesRoutes = require('./routes/zones');
const ErrorMiddleware = require('./middleware/errorMiddleware');
const config = require('./config/environment');

/**
 * Express Application Setup
 * Configured with security middleware and routing
 */
class App {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Configure security and parsing middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration - allow all origins for development
    this.app.use(cors({
      origin: true, // Allow all origins for now
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      optionsSuccessStatus: 200 // For legacy browser support
    }));



    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging with CORS debugging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      console.log(`Origin: ${req.headers.origin || 'none'}`);
      console.log(`User-Agent: ${req.headers['user-agent'] ? req.headers['user-agent'].substring(0, 50) + '...' : 'none'}`);
      next();
    });
  }

  /**
   * Configure application routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        environment: config.server.nodeEnv
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/sessions', sessionRoutes);
    this.app.use('/api/zones', zonesRoutes);

    // 404 handler for unknown routes
    this.app.use('*', ErrorMiddleware.handleNotFound);
  }

  /**
   * Configure error handling
   */
  setupErrorHandling() {
    // Global error handler (must be last)
    this.app.use(ErrorMiddleware.handleError);
  }

  /**
   * Get Express app instance
   * @returns {Express} Express application
   */
  getApp() {
    return this.app;
  }
}

module.exports = new App().getApp(); 