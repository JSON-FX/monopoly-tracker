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
    // Ensure boolean conversion for MySQL TINYINT fields
    this.isAdmin = Boolean(userData.isAdmin !== undefined ? userData.isAdmin : userData.is_admin);
    this.isActive = Boolean(userData.isActive !== undefined ? userData.isActive : userData.is_active);
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
        INSERT INTO users (first_name, middle_name, last_name, initials, email, password_hash, is_admin)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [firstName, middleName || null, lastName, initials, email, passwordHash, userData.isAdmin || false]);

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
        isAdmin: userData.is_admin,
        isActive: userData.is_active,
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

  static async findAll() {
    try {
      const result = await User.query('SELECT * FROM users ORDER BY created_at DESC');
      return result.map(userData => new User(userData));
    } catch (error) {
      console.error('User findAll error:', error);
      throw new Error('Failed to find users: ' + error.message);
    }
  }

  static async deleteById(userId) {
    try {
      // Delete user and cascade to sessions, game_results, and chance_events
      const result = await User.query('DELETE FROM users WHERE id = ?', [userId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('User deleteById error:', error);
      throw new Error('Failed to delete user: ' + error.message);
    }
  }

  static async updateRole(userId, isAdmin) {
    try {
      await User.query(
        'UPDATE users SET is_admin = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [isAdmin, userId]
      );
      return true;
    } catch (error) {
      console.error('User updateRole error:', error);
      throw new Error('Failed to update user role: ' + error.message);
    }
  }

  static async deactivateUser(userId) {
    try {
      await User.query(
        'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );
      return true;
    } catch (error) {
      console.error('User deactivateUser error:', error);
      throw new Error('Failed to deactivate user: ' + error.message);
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
      firstName: this.firstName,
      middleName: this.middleName,
      lastName: this.lastName,
      initials: this.initials,
      email: this.email,
      isAdmin: this.isAdmin,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLogin: this.lastLogin
    };
  }
}

module.exports = User; 