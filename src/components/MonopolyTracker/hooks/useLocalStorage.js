import { useEffect } from 'react';

/**
 * Custom hook to manage localStorage for MonopolyTracker data
 * @param {Object} data - Data object to save to localStorage
 * @param {boolean} dataLoaded - Flag indicating if data has been loaded
 * @returns {Object} Object with loadData function
 */
export const useLocalStorage = (data, dataLoaded) => {
  // Save data to localStorage whenever relevant state changes
  useEffect(() => {
    if (dataLoaded) {
      const dataToSave = {
        results: data.results,
        resultTimestamps: data.resultTimestamps,
        totalBets: data.totalBets,
        successfulBets: data.successfulBets,
        sessionActive: data.sessionActive,
        startingCapital: data.startingCapital,
        currentCapital: data.currentCapital,
        baseBet: data.baseBet,
        currentBetAmount: data.currentBetAmount,
        consecutiveLosses: data.consecutiveLosses,
        sessionProfit: data.sessionProfit,
        sessionStartTime: data.sessionStartTime,
        sessionEndTime: data.sessionEndTime,
        sessionHistory: data.sessionHistory.slice(-5), // Always keep only last 5
        highestMartingale: data.highestMartingale,
        lastBetAmount: data.lastBetAmount,
        lastBetWon: data.lastBetWon
      };
      localStorage.setItem('monopolyTrackerData', JSON.stringify(dataToSave));
    }
  }, [
    dataLoaded,
    data.results,
    data.resultTimestamps,
    data.totalBets,
    data.successfulBets,
    data.sessionActive,
    data.startingCapital,
    data.currentCapital,
    data.baseBet,
    data.currentBetAmount,
    data.consecutiveLosses,
    data.sessionProfit,
    data.sessionStartTime,
    data.sessionEndTime,
    data.sessionHistory,
    data.highestMartingale,
    data.lastBetAmount,
    data.lastBetWon
  ]);

  /**
   * Load data from localStorage
   * @returns {Object|null} Parsed data object or null if no data/error
   */
  const loadData = () => {
    const savedData = localStorage.getItem('monopolyTrackerData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        return {
          results: data.results || [],
          resultTimestamps: data.resultTimestamps || [],
          totalBets: data.totalBets || 0,
          successfulBets: data.successfulBets || 0,
          sessionActive: data.sessionActive || false,
          startingCapital: data.startingCapital || 0,
          currentCapital: data.currentCapital || 0,
          baseBet: data.baseBet || 0,
          currentBetAmount: data.currentBetAmount || 0,
          consecutiveLosses: data.consecutiveLosses || 0,
          sessionProfit: data.sessionProfit || 0,
          sessionStartTime: data.sessionStartTime || null,
          sessionEndTime: data.sessionEndTime || null,
          sessionHistory: (data.sessionHistory || []).slice(-5), // Keep only last 5
          highestMartingale: data.highestMartingale || 0,
          pendingMultiplier: data.pendingMultiplier || 1,
          lastBetAmount: data.lastBetAmount || 0,
          lastBetWon: data.lastBetWon || false
        };
      } catch (error) {
        console.error('Error loading saved data:', error);
        return null;
      }
    }
    return null;
  };

  /**
   * Clear all localStorage data
   */
  const clearData = () => {
    localStorage.removeItem('monopolyTrackerData');
  };

  return {
    loadData,
    clearData
  };
}; 