/**
 * Hot Zone Detection Service
 * Analyzes Monopoly Live wheel spin patterns to detect directional shifts
 * Follows Single Responsibility Principle - only handles zone analysis logic
 */
class HotZoneService {
  constructor() {
    // Zone definitions - 54 segments divided into 6 equal zones (9 segments each)
    this.ZONE_SEGMENT_MAP = {
      A: { start: 0, end: 8 },    // Segments 0-8
      B: { start: 9, end: 17 },   // Segments 9-17  
      C: { start: 18, end: 26 },  // Segments 18-26
      D: { start: 27, end: 35 },  // Segments 27-35
      E: { start: 36, end: 44 },  // Segments 36-44
      F: { start: 45, end: 53 }   // Segments 45-53
    };

    // Zone density map - number of "1" segments in each zone
    this.ZONE_DENSITY_MAP = {
      A: 4,
      B: 3, 
      C: 4,
      D: 3,
      E: 4,
      F: 4
    };

    // Minimum spins required for analysis
    this.MIN_SPINS_FOR_ANALYSIS = 20;

    // Analysis window size (last N spins to analyze)
    this.ANALYSIS_WINDOW = 20;
  }

  /**
   * Convert result string to segment index
   * @param {string} result - Result from spin ('1', '2', '5', '10', 'chance', '2rolls', '4rolls')
   * @returns {number|null} - Segment index (0-53) or null if not mappable
   */
  resultToSegmentIndex(result) {
    // For this implementation, we'll use a simplified mapping
    // In a real system, you'd have actual segment positions for each result
    const resultSegmentMap = {
      '1': this._getRandomSegmentsForResult('1', 24), // 24 "1" segments distributed
      '2': this._getRandomSegmentsForResult('2', 13), // 13 "2" segments  
      '5': this._getRandomSegmentsForResult('5', 7),  // 7 "5" segments
      '10': this._getRandomSegmentsForResult('10', 4), // 4 "10" segments
      'chance': this._getRandomSegmentsForResult('chance', 2), // 2 chance segments
      '2rolls': this._getRandomSegmentsForResult('2rolls', 2), // 2 roll segments
      '4rolls': this._getRandomSegmentsForResult('4rolls', 2)  // 2 roll segments
    };

    if (!resultSegmentMap[result]) {
      return null;
    }

    // Return a random segment for this result type (simulating wheel position)
    const segments = resultSegmentMap[result];
    return segments[Math.floor(Math.random() * segments.length)];
  }

  /**
   * Helper to generate segment arrays for each result type
   * @private
   */
  _getRandomSegmentsForResult(resultType, count) {
    const segments = [];
    const usedSegments = new Set();
    
    while (segments.length < count) {
      const segment = Math.floor(Math.random() * 54);
      if (!usedSegments.has(segment)) {
        segments.push(segment);
        usedSegments.add(segment);
      }
    }
    
    return segments;
  }

  /**
   * Determine which zone a segment belongs to
   * @param {number} segmentIndex - Segment index (0-53)
   * @returns {string|null} - Zone letter (A-F) or null if invalid
   */
  getZoneForSegment(segmentIndex) {
    if (segmentIndex < 0 || segmentIndex > 53) {
      return null;
    }

    for (const [zone, range] of Object.entries(this.ZONE_SEGMENT_MAP)) {
      if (segmentIndex >= range.start && segmentIndex <= range.end) {
        return zone;
      }
    }

    return null;
  }

  /**
   * Calculate heat scores for all zones based on recent spins
   * @param {Array} recentResults - Array of recent spin results
   * @returns {Object} - Zone scores { A: score, B: score, ... }
   */
  calculateZoneScores(recentResults) {
    const zoneHitCounts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };

    // Count hits in each zone
    recentResults.forEach(result => {
      const segmentIndex = this.resultToSegmentIndex(result);
      if (segmentIndex !== null) {
        const zone = this.getZoneForSegment(segmentIndex);
        if (zone) {
          zoneHitCounts[zone]++;
        }
      }
    });

    // Calculate scores: hitCount * zoneDensity
    const zoneScores = {};
    Object.keys(zoneHitCounts).forEach(zone => {
      zoneScores[zone] = zoneHitCounts[zone] * this.ZONE_DENSITY_MAP[zone];
    });

    return zoneScores;
  }

  /**
   * Find the dominant zone (highest scoring zone)
   * @param {Object} zoneScores - Zone scores object
   * @returns {Object} - { zone: 'A', score: 12 }
   */
  getDominantZone(zoneScores) {
    let dominantZone = 'A';
    let highestScore = zoneScores.A;

    Object.entries(zoneScores).forEach(([zone, score]) => {
      if (score > highestScore) {
        dominantZone = zone;
        highestScore = score;
      }
    });

    return { zone: dominantZone, score: highestScore };
  }

  /**
   * Classify the current shift based on dominant zone and trends
   * @param {Object} currentDominant - Current dominant zone info
   * @param {Object} previousDominant - Previous dominant zone info (can be null)
   * @param {Array} recentResults - Recent results for additional analysis
   * @returns {Object} - { status: 'Hot'|'Warming'|'Cooling'|'Cold', trendDirection: 'up'|'down'|'stable' }
   */
  classifyShift(currentDominant, previousDominant, recentResults) {
    const zoneDensity = this.ZONE_DENSITY_MAP[currentDominant.zone];
    let status = 'Cold';
    let trendDirection = 'stable';

    // Determine trend direction
    if (previousDominant && previousDominant.zone === currentDominant.zone) {
      if (currentDominant.score > previousDominant.score) {
        trendDirection = 'up';
      } else if (currentDominant.score < previousDominant.score) {
        trendDirection = 'down';
      }
    } else if (previousDominant) {
      // Zone changed - compare densities to determine if improving or declining
      const previousDensity = this.ZONE_DENSITY_MAP[previousDominant.zone];
      trendDirection = zoneDensity > previousDensity ? 'up' : 'down';
    }

    // Classification logic based on score and density
    const normalizedScore = currentDominant.score / this.ANALYSIS_WINDOW; // Score per spin

    if (normalizedScore >= 3 && zoneDensity >= 4) {
      status = 'Hot';
    } else if (normalizedScore >= 2 && zoneDensity >= 3 && trendDirection === 'up') {
      status = 'Warming';
    } else if (normalizedScore < 1.5 || trendDirection === 'down') {
      status = 'Cooling';
    } else {
      status = 'Cold';
    }

    return { status, trendDirection };
  }

  /**
   * Main analysis method - analyzes spin history and returns shift status
   * @param {Array} spinHistory - Complete spin history
   * @returns {Object} - Analysis result or inactive status
   */
  analyzeShiftStatus(spinHistory) {
    // Check if we have enough data
    if (!spinHistory || spinHistory.length < this.MIN_SPINS_FOR_ANALYSIS) {
      return {
        isActive: false,
        message: `Need at least ${this.MIN_SPINS_FOR_ANALYSIS} spins for analysis`,
        currentSpins: spinHistory ? spinHistory.length : 0
      };
    }

    // Get recent results for analysis
    const recentResults = spinHistory.slice(-this.ANALYSIS_WINDOW);
    const previousResults = spinHistory.length > this.ANALYSIS_WINDOW 
      ? spinHistory.slice(-(this.ANALYSIS_WINDOW * 2), -this.ANALYSIS_WINDOW)
      : null;

    // Calculate current zone scores
    const currentZoneScores = this.calculateZoneScores(recentResults);
    const currentDominant = this.getDominantZone(currentZoneScores);

    // Calculate previous zone scores for trend analysis
    let previousDominant = null;
    if (previousResults) {
      const previousZoneScores = this.calculateZoneScores(previousResults);
      previousDominant = this.getDominantZone(previousZoneScores);
    }

    // Classify the shift
    const classification = this.classifyShift(currentDominant, previousDominant, recentResults);

    return {
      isActive: true,
      status: classification.status,
      dominantZone: currentDominant.zone,
      score: currentDominant.score,
      trendDirection: classification.trendDirection,
      zoneScores: currentZoneScores,
      analysisWindow: this.ANALYSIS_WINDOW,
      totalSpins: spinHistory.length
    };
  }
}

module.exports = HotZoneService; 