const express = require('express');
const router = express.Router();
const HotZoneController = require('../controllers/HotZoneController');

// Create controller instance
const hotZoneController = new HotZoneController();

/**
 * @route   POST /api/zones/shift-status
 * @desc    Analyze spin history and get hot zone shift status
 * @access  Public
 * @body    { spinHistory: ['1', '2', '1', ...] }
 */
router.post('/shift-status', hotZoneController.getShiftStatus);

/**
 * @route   GET /api/zones/shift-status
 * @desc    Analyze spin history from query params and get hot zone shift status  
 * @access  Public
 * @query   ?results=1,2,1,5,1,10,chance,2,1...
 */
router.get('/shift-status', hotZoneController.getShiftStatus);

/**
 * @route   GET /api/zones/info
 * @desc    Get zone mapping and configuration information
 * @access  Public
 */
router.get('/info', hotZoneController.getZoneInfo);

/**
 * @route   GET /api/zones/test
 * @desc    Get test analysis with sample data (development only)
 * @access  Public
 */
router.get('/test', hotZoneController.getTestAnalysis);

module.exports = router; 