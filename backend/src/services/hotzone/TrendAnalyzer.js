/**
 * Trend Analyzer - Handles trend classification and shift detection
 * Follows Single Responsibility Principle - only handles trend analysis logic
 */
class TrendAnalyzer {
  constructor(zoneMapper) {
    this.zoneMapper = zoneMapper;
    
    // Thresholds for classification (calibrated for 1-result counting)
    this.THRESHOLDS = {
      HOT_NORMALIZED_SCORE: 0.75,    // Score per spin for Hot status
      HOT_MIN_DENSITY: 4,            // Minimum zone density for Hot
      WARMING_NORMALIZED_SCORE: 0.5, // Score per spin for Warming status
      WARMING_MIN_DENSITY: 4,        // Minimum zone density for Warming
      COOLING_MAX_SCORE: 0.3,        // Max normalized score for Cooling
      COLD_THRESHOLD: 0.2            // Below this is Cold
    };
  }

  /**
   * Determine trend direction between two dominant zones
   * @param {Object} currentDominant - Current dominant zone info
   * @param {Object} previousDominant - Previous dominant zone info (can be null)
   * @returns {string} - 'up', 'down', or 'stable'
   */
  calculateTrendDirection(currentDominant, previousDominant) {
    if (!previousDominant) {
      return 'stable';
    }

    // Same zone comparison
    if (previousDominant.zone === currentDominant.zone) {
      if (currentDominant.score > previousDominant.score) {
        return 'up';
      } else if (currentDominant.score < previousDominant.score) {
        return 'down';
      }
      return 'stable';
    }

    // Different zones - compare densities to determine if improving or declining
    const previousDensity = this.zoneMapper.getZoneDensity(previousDominant.zone);
    const currentDensity = this.zoneMapper.getZoneDensity(currentDominant.zone);
    
    if (currentDensity > previousDensity) {
      return 'up';
    } else if (currentDensity < previousDensity) {
      return 'down';
    }
    
    // Same density - compare scores
    return currentDominant.score > previousDominant.score ? 'up' : 'down';
  }

  /**
   * Classify the current shift status based on dominant zone and trends
   * @param {Object} currentDominant - Current dominant zone info
   * @param {string} trendDirection - Trend direction ('up', 'down', 'stable')
   * @param {Object} zoneStats - Zone score statistics
   * @returns {string} - 'Hot', 'Warming', 'Cooling', or 'Cold'
   */
  classifyShiftStatus(currentDominant, trendDirection, zoneStats) {
    const { normalizedScore, density } = currentDominant;
    
    // Hot: High normalized score + high density zone
    if (normalizedScore >= this.THRESHOLDS.HOT_NORMALIZED_SCORE && 
        density >= this.THRESHOLDS.HOT_MIN_DENSITY) {
      return 'Hot';
    }
    
    // Warming: Good score + decent density + upward trend
    if (normalizedScore >= this.THRESHOLDS.WARMING_NORMALIZED_SCORE && 
        density >= this.THRESHOLDS.WARMING_MIN_DENSITY && 
        trendDirection === 'up') {
      return 'Warming';
    }
    
    // Cold: Very low activity (check this before Cooling)
    if (normalizedScore < this.THRESHOLDS.COLD_THRESHOLD) {
      return 'Cold';
    }
    
    // Cooling: Low score OR downward trend
    if (normalizedScore < this.THRESHOLDS.COOLING_MAX_SCORE || 
        trendDirection === 'down') {
      return 'Cooling';
    }
    
    // Default to Cold for safety
    return 'Cold';
  }

  /**
   * Generate betting recommendation based on status
   * @param {string} status - Zone status ('Hot', 'Warming', 'Cooling', 'Cold')
   * @param {Object} currentDominant - Current dominant zone info
   * @param {string} trendDirection - Trend direction
   * @returns {Object} - { recommendation: string, shouldSkipBet: boolean, confidence: string }
   */
  generateBettingRecommendation(status, currentDominant, trendDirection) {
    const { zone, normalizedScore, density } = currentDominant;
    
    switch (status) {
      case 'Hot':
        return {
          recommendation: `🔥 Zone ${zone} is HOT! Great betting opportunity with ${normalizedScore.toFixed(1)} hits per spin.`,
          shouldSkipBet: false,
          confidence: 'high',
          action: 'bet'
        };
        
      case 'Warming':
        return {
          recommendation: `📈 Zone ${zone} is warming up. Entry possible with caution.`,
          shouldSkipBet: false,
          confidence: 'medium',
          action: 'consider'
        };
        
      case 'Cooling':
        return {
          recommendation: `📉 Zone ${zone} is cooling down. Consider skipping bets.`,
          shouldSkipBet: true,
          confidence: 'medium',
          action: 'skip'
        };
        
      case 'Cold':
      default:
        return {
          recommendation: `❄️ Zone ${zone} is cold. Strongly recommend skipping bets.`,
          shouldSkipBet: true,
          confidence: 'high',
          action: 'skip'
        };
    }
  }

  /**
   * Analyze complete shift with all components
   * @param {Object} currentDominant - Current dominant zone info
   * @param {Object} previousDominant - Previous dominant zone info (can be null)
   * @param {Object} zoneStats - Zone score statistics
   * @returns {Object} - Complete analysis result
   */
  analyzeShift(currentDominant, previousDominant, zoneStats) {
    const trendDirection = this.calculateTrendDirection(currentDominant, previousDominant);
    const status = this.classifyShiftStatus(currentDominant, trendDirection, zoneStats);
    const recommendation = this.generateBettingRecommendation(status, currentDominant, trendDirection);
    
    return {
      status,
      trendDirection,
      recommendation: recommendation.recommendation,
      shouldSkipBet: recommendation.shouldSkipBet,
      confidence: recommendation.confidence,
      action: recommendation.action,
      dominantZone: currentDominant.zone,
      score: currentDominant.score,
      normalizedScore: currentDominant.normalizedScore,
      density: currentDominant.density
    };
  }

  /**
   * Get trend strength indicator
   * @param {Object} currentDominant - Current dominant zone info
   * @param {Object} previousDominant - Previous dominant zone info
   * @returns {string} - 'strong', 'moderate', 'weak'
   */
  getTrendStrength(currentDominant, previousDominant) {
    if (!previousDominant) {
      return 'weak';
    }
    
    const scoreDifference = Math.abs(currentDominant.score - previousDominant.score);
    const relativeDifference = previousDominant.score > 0 ? 
      scoreDifference / previousDominant.score : 
      scoreDifference;
    
    if (relativeDifference > 0.5) {
      return 'strong';
    } else if (relativeDifference > 0.2) {
      return 'moderate';
    }
    
    return 'weak';
  }

  /**
   * Check if skip bet mode should be automatically enabled
   * @param {string} status - Current zone status
   * @param {string} confidence - Recommendation confidence
   * @returns {boolean} - True if skip bet should be enabled
   */
  shouldAutoEnableSkipBet(status, confidence) {
    return (status === 'Cold' && confidence === 'high') || 
           (status === 'Cooling' && confidence === 'high');
  }

  /**
   * Check if skip bet mode should be automatically disabled
   * @param {string} status - Current zone status
   * @param {string} confidence - Recommendation confidence
   * @returns {boolean} - True if skip bet should be disabled
   */
  shouldAutoDisableSkipBet(status, confidence) {
    return (status === 'Hot' && confidence === 'high') || 
           (status === 'Warming' && confidence === 'high');
  }
}

module.exports = TrendAnalyzer; 