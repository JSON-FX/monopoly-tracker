const DatabaseConfig = require('../config/database');

class User {
  constructor(userData) {
    // Handle both snake_case (from database) and camelCase (from input) property names
    this.id = userData.id;
    this.firstName = userData.firstName || userData.first_name;
    this.middleName = userData.middleName || userData.middle_name;
    this.lastName = userData.lastName || userData.last_name;
    this.initials = userData.initials;
    this.email = userData.email;
    this.passwordHash = userData.passwordHash || userData.password_hash; // Handle both formats
    this.isActive = userData.isActive !== undefined ? userData.isActive : userData.is_active;
    this.createdAt = userData.createdAt || userData.created_at;
    this.updatedAt = userData.updatedAt || userData.updated_at;
  }

  static async query(sql, params = []) {
    return await DatabaseConfig.query(sql, params);
  }

  static async create(userData) {
    try {
      const {
        firstName,
        middleName,
        lastName,
        email,
        password
      } = userData;

      // Validate required fields
      if (!firstName || !lastName || !email || !password) {
        throw new Error('Missing required fields: firstName, lastName, email, password');
      }

      // Auto-generate initials
      const initials = User.generateInitials(firstName, middleName, lastName);

      // Hash password with proper parameters
      const bcrypt = require('bcryptjs');
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const result = await User.query(`
        INSERT INTO users (first_name, middle_name, last_name, initials, email, password_hash)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [firstName, middleName || null, lastName, initials, email, passwordHash]);

      const userId = result.insertId;

      const newUser = new User({
        id: userId,
        firstName,
        middleName,
        lastName,
        initials,
        email,
        passwordHash
      });

      return newUser;
    } catch (error) {
      console.error('User create error:', error);
      throw new Error('Failed to create user: ' + error.message);
    }
  }

  static async findById(userId) {
    try {
      const result = await User.query(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (result && result.length > 0) {
        return new User(result[0]);
      }

      return null;
    } catch (error) {
      console.error('User findById error:', error);
      throw new Error('Failed to find user: ' + error.message);
    }
  }

  static async findByEmail(email) {
    try {
      const result = await User.query('SELECT * FROM users WHERE email = ?', [email]);
      
      if (result.length === 0) {
        return null;
      }

      const userData = result[0];
      return new User({
        id: userData.id,
        firstName: userData.first_name,
        middleName: userData.middle_name,
        lastName: userData.last_name,
        initials: userData.initials,
        email: userData.email,
        passwordHash: userData.password_hash, // Make sure this is included
        createdAt: userData.created_at,
        updatedAt: userData.updated_at
      });
    } catch (error) {
      console.error('User findByEmail error:', error);
      throw new Error('Failed to find user by email: ' + error.message);
    }
  }

  static async emailExists(email) {
    try {
      const user = await User.findByEmail(email);
      return !!user;
    } catch (error) {
      console.error('User emailExists error:', error);
      return false; // Don't throw to allow registration
    }
  }

  static async updateLastLogin(userId) {
    try {
      await User.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );
      return true;
    } catch (error) {
      console.error('User updateLastLogin error:', error);
      return false; // Don't throw for non-critical operation
    }
  }

  static generateInitials(firstName, middleName, lastName) {
    const initials = [
      firstName ? firstName[0].toUpperCase() : '',
      middleName ? middleName[0].toUpperCase() : '',
      lastName ? lastName[0].toUpperCase() : ''
    ].filter(Boolean).join('.');

    return initials;
  }

  toJSON() {
    return {
      id: this.id,
      firstName: this.first_name,
      middleName: this.middle_name,
      lastName: this.last_name,
      initials: this.initials,
      email: this.email,
      createdAt: this.created_at,
      updatedAt: this.updated_at,
      isActive: this.is_active,
      lastLogin: this.last_login
    };
  }
}

module.exports = User; 