const { HotZoneOrchestrator } = require('./hotzone');

/**
 * Hot Zone Detection Service
 * Legacy wrapper around the new SOLID-compliant hot zone system
 * Maintains backward compatibility while using improved architecture
 */
class HotZoneService {
  constructor(options = {}) {
    // Initialize the new orchestrator with SOLID principles
    this.orchestrator = new HotZoneOrchestrator(options);
    
    // Expose legacy properties for backward compatibility
    this.MIN_SPINS_FOR_ANALYSIS = this.orchestrator.config.MIN_SPINS_FOR_ANALYSIS;
    this.ANALYSIS_WINDOW = this.orchestrator.config.ANALYSIS_WINDOW;
    this.ZONE_SEGMENT_MAP = this.orchestrator.zoneMapper.ZONE_SEGMENT_MAP;
    this.ZONE_DENSITY_MAP = this.orchestrator.zoneMapper.ZONE_DENSITY_MAP;
  }

  /**
   * Legacy method - delegates to new orchestrator
   * @param {string} result - Result from spin
   * @returns {number|null} - Segment index (0-53) or null if not mappable
   */
  resultToSegmentIndex(result) {
    return this.orchestrator.zoneMapper.resultToSegmentIndex(result);
  }

  /**
   * Legacy method - delegates to new orchestrator
   * @param {number} segmentIndex - Segment index (0-53)
   * @returns {string|null} - Zone letter (A-F) or null if invalid
   */
  getZoneForSegment(segmentIndex) {
    return this.orchestrator.zoneMapper.getZoneForSegment(segmentIndex);
  }

  /**
   * Legacy method - delegates to new orchestrator
   * @param {Array} recentResults - Array of recent spin results
   * @returns {Object} - Zone scores { A: score, B: score, ... }
   */
  calculateZoneScores(recentResults) {
    const hitCounts = this.orchestrator.scoreCalculator.calculateZoneHitCounts(recentResults);
    return this.orchestrator.scoreCalculator.calculateZoneScores(hitCounts);
  }

  /**
   * Legacy method - delegates to new orchestrator
   * @param {Object} zoneScores - Zone scores object
   * @returns {Object} - { zone: 'A', score: 12 }
   */
  getDominantZone(zoneScores) {
    const result = this.orchestrator.scoreCalculator.getDominantZone(zoneScores, this.ANALYSIS_WINDOW);
    return { zone: result.zone, score: result.score };
  }

  /**
   * Legacy method - delegates to new orchestrator
   * @param {Object} currentDominant - Current dominant zone info
   * @param {Object} previousDominant - Previous dominant zone info (can be null)
   * @param {Array} recentResults - Recent results for additional analysis
   * @returns {Object} - { status: 'Hot'|'Warming'|'Cooling'|'Cold', trendDirection: 'up'|'down'|'stable' }
   */
  classifyShift(currentDominant, previousDominant, recentResults) {
    const trendDirection = this.orchestrator.trendAnalyzer.calculateTrendDirection(currentDominant, previousDominant);
    const status = this.orchestrator.trendAnalyzer.classifyShiftStatus(currentDominant, trendDirection, null);
    return { status, trendDirection };
  }

  /**
   * Main analysis method - delegates to new orchestrator
   * @param {Array} spinHistory - Complete spin history
   * @returns {Object} - Analysis result or inactive status
   */
  analyzeShiftStatus(spinHistory) {
    return this.orchestrator.analyzeShiftStatus(spinHistory);
  }
}

module.exports = HotZoneService; 