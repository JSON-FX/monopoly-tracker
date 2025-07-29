/**
 * Zone Score Calculator - Handles zone score calculations
 * Follows Single Responsibility Principle - only handles scoring logic
 */
class ZoneScoreCalculator {
  constructor(zoneMapper) {
    this.zoneMapper = zoneMapper;
  }

  /**
   * Calculate hit counts for all zones based on recent spins
   * @param {Array} recentResults - Array of recent spin results
   * @returns {Object} - Zone hit counts { A: count, B: count, ... }
   */
  calculateZoneHitCounts(recentResults) {
    const zoneHitCounts = {};
    
    // Initialize all zones to 0
    this.zoneMapper.getAllZones().forEach(zone => {
      zoneHitCounts[zone] = 0;
    });

    // Count hits in each zone - ONLY for "1" results
    recentResults.forEach(result => {
      // Only count "1" results for hot zone detection
      if (result === '1' || result === 1) {
        const segmentIndex = this.zoneMapper.resultToSegmentIndex(result);
        if (segmentIndex !== null) {
          const zone = this.zoneMapper.getZoneForSegment(segmentIndex);
          if (zone && zoneHitCounts.hasOwnProperty(zone)) {
            zoneHitCounts[zone]++;
          }
        }
      }
    });

    return zoneHitCounts;
  }

  /**
   * Calculate heat scores for all zones based on hit counts and density
   * Formula: zoneScore = recentHitsInZone * onesInZone
   * @param {Object} zoneHitCounts - Zone hit counts object
   * @returns {Object} - Zone scores { A: score, B: score, ... }
   */
  calculateZoneScores(zoneHitCounts) {
    const zoneScores = {};
    
    Object.entries(zoneHitCounts).forEach(([zone, hitCount]) => {
      const zoneDensity = this.zoneMapper.getZoneDensity(zone);
      zoneScores[zone] = hitCount * zoneDensity;
    });

    return zoneScores;
  }

  /**
   * Calculate normalized scores (score per spin)
   * @param {Object} zoneScores - Zone scores object
   * @param {number} windowSize - Analysis window size
   * @returns {Object} - Normalized zone scores
   */
  calculateNormalizedScores(zoneScores, windowSize) {
    const normalizedScores = {};
    
    Object.entries(zoneScores).forEach(([zone, score]) => {
      normalizedScores[zone] = windowSize > 0 ? score / windowSize : 0;
    });

    return normalizedScores;
  }

  /**
   * Find the dominant zone (highest scoring zone)
   * @param {Object} zoneScores - Zone scores object
   * @returns {Object} - { zone: 'A', score: 12, normalizedScore: 0.6 }
   */
  getDominantZone(zoneScores, windowSize = 20) {
    let dominantZone = this.zoneMapper.getAllZones()[0]; // Default to first zone
    let highestScore = zoneScores[dominantZone] || 0;

    Object.entries(zoneScores).forEach(([zone, score]) => {
      if (score > highestScore) {
        dominantZone = zone;
        highestScore = score;
      }
    });

    const normalizedScore = windowSize > 0 ? highestScore / windowSize : 0;

    return { 
      zone: dominantZone, 
      score: highestScore,
      normalizedScore: normalizedScore,
      density: this.zoneMapper.getZoneDensity(dominantZone)
    };
  }

  /**
   * Get zone ranking (sorted by score)
   * @param {Object} zoneScores - Zone scores object
   * @returns {Array} - Array of { zone, score, normalizedScore } sorted by score (highest first)
   */
  getZoneRanking(zoneScores, windowSize = 20) {
    return Object.entries(zoneScores)
      .map(([zone, score]) => ({
        zone,
        score,
        normalizedScore: windowSize > 0 ? score / windowSize : 0,
        density: this.zoneMapper.getZoneDensity(zone)
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate average zone score
   * @param {Object} zoneScores - Zone scores object
   * @returns {number} - Average score across all zones
   */
  getAverageZoneScore(zoneScores) {
    const scores = Object.values(zoneScores);
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  /**
   * Get zone score statistics
   * @param {Object} zoneScores - Zone scores object
   * @param {number} windowSize - Analysis window size
   * @returns {Object} - Statistics including min, max, average, total
   */
  getZoneScoreStatistics(zoneScores, windowSize = 20) {
    const scores = Object.values(zoneScores);
    const total = scores.reduce((sum, score) => sum + score, 0);
    const average = scores.length > 0 ? total / scores.length : 0;
    const min = scores.length > 0 ? Math.min(...scores) : 0;
    const max = scores.length > 0 ? Math.max(...scores) : 0;

    return {
      total,
      average,
      min,
      max,
      normalizedTotal: windowSize > 0 ? total / windowSize : 0,
      normalizedAverage: windowSize > 0 ? average / windowSize : 0
    };
  }
}

module.exports = ZoneScoreCalculator; 