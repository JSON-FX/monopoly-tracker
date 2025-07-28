// Utility functions for Monopoly Live calculations

/**
 * Calculate Martingale bet amount based on base bet and consecutive losses
 * @param {number} baseBet - The base bet amount
 * @param {number} losses - Number of consecutive losses
 * @returns {number} The calculated bet amount
 */
export const calculateMartingaleBet = (baseBet, losses) => {
  return baseBet * Math.pow(2, losses);
};

/**
 * Calculate session duration from start and end times
 * @param {string} startTime - ISO string of session start time
 * @param {string} endTime - ISO string of session end time (optional, defaults to now)
 * @returns {string} Formatted duration string (e.g., "2h 30m")
 */
export const calculateSessionDuration = (startTime, endTime = null) => {
  if (!startTime) return 'N/A';
  
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diff = end - start;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

/**
 * Calculate win rate percentage
 * @param {number} successfulBets - Number of successful bets
 * @param {number} totalBets - Total number of bets
 * @returns {string} Win rate as percentage string
 */
export const calculateWinRate = (successfulBets, totalBets) => {
  if (totalBets === 0) return '0';
  return ((successfulBets / totalBets) * 100).toFixed(1);
};

/**
 * Calculate expected value for betting
 * @param {number} winRate - Win rate as decimal (e.g., 0.4074)
 * @param {number} winMultiplier - Multiplier for wins (usually 1)
 * @param {number} lossMultiplier - Multiplier for losses (usually 1)
 * @returns {number} Expected value
 */
export const calculateExpectedValue = (winRate = 0.4074, winMultiplier = 1, lossMultiplier = 1) => {
  return (winRate * winMultiplier) - ((1 - winRate) * lossMultiplier);
}; 