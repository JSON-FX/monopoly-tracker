/**
 * Comprehensive test suite for useChanceLogic hook
 * Tests all scenarios exactly as specified in chance-segment.md
 */

import { renderHook, act } from '@testing-library/react';
import { useChanceLogic } from './useChanceLogic';

// Test helper to create mock session state
const createSessionState = (overrides = {}) => ({
  currentCapital: 1000,
  startingCapital: 1000, 
  baseBet: 10,
  consecutiveLosses: 0,
  successfulBets: 0,
  totalBets: 0,
  lastBetAmount: 0,
  lastBetWon: false,
  ...overrides
});

// Test helper to track session updates
const createUpdateTracker = () => {
  const updates = [];
  const mockUpdate = jest.fn((update) => {
    // Handle functional updates
    const processedUpdate = {};
    Object.entries(update).forEach(([key, value]) => {
      if (typeof value === 'function') {
        processedUpdate[key] = value(0); // Simulate previous value of 0 for counters
      } else {
        processedUpdate[key] = value;
      }
    });
    updates.push(processedUpdate);
  });
  
  return {
    updateFn: mockUpdate,
    getUpdates: () => updates,
    getLastUpdate: () => updates[updates.length - 1],
    clear: () => updates.length = 0
  };
};

describe('useChanceLogic - Specification Compliance Tests', () => {
  
  describe('Scenario 1: Cash Prize Outcome (Simple)', () => {
    test('Example: $50 cash prize should add $50 to P/L', () => {
      const sessionState = createSessionState();
      const tracker = createUpdateTracker();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, tracker.updateFn)
      );

      // Initialize chance (user is in "Bet" status)
      act(() => {
        result.current.initializeChance(10); // $10 bet
      });

      // User selects $50 cash prize
      let cashResult;
      act(() => {
        cashResult = result.current.handleCashPrize(50);
      });

      // Verify: P/L = + (Cash Prize Amount) = +$50
      expect(cashResult.success).toBe(true);
      expect(cashResult.amount).toBe(50);

      const update = tracker.getLastUpdate();
      expect(update.currentCapital).toBe(1050); // 1000 + 50
      expect(update.sessionProfit).toBe(50); // 1050 - 1000
      expect(update.lastBetWon).toBe(true);

      // Event should be complete
      expect(result.current.isPending).toBe(false);
      expect(result.current.isModalOpen).toBe(false);
    });

    test('Different cash amounts should work correctly', () => {
      const sessionState = createSessionState();
      const tracker = createUpdateTracker();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, tracker.updateFn)
      );

      // Test with $75 cash prize
      act(() => {
        result.current.initializeChance(20);
        result.current.handleCashPrize(75);
      });

      const update = tracker.getLastUpdate();
      expect(update.currentCapital).toBe(1075); // 1000 + 75
      expect(update.sessionProfit).toBe(75);
    });
  });

  describe('Scenario 2: Multiplier Outcome (Single Event)', () => {
    test('Condition A: Next spin is "1" (WIN) - Example from spec', () => {
      const sessionState = createSessionState();
      const tracker = createUpdateTracker();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, tracker.updateFn)
      );

      // User bet $10, gets 5x Multiplier
      act(() => {
        result.current.initializeChance(10);
        result.current.handleMultiplier(5);
      });

      // Verify waiting state
      expect(result.current.isPending).toBe(true);
      expect(result.current.pendingMultiplier).toBe(5);
      expect(result.current.originalBetAmount).toBe(10);

      // Next spin is "1" (WIN)
      let spinResult;
      act(() => {
        spinResult = result.current.processNextSpin('1');
      });

      // Verify: P/L = (Multiplier Value * Original Bet Amount) = (5 * $10) = +$50
      expect(spinResult.processed).toBe(true);
      expect(spinResult.won).toBe(true);
      expect(spinResult.amount).toBe(50);

      const update = tracker.getLastUpdate();
      expect(update.currentCapital).toBe(1050); // 1000 + 50
      expect(update.sessionProfit).toBe(50);
      expect(update.lastBetWon).toBe(true);
      expect(update.consecutiveLosses).toBe(0);

      // State should be reset
      expect(result.current.isPending).toBe(false);
    });

    test('Condition B: Next spin is NOT "1" (LOSS) - Example from spec', () => {
      const sessionState = createSessionState();
      const tracker = createUpdateTracker();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, tracker.updateFn)
      );

      // User bet $10, gets 5x Multiplier
      act(() => {
        result.current.initializeChance(10);
        result.current.handleMultiplier(5);
      });

      // Next spin is "2" (LOSS)
      let spinResult;
      act(() => {
        spinResult = result.current.processNextSpin('2');
      });

      // Verify: P/L = - (Original Bet Amount) = -$10
      expect(spinResult.processed).toBe(true);
      expect(spinResult.won).toBe(false);
      expect(spinResult.amount).toBe(10); // Amount lost

      const update = tracker.getLastUpdate();
      expect(update.currentCapital).toBe(990); // 1000 - 10
      expect(update.sessionProfit).toBe(-10);
      expect(update.lastBetWon).toBe(false);
      expect(update.consecutiveLosses).toBe(1);

      // State should be reset
      expect(result.current.isPending).toBe(false);
    });

    test('Various spin results should be handled correctly', () => {
      const testCases = ['2', '5', '10', 'chance'];
      
      testCases.forEach(spinResult => {
        const sessionState = createSessionState();
        const tracker = createUpdateTracker();
        
        const { result } = renderHook(() => 
          useChanceLogic(sessionState, tracker.updateFn)
        );

        act(() => {
          result.current.initializeChance(15);
          result.current.handleMultiplier(3);
          result.current.processNextSpin(spinResult);
        });

        const update = tracker.getLastUpdate();
        expect(update.currentCapital).toBe(985); // 1000 - 15 (original bet lost)
        expect(update.lastBetWon).toBe(false);
      });
    });
  });

  describe('Scenario 3A: Multiplier + Multiplier Stacking', () => {
    test('Example from spec: 3x + 5x = 8x', () => {
      const sessionState = createSessionState();
      const tracker = createUpdateTracker();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, tracker.updateFn)
      );

      // First chance: 3x Multiplier pending
      act(() => {
        result.current.initializeChance(10);
        result.current.handleMultiplier(3);
      });

      expect(result.current.pendingMultiplier).toBe(3);
      expect(result.current.isPending).toBe(true);

      // Second chance (stacking): 5x Multiplier
      act(() => {
        result.current.initializeChance(10); // Should maintain original bet
        result.current.handleMultiplier(5);
      });

      // Verify: Multipliers are ADDED together = 3 + 5 = 8x
      expect(result.current.pendingMultiplier).toBe(8);
      expect(result.current.originalBetAmount).toBe(10); // Original bet maintained
      expect(result.current.isPending).toBe(true);

      // Test final outcome with next spin
      act(() => {
        result.current.processNextSpin('1');
      });

      const update = tracker.getLastUpdate();
      expect(update.currentCapital).toBe(1080); // 1000 + (10 * 8)
    });

    test('Multiple stacking: 2x + 3x + 4x = 9x', () => {
      const sessionState = createSessionState();
      const tracker = createUpdateTracker();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, tracker.updateFn)
      );

      // Stack three multipliers
      act(() => {
        result.current.initializeChance(20);
        result.current.handleMultiplier(2);
      });

      act(() => {
        result.current.initializeChance(20);
        result.current.handleMultiplier(3);
      });

      act(() => {
        result.current.initializeChance(20);
        result.current.handleMultiplier(4);
      });

      expect(result.current.pendingMultiplier).toBe(9); // 2 + 3 + 4
      expect(result.current.originalBetAmount).toBe(20);

      // Win with final multiplier
      act(() => {
        result.current.processNextSpin('1');
      });

      const update = tracker.getLastUpdate();
      expect(update.currentCapital).toBe(1180); // 1000 + (20 * 9)
    });
  });

  describe('Scenario 3B: Multiplier + Cash', () => {
    test('Example from spec: $10 bet, 3x pending, $50 cash', () => {
      const sessionState = createSessionState();
      const tracker = createUpdateTracker();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, tracker.updateFn)
      );

      // First: 3x Multiplier pending
      act(() => {
        result.current.initializeChance(10);
        result.current.handleMultiplier(3);
      });

      expect(result.current.pendingMultiplier).toBe(3);
      expect(result.current.isPending).toBe(true);

      // Second chance: $50 Cash Prize
      let cashResult;
      act(() => {
        result.current.initializeChance(10);
        cashResult = result.current.handleCashPrize(50);
      });

      // Verify: P/L = (Original Bet Amount * Multiplier Value) + Cash Prize Amount
      // P/L = ($10 * 3) + $50 = $30 + $50 = +$80
      expect(cashResult.success).toBe(true);
      expect(cashResult.amount).toBe(80);

      const update = tracker.getLastUpdate();
      expect(update.currentCapital).toBe(1080); // 1000 + 80
      expect(update.sessionProfit).toBe(80);
      expect(update.lastBetWon).toBe(true);

      // Event should be complete and state reset
      expect(result.current.isPending).toBe(false);
      expect(result.current.pendingMultiplier).toBe(0);
    });

    test('Different multiplier and cash combinations', () => {
      const testCases = [
        { bet: 5, multiplier: 4, cash: 20, expected: 40 }, // (5*4) + 20 = 40
        { bet: 25, multiplier: 2, cash: 100, expected: 150 }, // (25*2) + 100 = 150
        { bet: 15, multiplier: 6, cash: 30, expected: 120 }, // (15*6) + 30 = 120
      ];

      testCases.forEach(({ bet, multiplier, cash, expected }, index) => {
        const sessionState = createSessionState();
        const tracker = createUpdateTracker();
        
        const { result } = renderHook(() => 
          useChanceLogic(sessionState, tracker.updateFn)
        );

        act(() => {
          result.current.initializeChance(bet);
          result.current.handleMultiplier(multiplier);
          result.current.initializeChance(bet);
        });

        let cashResult;
        act(() => {
          cashResult = result.current.handleCashPrize(cash);
        });

        expect(cashResult.amount).toBe(expected);
        
        const update = tracker.getLastUpdate();
        expect(update.currentCapital).toBe(1000 + expected);
      });
    });
  });

  describe('Edge Cases and State Management', () => {
    test('Should maintain original bet amount through all stacking operations', () => {
      const sessionState = createSessionState();
      const tracker = createUpdateTracker();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, tracker.updateFn)
      );

      // Start with $15 bet
      act(() => {
        result.current.initializeChance(15);
        result.current.handleMultiplier(2);
      });

      // Stack with different "bet" amounts (should be ignored)
      act(() => {
        result.current.initializeChance(30); // This should not change original bet
        result.current.handleMultiplier(3);
      });

      expect(result.current.originalBetAmount).toBe(15); // Should remain original
      expect(result.current.pendingMultiplier).toBe(5); // 2 + 3
    });

    test('Should not process spin when no multiplier is pending', () => {
      const sessionState = createSessionState();
      const tracker = createUpdateTracker();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, tracker.updateFn)
      );

      const spinResult = result.current.processNextSpin('1');
      expect(spinResult.processed).toBe(false);
      expect(tracker.getUpdates().length).toBe(0);
    });

    test('Should handle modal open/close correctly', () => {
      const sessionState = createSessionState();
      const tracker = createUpdateTracker();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, tracker.updateFn)
      );

      // Initially closed
      expect(result.current.isModalOpen).toBe(false);

      // Initialize chance opens modal
      act(() => {
        result.current.initializeChance(10);
      });
      expect(result.current.isModalOpen).toBe(true);

      // Close modal
      act(() => {
        result.current.closeModal();
      });
      expect(result.current.isModalOpen).toBe(false);
    });

    test('Should provide accurate chance status information', () => {
      const sessionState = createSessionState();
      const tracker = createUpdateTracker();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, tracker.updateFn)
      );

      // No pending chance
      expect(result.current.getChanceStatus().status).toBe('none');

      // With pending multiplier
      act(() => {
        result.current.initializeChance(20);
        result.current.handleMultiplier(4);
      });

      const status = result.current.getChanceStatus();
      expect(status.status).toBe('pending');
      expect(status.multiplier).toBe(4);
      expect(status.originalBet).toBe(20);
      expect(status.potentialWin).toBe(80); // 20 * 4
    });
  });

  describe('Session State Integration', () => {
    test('Should handle bet counting correctly for wins', () => {
      const sessionState = createSessionState();
      const tracker = createUpdateTracker();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, tracker.updateFn)
      );

      act(() => {
        result.current.initializeChance(10);
        result.current.handleCashPrize(25);
      });

      const update = tracker.getLastUpdate();
      expect(update.successfulBets).toBe(1); // Incremented for win
      expect(update.totalBets).toBe(1); // Incremented for any bet
    });

    test('Should handle martingale progression correctly', () => {
      const sessionState = createSessionState({
        consecutiveLosses: 2,
        baseBet: 10
      });
      const tracker = createUpdateTracker();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, tracker.updateFn)
      );

      // Lose with multiplier
      act(() => {
        result.current.initializeChance(40); // Martingale bet
        result.current.handleMultiplier(3);
        result.current.processNextSpin('5'); // Loss
      });

      const update = tracker.getLastUpdate();
      expect(update.consecutiveLosses).toBe(3); // 2 + 1
      expect(update.currentBetAmount).toBe(80); // 10 * 2^3

      // Win should reset martingale
      tracker.clear();
      act(() => {
        result.current.initializeChance(80);
        result.current.handleCashPrize(50);
      });

      const winUpdate = tracker.getLastUpdate();
      expect(winUpdate.consecutiveLosses).toBe(0); // Reset
      expect(winUpdate.currentBetAmount).toBe(10); // Back to base bet
    });
  });
}); 