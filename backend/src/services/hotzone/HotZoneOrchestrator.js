const ZoneMapper = require('./ZoneMapper');
const ZoneScoreCalculator = require('./ZoneScoreCalculator');
const TrendAnalyzer = require('./TrendAnalyzer');

/**
 * Hot Zone Orchestrator - Coordinates all hot zone analysis components
 * Follows Dependency Inversion Principle - depends on abstractions, not implementations
 * Follows Open/Closed Principle - open for extension, closed for modification
 */
class HotZoneOrchestrator {
  constructor(options = {}) {
    // Configuration
    this.config = {
      MIN_SPINS_FOR_ANALYSIS: options.minSpinsForAnalysis || 20,
      ANALYSIS_WINDOW: options.analysisWindow || 20,
      ENABLE_AUTO_SKIP_SUGGESTIONS: options.enableAutoSkipSuggestions !== false,
      ...options
    };

    // Initialize components following Dependency Injection pattern
    this.zoneMapper = options.zoneMapper || new ZoneMapper();
    this.scoreCalculator = options.scoreCalculator || new ZoneScoreCalculator(this.zoneMapper);
    this.trendAnalyzer = options.trendAnalyzer || new TrendAnalyzer(this.zoneMapper);
  }

  /**
   * Main analysis method - orchestrates all components
   * @param {Array} spinHistory - Complete spin history
   * @returns {Object} - Complete analysis result or inactive status
   */
  analyzeShiftStatus(spinHistory) {
    try {
      // Validate input
      const validationResult = this._validateInput(spinHistory);
      if (!validationResult.isValid) {
        return validationResult.result;
      }

      // Prepare data windows
      const dataWindows = this._prepareDataWindows(spinHistory);
      
      // Calculate current zone analysis
      const currentAnalysis = this._analyzeCurrentWindow(dataWindows.current);
      
      // Calculate previous zone analysis for trend comparison
      const previousAnalysis = dataWindows.previous ? 
        this._analyzeCurrentWindow(dataWindows.previous) : null;

      // Perform trend analysis
      const trendAnalysis = this.trendAnalyzer.analyzeShift(
        currentAnalysis.dominantZone,
        previousAnalysis?.dominantZone || null,
        currentAnalysis.statistics
      );

      // Build complete result
      const result = this._buildAnalysisResult(
        currentAnalysis,
        trendAnalysis,
        spinHistory.length
      );

      // Add auto-skip suggestions if enabled
      if (this.config.ENABLE_AUTO_SKIP_SUGGESTIONS) {
        result.autoSkipSuggestions = this._generateAutoSkipSuggestions(trendAnalysis);
      }

      return result;

    } catch (error) {
      return {
        isActive: false,
        error: true,
        message: `Analysis failed: ${error.message}`,
        currentSpins: spinHistory ? spinHistory.length : 0
      };
    }
  }

  /**
   * Get zone configuration information
   * @returns {Object} - Zone configuration data
   */
  getZoneConfiguration() {
    return {
      zoneSegmentMap: this.zoneMapper.ZONE_SEGMENT_MAP,
      zoneDensityMap: this.zoneMapper.ZONE_DENSITY_MAP,
      minSpinsRequired: this.config.MIN_SPINS_FOR_ANALYSIS,
      analysisWindow: this.config.ANALYSIS_WINDOW,
      thresholds: this.trendAnalyzer.THRESHOLDS
    };
  }

  /**
   * Validate and filter spin history
   * @param {Array} spinHistory - Raw spin history
   * @returns {Array} - Validated and filtered spin history
   */
  validateAndFilterSpinHistory(spinHistory) {
    if (!Array.isArray(spinHistory)) {
      return [];
    }

    return spinHistory.filter(result => 
      result != null && this.zoneMapper.isValidResult(result.toString())
    );
  }

  /**
   * Get analysis summary for debugging
   * @param {Array} spinHistory - Spin history
   * @returns {Object} - Analysis summary
   */
  getAnalysisSummary(spinHistory) {
    const analysis = this.analyzeShiftStatus(spinHistory);
    
    if (!analysis.isActive) {
      return analysis;
    }

    return {
      isActive: analysis.isActive,
      status: analysis.status,
      dominantZone: analysis.dominantZone,
      trendDirection: analysis.trendDirection,
      confidence: analysis.confidence,
      totalSpins: analysis.totalSpins,
      analysisWindow: this.config.ANALYSIS_WINDOW,
      recommendation: analysis.recommendation
    };
  }

  // Private helper methods

  /**
   * Validate input data
   * @private
   */
  _validateInput(spinHistory) {
    if (!spinHistory || !Array.isArray(spinHistory)) {
      return {
        isValid: false,
        result: {
          isActive: false,
          error: true,
          message: 'Invalid spin history: must be an array',
          currentSpins: 0
        }
      };
    }

    const validResults = this.validateAndFilterSpinHistory(spinHistory);
    
    if (validResults.length < this.config.MIN_SPINS_FOR_ANALYSIS) {
      return {
        isValid: false,
        result: {
          isActive: false,
          message: `Need at least ${this.config.MIN_SPINS_FOR_ANALYSIS} valid spins for analysis`,
          currentSpins: validResults.length,
          requiredSpins: this.config.MIN_SPINS_FOR_ANALYSIS
        }
      };
    }

    return { isValid: true, validResults };
  }

  /**
   * Prepare data windows for analysis
   * @private
   */
  _prepareDataWindows(spinHistory) {
    const validResults = this.validateAndFilterSpinHistory(spinHistory);
    
    const current = validResults.slice(-this.config.ANALYSIS_WINDOW);
    const previous = validResults.length > this.config.ANALYSIS_WINDOW ? 
      validResults.slice(-(this.config.ANALYSIS_WINDOW * 2), -this.config.ANALYSIS_WINDOW) : 
      null;

    return { current, previous, total: validResults };
  }

  /**
   * Analyze a single data window
   * @private
   */
  _analyzeCurrentWindow(windowData) {
    const hitCounts = this.scoreCalculator.calculateZoneHitCounts(windowData);
    const zoneScores = this.scoreCalculator.calculateZoneScores(hitCounts);
    const dominantZone = this.scoreCalculator.getDominantZone(zoneScores, this.config.ANALYSIS_WINDOW);
    const ranking = this.scoreCalculator.getZoneRanking(zoneScores, this.config.ANALYSIS_WINDOW);
    const statistics = this.scoreCalculator.getZoneScoreStatistics(zoneScores, this.config.ANALYSIS_WINDOW);

    return {
      hitCounts,
      zoneScores,
      dominantZone,
      ranking,
      statistics
    };
  }

  /**
   * Build the final analysis result
   * @private
   */
  _buildAnalysisResult(currentAnalysis, trendAnalysis, totalSpins) {
    return {
      isActive: true,
      status: trendAnalysis.status,
      dominantZone: trendAnalysis.dominantZone,
      score: trendAnalysis.score,
      normalizedScore: trendAnalysis.normalizedScore,
      trendDirection: trendAnalysis.trendDirection,
      confidence: trendAnalysis.confidence,
      action: trendAnalysis.action,
      recommendation: trendAnalysis.recommendation,
      shouldSkipBet: trendAnalysis.shouldSkipBet,
      
      // Detailed data
      zoneScores: currentAnalysis.zoneScores,
      zoneRanking: currentAnalysis.ranking,
      statistics: currentAnalysis.statistics,
      
      // Metadata
      analysisWindow: this.config.ANALYSIS_WINDOW,
      totalSpins: totalSpins,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate auto-skip suggestions
   * @private
   */
  _generateAutoSkipSuggestions(trendAnalysis) {
    const { status, confidence } = trendAnalysis;
    
    return {
      shouldEnableSkipBet: this.trendAnalyzer.shouldAutoEnableSkipBet(status, confidence),
      shouldDisableSkipBet: this.trendAnalyzer.shouldAutoDisableSkipBet(status, confidence),
      enableMessage: status === 'Cold' || status === 'Cooling' ? 
        `Recommend enabling Skip Bet: Zone is ${status}` : null,
      disableMessage: status === 'Hot' || status === 'Warming' ? 
        `Recommend disabling Skip Bet: Zone is ${status}` : null
    };
  }
}

module.exports = HotZoneOrchestrator; 