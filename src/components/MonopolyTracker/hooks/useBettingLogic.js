import { useCallback } from 'react';
import { calculateMartingaleBet } from '../utils/calculations';

/**
 * Custom hook for betting logic and result processing
 * @param {Object} bettingState - Current betting state
 * @param {Function} updateState - Function to update multiple state values
 * @returns {Object} Betting logic functions
 */
export const useBettingLogic = (bettingState, updateState) => {
  /**
   * Handle session bet processing
   */
  const handleSessionBet = useCallback((betAmount, won, isMultiplier = false) => {
    const {
      sessionActive,
      currentCapital,
      startingCapital,
      baseBet,
      consecutiveLosses,
      pendingMultiplier,
      highestMartingale
    } = bettingState;

    if (!sessionActive) return;
    
    // Track highest martingale bet amount
    const newHighestMartingale = betAmount >= highestMartingale ? betAmount : highestMartingale;
    
    // Track last bet for simplified undo
    const lastBetAmount = betAmount;
    const lastBetWon = won;
    
    if (won) {
      // Win: Calculate winnings (with multiplier if applicable)
      const winAmount = isMultiplier ? betAmount * pendingMultiplier : betAmount;
      const newCapital = currentCapital + winAmount;
      
      updateState({
        currentCapital: newCapital,
        consecutiveLosses: 0,
        currentBetAmount: baseBet,
        successfulBets: prev => prev + 1,
        sessionProfit: newCapital - startingCapital,
        pendingMultiplier: 1, // Reset multiplier after use
        lastBetAmount,
        lastBetWon,
        highestMartingale: newHighestMartingale,
        totalBets: prev => prev + 1
      });
    } else {
      // Loss: Subtract bet amount from capital, increment consecutive losses
      const newCapital = currentCapital - betAmount;
      const newConsecutiveLosses = consecutiveLosses + 1;
      const newBetAmount = calculateMartingaleBet(baseBet, newConsecutiveLosses);
      
      updateState({
        currentCapital: newCapital,
        consecutiveLosses: newConsecutiveLosses,
        currentBetAmount: newBetAmount,
        sessionProfit: newCapital - startingCapital,
        pendingMultiplier: 1, // Reset multiplier after loss
        lastBetAmount,
        lastBetWon,
        highestMartingale: newHighestMartingale,
        totalBets: prev => prev + 1
      });
    }
  }, [bettingState, updateState]);

  /**
   * Add a result to the results array
   */
  const addResult = useCallback((result) => {
    const timestamp = new Date().toISOString();
    const { results, resultTimestamps } = bettingState;
    
    const newResults = [...results, result];
    const newTimestamps = [...resultTimestamps, timestamp];
    
    updateState({
      results: newResults,
      resultTimestamps: newTimestamps
    });
  }, [bettingState, updateState]);

  /**
   * Handle chance multiplier selection
   */
  const handleChanceMultiplier = useCallback(() => {
    updateState({
      pendingMultiplier: 2 // Fixed 2x multiplier
    });
    addResult('chance');
  }, [updateState, addResult]);

  /**
   * Handle chance cash selection
   */
  const handleChanceCash = useCallback((cashAmount) => {
    const { currentCapital, startingCapital, baseBet } = bettingState;
    
    // Add cash to capital and reset martingale
    const newCapital = currentCapital + cashAmount;
    
    updateState({
      currentCapital: newCapital,
      sessionProfit: newCapital - startingCapital,
      consecutiveLosses: 0,
      currentBetAmount: baseBet,
      successfulBets: prev => prev + 1, // Track as a winning "bet" for stats
      totalBets: prev => prev + 1
    });
    
    addResult('chance');
  }, [bettingState, updateState, addResult]);

  /**
   * Simplified undo function
   */
  const handleUndo = useCallback(() => {
    const {
      results,
      resultTimestamps,
      sessionActive,
      lastBetAmount,
      lastBetWon,
      currentCapital,
      startingCapital
    } = bettingState;

    if (results.length === 0) {
      return { success: false, message: 'No results to undo' };
    }
    
    const lastResult = results[results.length - 1];
    const newResults = results.slice(0, -1);
    const newTimestamps = resultTimestamps.slice(0, -1);
    
    let updateObject = {
      results: newResults,
      resultTimestamps: newTimestamps,
      pendingMultiplier: 1 // Reset any pending multiplier
    };
    
    // Simple undo for betting if there was a last bet
    if (sessionActive && lastBetAmount > 0) {
      if (lastBetWon) {
        // Undo win: subtract amount from capital
        const newCapital = currentCapital - lastBetAmount;
        updateObject = {
          ...updateObject,
          currentCapital: newCapital,
          successfulBets: prev => Math.max(0, prev - 1),
          sessionProfit: newCapital - startingCapital
        };
      } else {
        // Undo loss: add amount back to capital
        const newCapital = currentCapital + lastBetAmount;
        updateObject = {
          ...updateObject,
          currentCapital: newCapital,
          sessionProfit: newCapital - startingCapital
        };
      }
      
      updateObject = {
        ...updateObject,
        totalBets: prev => Math.max(0, prev - 1),
        lastBetAmount: 0,
        lastBetWon: false
      };
    }
    
    updateState(updateObject);
    
    return { success: true, message: `✅ Undid: ${lastResult.toUpperCase()}` };
  }, [bettingState, updateState]);

  return {
    handleSessionBet,
    addResult,
    handleChanceMultiplier,
    handleChanceCash,
    handleUndo
  };
}; 