const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Database configuration following Single Responsibility Principle
 * Handles only database connection and pool management
 */
class DatabaseConfig {
  constructor() {
    this.pool = null;
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'db_monopoly_tracker',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000
    };
  }

  /**
   * Initialize database connection pool
   */
  async initialize() {
    try {
      this.pool = mysql.createPool(this.config);
      
      // Test connection
      const connection = await this.pool.getConnection();
      console.log('✅ Database connected successfully to:', this.config.database);
      connection.release();
      
      return this.pool;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Get database pool instance
   */
  getPool() {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  /**
   * Execute query with automatic connection handling
   */
  async query(sql, params = []) {
    try {
      // Initialize pool if it doesn't exist
      if (!this.pool) {
        await this.initialize();
      }
      
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('Database query error:', error.message);
      throw error;
    }
  }

  /**
   * Close database connections
   */
  async close() {
    if (this.pool && this.pool.end) {
      await this.pool.end();
      console.log('Database connections closed');
    }
  }
}

// Export singleton instance
const dbConfig = new DatabaseConfig();
module.exports = dbConfig; 