const HotZoneService = require('../services/HotZoneService');
const ErrorMiddleware = require('../middleware/errorMiddleware');

/**
 * Hot Zone Controller
 * Handles HTTP requests for hot zone detection and analysis
 * Follows Single Responsibility Principle - only handles HTTP layer concerns
 */
class HotZoneController {
  constructor() {
    this.hotZoneService = new HotZoneService();
  }

  /**
   * Get current hot zone shift status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getShiftStatus = ErrorMiddleware.asyncWrapper(async (req, res) => {
    // Extract spin history from request body or query params
    const { spinHistory } = req.body || {};
    
    // Alternative: get from query params if GET request
    let history = spinHistory;
    if (!history && req.query.results) {
      try {
        // Parse results from comma-separated query string
        history = req.query.results.split(',').map(r => r.trim());
      } catch (error) {
        throw new Error('Invalid results format in query parameters');
      }
    }

    // Validate input
    if (!history) {
      return res.status(400).json({
        success: false,
        error: 'Spin history is required',
        details: 'Provide spinHistory in request body or results in query parameters'
      });
    }

    if (!Array.isArray(history)) {
      return res.status(400).json({
        success: false,
        error: 'Spin history must be an array',
        details: 'spinHistory should be an array of result strings'
      });
    }

    // Debug logging
    console.log('🔥 Backend Debug - Received history:', history);
    console.log('🔥 Backend Debug - History length:', history.length);
    console.log('🔥 Backend Debug - Sample items:', history.slice(0, 5));

    // Analyze the spin history
    const analysis = this.hotZoneService.analyzeShiftStatus(history);
    console.log('🔥 Backend Debug - Analysis result:', analysis);

    // Return appropriate response based on analysis
    if (!analysis.isActive) {
      return res.status(200).json({
        success: true,
        active: false,
        message: analysis.message,
        currentSpins: analysis.currentSpins,
        requiredSpins: this.hotZoneService.MIN_SPINS_FOR_ANALYSIS
      });
    }

    // Return active analysis results
    res.status(200).json({
      success: true,
      active: true,
      data: {
        status: analysis.status,
        dominantZone: analysis.dominantZone,
        score: analysis.score,
        trendDirection: analysis.trendDirection,
        zoneScores: analysis.zoneScores,
        analysisWindow: analysis.analysisWindow,
        totalSpins: analysis.totalSpins
      }
    });
  });

  /**
   * Get zone mapping information
   * @param {Object} req - Express request object  
   * @param {Object} res - Express response object
   */
  getZoneInfo = ErrorMiddleware.asyncWrapper(async (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        zoneSegmentMap: this.hotZoneService.ZONE_SEGMENT_MAP,
        zoneDensityMap: this.hotZoneService.ZONE_DENSITY_MAP,
        minSpinsRequired: this.hotZoneService.MIN_SPINS_FOR_ANALYSIS,
        analysisWindow: this.hotZoneService.ANALYSIS_WINDOW
      }
    });
  });

  /**
   * Test endpoint for development - generates sample analysis
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getTestAnalysis = ErrorMiddleware.asyncWrapper(async (req, res) => {
    // Generate sample spin history for testing
    const sampleResults = ['1', '2', '1', '5', '1', '10', '1', 'chance', '1', '2', 
                          '1', '5', '1', '2', '1', '10', '1', '1', '2', '1', 
                          '5', '1', '1', '2', '1'];
    
    const analysis = this.hotZoneService.analyzeShiftStatus(sampleResults);

    res.status(200).json({
      success: true,
      message: 'Test analysis generated with sample data',
      sampleData: sampleResults,
      analysis: analysis
    });
  });
}

module.exports = HotZoneController; 