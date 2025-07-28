import { useCallback } from 'react';
import { calculateSessionDuration, calculateWinRate } from '../utils/calculations';

/**
 * Custom hook for session management logic
 * @param {Object} sessionState - Current session state
 * @param {Function} updateState - Function to update multiple state values
 * @returns {Object} Session management functions
 */
export const useSessionManagement = (sessionState, updateState) => {
  /**
   * Archive current session to history
   */
  const archiveCurrentSession = useCallback((customEndTime = null) => {
    const {
      sessionStartTime,
      results,
      sessionEndTime,
      currentCapital,
      startingCapital,
      sessionProfit,
      totalBets,
      successfulBets,
      highestMartingale,
      sessionHistory
    } = sessionState;

    if (sessionStartTime && results.length > 0) {
      const endTime = customEndTime || sessionEndTime || new Date().toISOString();
      const duration = calculateSessionDuration(sessionStartTime, endTime);
      
      const currentSession = {
        id: Date.now(),
        startTime: sessionStartTime,
        endTime: endTime,
        results: [...results],
        startingCapital,
        finalCapital: currentCapital,
        profit: sessionProfit,
        totalBets,
        successfulBets,
        winRate: calculateWinRate(successfulBets, totalBets),
        highestMartingale,
        duration
      };
      
      // Keep only last 5 sessions (including the new one)
      const newSessionHistory = [...sessionHistory, currentSession].slice(-5);
      updateState({ sessionHistory: newSessionHistory });
    }
  }, [sessionState, updateState]);

  /**
   * Initialize a new session
   */
  const initializeSession = useCallback((startCapital, baseBetAmount) => {
    // Archive current session if it exists
    archiveCurrentSession();
    
    // Clear current session data for fresh start
    updateState({
      results: [],
      resultTimestamps: [],
      totalBets: 0,
      successfulBets: 0,
      consecutiveLosses: 0,
      highestMartingale: 0,
      pendingMultiplier: 1,
      lastBetAmount: 0,
      lastBetWon: false,
      startingCapital: startCapital,
      currentCapital: startCapital,
      baseBet: baseBetAmount,
      currentBetAmount: baseBetAmount,
      sessionProfit: 0,
      sessionActive: true,
      sessionStartTime: new Date().toISOString(),
      sessionEndTime: null
    });
  }, [archiveCurrentSession, updateState]);

  /**
   * Clear current session
   */
  const clearCurrentSession = useCallback(() => {
    const { sessionActive, results } = sessionState;
    
    // Archive current session if it exists and has data
    if (sessionActive && results.length > 0) {
      archiveCurrentSession();
    }
    
    // Clear only current session data
    updateState({
      results: [],
      resultTimestamps: [],
      totalBets: 0,
      successfulBets: 0,
      sessionActive: false,
      startingCapital: 0,
      currentCapital: 0,
      baseBet: 0,
      currentBetAmount: 0,
      consecutiveLosses: 0,
      sessionProfit: 0,
      sessionStartTime: null,
      sessionEndTime: null,
      highestMartingale: 0,
      pendingMultiplier: 1,
      lastBetAmount: 0,
      lastBetWon: false
    });
  }, [sessionState, archiveCurrentSession, updateState]);

  /**
   * Reset all history including sessions
   */
  const resetHistory = useCallback(() => {
    const { sessionActive } = sessionState;
    
    updateState({
      results: [],
      resultTimestamps: [],
      totalBets: 0,
      successfulBets: 0,
      sessionEndTime: sessionActive ? new Date().toISOString() : null,
      sessionActive: false,
      startingCapital: 0,
      currentCapital: 0,
      baseBet: 0,
      currentBetAmount: 0,
      consecutiveLosses: 0,
      sessionProfit: 0,
      sessionStartTime: null,
      sessionHistory: [],
      highestMartingale: 0,
      pendingMultiplier: 1,
      lastBetAmount: 0,
      lastBetWon: false
    });
  }, [sessionState, updateState]);

  return {
    archiveCurrentSession,
    initializeSession,
    clearCurrentSession,
    resetHistory
  };
}; 