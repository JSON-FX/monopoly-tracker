import { useState, useCallback } from 'react';

/**
 * Chance outcome types for type safety
 */
export const CHANCE_TYPES = {
  CASH: 'cash',
  MULTIPLIER: 'multiplier'
};

/**
 * Custom hook for managing Chance segment logic according to specification
 * Implements correct stacking logic and state management
 * 
 * @param {Object} sessionState - Current session state
 * @param {Function} updateSessionState - Function to update session state
 * @returns {Object} Chance logic functions and state
 */
export const useChanceLogic = (sessionState, updateSessionState) => {
  // Chance state management
  const [chanceState, setChanceState] = useState({
    isPending: false,
    pendingMultiplier: 0,
    originalBetAmount: 0,
    isModalOpen: false
  });

  /**
   * Initialize chance state when a chance result occurs
   * Only applies when user is in "Bet" status (session active + recommendation to bet)
   */
  const initializeChance = useCallback((betAmount) => {
    setChanceState(prev => ({
      ...prev,
      originalBetAmount: prev.isPending ? prev.originalBetAmount : betAmount, // Keep original bet for stacking
      isModalOpen: true
    }));
  }, []);

  /**
   * Handle cash prize selection
   * Implements Scenario 1 and Case B (Multiplier + Cash) logic
   */
  const handleCashPrize = useCallback((cashAmount) => {
    // Use setState callback to access current chance state values
    let result = { success: true, amount: 0 };
    
    setChanceState(currentChanceState => {
      const { currentCapital, startingCapital, baseBet } = sessionState;
      
      let profitLoss;
      let newCapital;
      
      if (currentChanceState.isPending && currentChanceState.pendingMultiplier > 0) {
        // Case B: Multiplier + Cash
        // Formula: P/L = (Original Bet Amount * Multiplier Value) + Cash Prize Amount
        const multiplierWin = currentChanceState.originalBetAmount * currentChanceState.pendingMultiplier;
        profitLoss = multiplierWin + cashAmount;
        newCapital = currentCapital + profitLoss;
        
        console.log(`Multiplier + Cash: (${currentChanceState.originalBetAmount} * ${currentChanceState.pendingMultiplier}) + ${cashAmount} = +${profitLoss}`);
      } else {
        // Scenario 1: Simple cash prize
        // Formula: P/L = + (Cash Prize Amount)
        profitLoss = cashAmount;
        newCapital = currentCapital + cashAmount;
        
        console.log(`Cash Prize: +${cashAmount}`);
      }

      // Update session state
      updateSessionState({
        currentCapital: newCapital,
        sessionProfit: newCapital - startingCapital,
        consecutiveLosses: 0, // Reset martingale on any win
        currentBetAmount: baseBet,
        successfulBets: prev => prev + 1,
        totalBets: prev => prev + 1,
        lastBetAmount: currentChanceState.isPending ? currentChanceState.originalBetAmount : 0,
        lastBetWon: true
      });

      // Update result object
      result.amount = profitLoss;

      // Reset chance state
      return {
        isPending: false,
        pendingMultiplier: 0,
        originalBetAmount: 0,
        isModalOpen: false
      };
    });

    return result;
  }, [sessionState, updateSessionState]);

  /**
   * Handle multiplier selection
   * Implements Scenario 2 and Case A (Multiplier + Multiplier) logic
   */
  const handleMultiplier = useCallback((multiplierValue) => {
    let result = { success: true, multiplier: 0 };
    
    setChanceState(currentChanceState => {
      let finalMultiplier;
      
      if (currentChanceState.isPending && currentChanceState.pendingMultiplier > 0) {
        // Case A: Multiplier + Multiplier - ADD them together
        const newMultiplier = currentChanceState.pendingMultiplier + multiplierValue;
        finalMultiplier = newMultiplier;
        
        console.log(`Stacking Multipliers: ${currentChanceState.pendingMultiplier} + ${multiplierValue} = ${newMultiplier}x`);
        
        result.multiplier = finalMultiplier;
        
        return {
          ...currentChanceState,
          pendingMultiplier: newMultiplier,
          isPending: true,
          isModalOpen: false
        };
      } else {
        // Scenario 2: Single multiplier - enter waiting state
        finalMultiplier = multiplierValue;
        
        console.log(`Single Multiplier: ${multiplierValue}x pending`);
        
        result.multiplier = finalMultiplier;
        
        return {
          ...currentChanceState,
          pendingMultiplier: multiplierValue,
          isPending: true,
          isModalOpen: false
        };
      }
    });

    return result;
  }, []);

  /**
   * Process the next spin result when multiplier is pending
   * Implements Scenario 2 win/loss logic
   */
  const processNextSpin = useCallback((result) => {
    if (!chanceState.isPending || chanceState.pendingMultiplier === 0) {
      return { processed: false };
    }

    const { currentCapital, startingCapital, baseBet, consecutiveLosses } = sessionState;
    let newCapital;
    let won;

    if (result === '1') {
      // Condition A: WIN
      // Formula: P/L = (Multiplier Value * Original Bet Amount)
      const winAmount = chanceState.pendingMultiplier * chanceState.originalBetAmount;
      newCapital = currentCapital + winAmount;
      won = true;
      
      console.log(`Multiplier WIN: ${chanceState.pendingMultiplier} * ${chanceState.originalBetAmount} = +${winAmount}`);
      
      updateSessionState({
        currentCapital: newCapital,
        sessionProfit: newCapital - startingCapital,
        consecutiveLosses: 0,
        currentBetAmount: baseBet,
        successfulBets: prev => prev + 1,
        totalBets: prev => prev + 1,
        lastBetAmount: chanceState.originalBetAmount,
        lastBetWon: true
      });
    } else {
      // Condition B: LOSS
      // Formula: P/L = - (Original Bet Amount)
      newCapital = currentCapital - chanceState.originalBetAmount;
      won = false;
      
      console.log(`Multiplier LOSS: -${chanceState.originalBetAmount}`);
      
      const newConsecutiveLosses = consecutiveLosses + 1;
      const newBetAmount = baseBet * Math.pow(2, newConsecutiveLosses);
      
      updateSessionState({
        currentCapital: newCapital,
        sessionProfit: newCapital - startingCapital,
        consecutiveLosses: newConsecutiveLosses,
        currentBetAmount: newBetAmount,
        totalBets: prev => prev + 1,
        lastBetAmount: chanceState.originalBetAmount,
        lastBetWon: false
      });
    }

    // Reset chance state after processing
    setChanceState({
      isPending: false,
      pendingMultiplier: 0,
      originalBetAmount: 0,
      isModalOpen: false
    });

    return { 
      processed: true, 
      won, 
      amount: won ? chanceState.pendingMultiplier * chanceState.originalBetAmount : chanceState.originalBetAmount 
    };
  }, [chanceState, sessionState, updateSessionState]);

  /**
   * Close modal without selection (cancel)
   */
  const closeModal = useCallback(() => {
    setChanceState(prev => ({
      ...prev,
      isModalOpen: false
    }));
  }, []);

  /**
   * Get current chance status for UI display
   */
  const getChanceStatus = useCallback(() => {
    if (!chanceState.isPending) {
      return { status: 'none' };
    }

    return {
      status: 'pending',
      multiplier: chanceState.pendingMultiplier,
      originalBet: chanceState.originalBetAmount,
      potentialWin: chanceState.pendingMultiplier * chanceState.originalBetAmount
    };
  }, [chanceState]);

  return {
    // State
    chanceState,
    
    // Actions
    initializeChance,
    handleCashPrize,
    handleMultiplier,
    processNextSpin,
    closeModal,
    
    // Getters
    getChanceStatus,
    
    // Computed values
    isPending: chanceState.isPending,
    isModalOpen: chanceState.isModalOpen,
    pendingMultiplier: chanceState.pendingMultiplier,
    originalBetAmount: chanceState.originalBetAmount
  };
}; 