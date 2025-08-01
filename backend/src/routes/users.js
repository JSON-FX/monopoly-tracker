const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const SessionService = require('../services/SessionService');
const User = require('../models/User');
const { errorHandler } = require('../middleware/errorMiddleware');

// Create SessionService instance
const sessionService = new SessionService();

// Apply authentication middleware to all routes
router.use(AuthMiddleware.verifyToken);

/**
 * @route   DELETE /api/users/history
 * @desc    Clear all user history (sessions, results, chance events)
 * @access  Private
 */
router.delete('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    
    await sessionService.deleteUserHistory(userId);
    
    res.json({
      success: true,
      message: 'All history cleared successfully'
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear history',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/users/sessions/:id
 * @desc    Delete a specific session
 * @access  Private
 */
router.delete('/sessions/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = parseInt(req.params.id);
    
    if (!sessionId || isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID'
      });
    }
    
    await sessionService.deleteSession(userId, sessionId);
    
    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    const statusCode = error.message.includes('not found') || error.message.includes('access denied') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete session'
    });
  }
});

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', async (req, res) => {
  try {
    const user = req.user;
    
    // Remove sensitive information
    const { password_hash, ...profile } = user;
    
    res.json({
      success: true,
      user: profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/users/statistics
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/statistics', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const statistics = await SessionService.getUserStatistics(userId);
    
    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics',
      error: error.message
    });
  }
});

// Admin-only routes
/**
 * @route   GET /api/users/admin/all
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get('/admin/all', AuthMiddleware.verifyToken, adminMiddleware.requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll();
    
    res.json({
      success: true,
      users: users.map(user => user.toJSON())
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/users/admin/create
 * @desc    Create a new user (admin only)
 * @access  Private/Admin
 */
router.post('/admin/create', AuthMiddleware.verifyToken, adminMiddleware.requireAdmin, async (req, res) => {
  try {
    const { firstName, middleName, lastName, email, password, isAdmin } = req.body;
    
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email, password'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const newUser = await User.create({
      firstName,
      middleName,
      lastName,
      email,
      password,
      isAdmin: isAdmin || false
    });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: newUser.toJSON()
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/users/admin/:id
 * @desc    Delete a user and all their data (admin only)
 * @access  Private/Admin
 */
router.delete('/admin/:id', AuthMiddleware.verifyToken, adminMiddleware.requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete the user (cascade will handle sessions and related data)
    const deleted = await User.deleteById(userId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found or already deleted'
      });
    }
    
    res.json({
      success: true,
      message: `User ${user.firstName} ${user.lastName} and all their data deleted successfully`
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/users/admin/:id/role
 * @desc    Update user admin role (admin only)
 * @access  Private/Admin
 */
router.put('/admin/:id/role', AuthMiddleware.verifyToken, adminMiddleware.requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { isAdmin } = req.body;
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isAdmin must be a boolean value'
      });
    }

    // Prevent admin from removing their own admin access
    if (userId === req.user.id && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove admin access from your own account'
      });
    }

    const updated = await User.updateRole(userId, isAdmin);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: `User role updated successfully`
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/users/admin/:id/deactivate
 * @desc    Deactivate a user account (admin only)
 * @access  Private/Admin
 */
router.put('/admin/:id/deactivate', AuthMiddleware.verifyToken, adminMiddleware.requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Prevent admin from deactivating themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const updated = await User.deactivateUser(userId);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
      error: error.message
    });
  }
});

module.exports = router; 