const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const SessionService = require('../services/SessionService');
const { errorHandler } = require('../middleware/errorMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   DELETE /api/users/history
 * @desc    Clear all user history (sessions, results, chance events)
 * @access  Private
 */
router.delete('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    
    await SessionService.deleteUserHistory(userId);
    
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
    
    await SessionService.deleteSession(userId, sessionId);
    
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

module.exports = router; 