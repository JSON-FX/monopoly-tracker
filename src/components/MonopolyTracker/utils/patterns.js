// Utility functions for Monopoly Live pattern analysis

/**
 * Filter out chance results to get only actual number outcomes
 * Chance results should NOT count towards betting pattern analysis
 * @param {Array} results - Array of all game results
 * @returns {Array} Filtered results containing only number outcomes (1, 2, 5, 10, 2 rolls, 4 rolls)
 */
export const filterOutChanceResults = (results) => {
  return results.filter(result => result !== 'chance');
};

/**
 * Analyze the frequency of "1" results in the last 50 spins
 * @param {Array} results - Array of game results
 * @returns {Object} Analysis object with frequency and count data
 */
export const analyzeOnesPattern = (results) => {
  // Filter out chance results - only count actual number outcomes
  const filteredResults = filterOutChanceResults(results);
  const last50 = filteredResults.slice(-50);
  const onesCount = last50.filter(r => r === '1').length;
  const onesFrequency = last50.length > 0 ? (onesCount / last50.length) * 100 : 0;
  
  // Find current dry spell (consecutive non-1s) - excluding chance results
  let currentDrySpell = 0;
  for (let i = filteredResults.length - 1; i >= 0; i--) {
    if (filteredResults[i] === '1') break;
    currentDrySpell++;
  }

  return {
    onesFrequency: onesFrequency.toFixed(1),
    currentDrySpell,
    last50Count: onesCount,
    totalResults: filteredResults.length // Count only number results, not chance
  };
};

/**
 * Analyze the last three rolls for pattern detection
 * @param {Array} results - Array of game results
 * @returns {Object} Analysis object for last 3 rolls (excluding chance results)
 */
export const analyzeLastThreeRolls = (results) => {
  // Filter out chance results - only analyze actual number outcomes
  const filteredResults = filterOutChanceResults(results);
  const last3 = filteredResults.slice(-3);
  return {
    pattern: last3.join(','),
    hasOne: last3.includes('1'),
    rolls: last3,
    length: last3.length
  };
};

/**
 * Analyze the last two rolls for pattern detection
 * @param {Array} results - Array of game results
 * @returns {Object} Analysis object for last 2 rolls (excluding chance results)
 */
export const analyzeLastTwoRolls = (results) => {
  // Filter out chance results - only analyze actual number outcomes
  const filteredResults = filterOutChanceResults(results);
  const last2 = filteredResults.slice(-2);
  return {
    pattern: last2.join(','),
    hasOne: last2.includes('1'),
    rolls: last2,
    length: last2.length
  };
};

/**
 * Determine if the current pattern is good for betting
 * @param {Array} results - Array of game results
 * @returns {Object} Analysis object with isGood boolean and reason
 */
export const isGoodPattern = (results) => {
  // Filter out chance results - betting decisions should only consider actual number outcomes
  const filteredResults = filterOutChanceResults(results);
  const last3 = filteredResults.slice(-3);
  const last2 = filteredResults.slice(-2);
  const last5 = filteredResults.slice(-5);
  
  // Check if we have enough data (excluding chance results)
  if (last2.length < 2) {
    return { isGood: false, reason: 'Insufficient data (need at least 2 non-chance rolls)' };
  }
  
  // Count ones in last 3 rolls (or last 2 if we only have 2 rolls)
  const rollsToCheck = last3.length >= 3 ? last3 : last2;
  const onesCount = rollsToCheck.filter(r => r === '1').length;
  const pattern = rollsToCheck.join(',');
  
  // Good pattern: Any pattern with 1 or 2 ones in recent rolls
  if (onesCount >= 1 && onesCount <= 2) {
    return { 
      isGood: true, 
      reason: `Good pattern: ${pattern} (${onesCount} ones in last ${rollsToCheck.length} non-chance rolls)` 
    };
  }
  
  // Bad pattern: No ones in last 3-5 rolls
  const last5OnesCount = last5.filter(r => r === '1').length;
  if (onesCount === 0) {
    if (last5OnesCount === 0 && last5.length >= 5) {
      return { 
        isGood: false, 
        reason: `Bad pattern: ${pattern} (no "1" in last 5 non-chance rolls: ${last5.join(',')})` 
      };
    } else if (last5OnesCount === 0 && last5.length >= 3) {
      return { 
        isGood: false, 
        reason: `Bad pattern: ${pattern} (no "1" in last ${last5.length} non-chance rolls: ${last5.join(',')})` 
      };
    } else {
      return { 
        isGood: false, 
        reason: `Bad pattern: ${pattern} (no "1" in last ${rollsToCheck.length} non-chance rolls)` 
      };
    }
  }
  
  // Edge case: More than 2 ones (extremely rare, but handle it)
  if (onesCount > 2) {
    return { 
      isGood: true, 
      reason: `Excellent pattern: ${pattern} (${onesCount} ones in last ${rollsToCheck.length} non-chance rolls - very strong)` 
    };
  }
  
  return { isGood: false, reason: 'Unexpected pattern state' };
};

/**
 * Get betting recommendation based on pattern analysis and risk management
 * @param {Array} results - Array of game results
 * @param {number} consecutiveLosses - Number of consecutive losses
 * @param {number} baseBet - Base bet amount
 * @param {number} currentBetAmount - Current bet amount (with martingale applied)
 * @returns {Object} Betting recommendation with shouldBet, confidence, reason, etc.
 */
export const getBettingRecommendation = (results, consecutiveLosses, baseBet, currentBetAmount = null) => {
  // Use the actual consecutive losses from betting decisions
  const actualConsecutiveLosses = consecutiveLosses;
  
  // Expected Value calculation (40.74% win rate on "1" segment)
  const expectedValue = (0.4074 * 1) - (0.5926 * 1);
  
  // Streak prevention logic
  const streakRisk = actualConsecutiveLosses >= 3 ? 'HIGH' : 
                    actualConsecutiveLosses >= 2 ? 'MEDIUM' : 'LOW';
  
  // Get pattern analysis
  const patternAnalysis = isGoodPattern(results);
  const last3Analysis = analyzeLastThreeRolls(results);
  const last2Analysis = analyzeLastTwoRolls(results);
  
  // Dynamic betting decision
  let shouldBet = false;
  let confidence = 50;
  let reason = '';
  let action = '';
  let bettingMode = 'NONE';

  // Use current bet amount if provided, otherwise calculate
  const recommendedAmount = currentBetAmount || baseBet;

  // SAFETY LIMIT CHECK - ALWAYS FIRST
  if (actualConsecutiveLosses >= 7) {
    shouldBet = false;
    confidence = 99;
    action = '🛑 SKIP - SAFETY LIMIT';
    reason = `💀 SAFETY LIMIT: ${actualConsecutiveLosses} losses - Next bet ₱${recommendedAmount} - MAXIMUM RISK REACHED`;
    bettingMode = 'SAFETY_LIMIT';
  }
  else {
    // SIMPLE PATTERN-BASED BETTING
    if (patternAnalysis.isGood) {
      shouldBet = true;
      confidence = 85;
      action = '✅ BET NOW';
      reason = `✅ GOOD PATTERN: ${patternAnalysis.reason} - Safe to bet`;
      bettingMode = 'GOOD_PATTERN';
    } else {
      shouldBet = false;
      confidence = 85;
      action = '⏸️ SKIP';
      reason = `❌ BAD PATTERN: ${patternAnalysis.reason} - Waiting for 1 or good pattern`;
      bettingMode = 'BAD_PATTERN';
    }
  }

  return {
    shouldBet,
    action,
    confidence: confidence.toFixed(0),
    reason,
    amount: recommendedAmount,
    streakRisk,
    consecutiveLosses: actualConsecutiveLosses,
    expectedValue: expectedValue.toFixed(2),
    bettingMode,
    // Pattern data
    patternAnalysis,
    last3Analysis,
    last2Analysis
  };
}; 