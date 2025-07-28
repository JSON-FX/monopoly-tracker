const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/authMiddleware');
const SessionService = require('../services/SessionService');
const Session = require('../models/Session');
const GameResult = require('../models/GameResult');
const ChanceEvent = require('../models/ChanceEvent');

// Apply authentication middleware to all routes
router.use(AuthMiddleware.verifyToken);

/**
 * @route   GET /api/sessions
 * @desc    Get user's sessions (with pagination)
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const includeActive = req.query.includeActive !== 'false';
    
    const sessions = await Session.findByUserId(userId, includeActive);
    
    // Get results for each session if requested
    if (req.query.includeResults === 'true') {
      for (let session of sessions) {
        const results = await GameResult.findBySessionId(session.id);
        const chanceEvents = await ChanceEvent.findBySessionId(session.id);
        session.results = results.map(r => r.result_value);
        session.resultTimestamps = results.map(r => r.timestamp);
        session.chanceEvents = chanceEvents;
      }
    }
    
    res.json({
      success: true,
      sessions: sessions.slice(0, limit).map(s => s.toJSON())
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sessions',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/sessions
 * @desc    Create new session
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    // Debug logging for session creation
    console.log('Creating session for user:', req.user?.id);
    
    const userId = req.user.id;
    const { startingCapital, baseBet, currentCapital } = req.body;
    
    if (!startingCapital || !baseBet) {
      return res.status(400).json({
        success: false,
        message: 'Starting capital and base bet are required'
      });
    }
    
    // Create session data
    const sessionData = {
      userId,
      startingCapital: parseFloat(startingCapital),
      baseBet: parseFloat(baseBet),
      currentCapital: parseFloat(currentCapital || startingCapital)
    };
    
    const session = await Session.create({
      userId,
      startingCapital: parseFloat(startingCapital),
      baseBet: parseFloat(baseBet),
      currentCapital: parseFloat(currentCapital || startingCapital)
    });
    
    console.log('7. Session created successfully:', session.toJSON());
    
    res.status(201).json({
      success: true,
      session: session.toJSON(),
      message: 'Session created successfully'
    });
  } catch (error) {
    console.error('8. Create session error:', error);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to create session',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/sessions/active
 * @desc    Get active session for user
 * @access  Private
 */
router.get('/active', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const session = await Session.findActiveByUserId(userId);
    
    if (!session) {
      return res.json({
        success: true,
        session: null,
        message: 'No active session found'
      });
    }
    
    // Get results for active session
    const results = await GameResult.findBySessionId(session.id);
    const chanceEvents = await ChanceEvent.findBySessionId(session.id);
    
    const sessionData = session.toJSON();
    sessionData.results = results.map(r => r.result_value);
    sessionData.resultTimestamps = results.map(r => r.timestamp);
    sessionData.chanceEvents = chanceEvents;
    
    res.json({
      success: true,
      session: sessionData
    });
  } catch (error) {
    console.error('Get active session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active session',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/sessions/:id
 * @desc    Get specific session
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = parseInt(req.params.id);
    
    if (!sessionId || isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID'
      });
    }
    
    const session = await Session.findById(sessionId);
    
    if (!session || session.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }
    
    // Get results and chance events for session
    const results = await GameResult.findBySessionId(sessionId);
    const chanceEvents = await ChanceEvent.findBySessionId(sessionId);
    
    const sessionData = session.toJSON();
    sessionData.results = results.map(r => r.result_value);
    sessionData.resultTimestamps = results.map(r => r.timestamp);
    sessionData.chanceEvents = chanceEvents;
    
    res.json({
      success: true,
      session: sessionData
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/sessions/:id
 * @desc    Update session
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = parseInt(req.params.id);
    
    if (!sessionId || isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID'
      });
    }
    
    const session = await Session.findById(sessionId);
    
    if (!session || session.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }
    
    const updateData = req.body;
    await session.update(updateData);
    
    res.json({
      success: true,
      session: session.toJSON(),
      message: 'Session updated successfully'
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/sessions/:id/end
 * @desc    End session
 * @access  Private
 */
router.put('/:id/end', async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = parseInt(req.params.id);
    
    if (!sessionId || isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID'
      });
    }
    
    const session = await Session.findById(sessionId);
    
    if (!session || session.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }
    
    if (!session.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Session is already ended'
      });
    }
    
    const endData = req.body;
    await session.end(endData);
    
    res.json({
      success: true,
      session: session.toJSON(),
      message: 'Session ended successfully'
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end session',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/sessions/:id/results
 * @desc    Add result to session
 * @access  Private
 */
router.post('/:id/results', async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = parseInt(req.params.id);
    
    if (!sessionId || isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID'
      });
    }
    
    const session = await Session.findById(sessionId);
    
    if (!session || session.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }
    
    if (!session.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add results to inactive session'
      });
    }
    
    const { 
      resultValue, 
      betAmount, 
      won, 
      capitalAfter, 
      martingaleLevel,
      isMultiplier = false,
      chanceEvent 
    } = req.body;
    
    if (!resultValue) {
      return res.status(400).json({
        success: false,
        message: 'Result value is required'
      });
    }
    
    // Create game result
    const gameResult = await GameResult.create({
      sessionId,
      userId,
      resultValue,
      betAmount: parseFloat(betAmount),
      won: Boolean(won),
      capitalAfter: parseFloat(capitalAfter),
      martingaleLevel: parseInt(martingaleLevel) || 0,
      isMultiplier: Boolean(isMultiplier)
    });
    
    // Create chance event if provided
    let chanceEventResult = null;
    if (chanceEvent) {
      chanceEventResult = await ChanceEvent.create({
        sessionId,
        userId,
        gameResultId: gameResult.id,
        eventType: chanceEvent.eventType,
        cashAmount: chanceEvent.cashAmount ? parseFloat(chanceEvent.cashAmount) : null,
        multiplierValue: chanceEvent.multiplierValue ? parseFloat(chanceEvent.multiplierValue) : null,
        originalBetAmount: chanceEvent.originalBetAmount ? parseFloat(chanceEvent.originalBetAmount) : null
      });
    }
    
    // Update session current capital
    if (capitalAfter !== undefined) {
      await session.update({ currentCapital: parseFloat(capitalAfter) });
    }
    
    res.status(201).json({
      success: true,
      gameResult: gameResult.toJSON(),
      chanceEvent: chanceEventResult ? chanceEventResult.toJSON() : null,
      message: 'Result added successfully'
    });
  } catch (error) {
    console.error('Add result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add result',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/sessions/:id/results/last
 * @desc    Delete last result (undo)
 * @access  Private
 */
router.delete('/:id/results/last', async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = parseInt(req.params.id);
    
    if (!sessionId || isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID'
      });
    }
    
    const session = await Session.findById(sessionId);
    
    if (!session || session.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }
    
    // Get last result
    const results = await GameResult.findBySessionId(sessionId);
    
    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No results to undo'
      });
    }
    
    const lastResult = results[results.length - 1];
    
    // Delete the last result (this will also delete associated chance events)
    await GameResult.deleteById(lastResult.id);
    
    res.json({
      success: true,
      message: 'Last result deleted successfully'
    });
  } catch (error) {
    console.error('Delete last result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete last result',
      error: error.message
    });
  }
});

module.exports = router; 