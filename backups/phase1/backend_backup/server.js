const app = require('./src/app');
const dbConfig = require('./src/config/database');
const config = require('./src/config/environment');

/**
 * Server Entry Point
 * Initializes database and starts the Express server
 */
class Server {
  constructor() {
    this.server = null;
  }

  /**
   * Initialize and start the server
   */
  async start() {
    try {
      // Initialize database connection
      console.log('🔄 Initializing database connection...');
      await dbConfig.initialize();

      // Start HTTP server
      const port = config.server.port;
      this.server = app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
        console.log(`📍 Environment: ${config.server.nodeEnv}`);
        console.log(`🌐 Frontend URL: ${config.server.frontendUrl}`);
        console.log(`📊 Health check: http://localhost:${port}/health`);
        
        if (config.server.nodeEnv === 'development') {
          console.log(`🔧 API Base URL: http://localhost:${port}/api`);
          console.log('📝 Available routes:');
          console.log('   POST /api/auth/register - Register new user');
          console.log('   POST /api/auth/login - Login user');
          console.log('   POST /api/auth/logout - Logout user');
          console.log('   GET  /api/auth/me - Get user profile');
          console.log('   POST /api/auth/refresh-token - Refresh token');
        }
      });

      // Handle server errors
      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${port} is already in use`);
        } else {
          console.error('❌ Server error:', error);
        }
        process.exit(1);
      });

    } catch (error) {
      console.error('❌ Failed to start server:', error.message);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🔄 Shutting down server...');
    
    if (this.server) {
      await new Promise((resolve) => {
        this.server.close(resolve);
      });
      console.log('✅ HTTP server closed');
    }

    // Close database connections
    await dbConfig.close();
    console.log('✅ Database connections closed');
    
    console.log('👋 Server shutdown complete');
    process.exit(0);
  }
}

// Create and start server
const server = new Server();

// Handle process signals for graceful shutdown
process.on('SIGTERM', () => server.shutdown());
process.on('SIGINT', () => server.shutdown());

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  server.shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  server.shutdown();
});

// Start the server
server.start(); 