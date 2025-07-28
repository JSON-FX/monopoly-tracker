/**
 * Test suite for useChanceLogic hook
 * Verifies all scenarios from the chance-segment.md specification
 */

import { renderHook, act } from '@testing-library/react';
import { useChanceLogic } from './useChanceLogic';

// Mock session state
const createMockSessionState = (overrides = {}) => ({
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

// Mock update function
const createMockUpdateFunction = () => {
  const updates = [];
  const updateFn = jest.fn((update) => updates.push(update));
  updateFn.getUpdates = () => updates;
  updateFn.getLastUpdate = () => updates[updates.length - 1];
  return updateFn;
};

describe('useChanceLogic', () => {
  describe('Scenario 1: Simple Cash Prize', () => {
    test('should handle cash prize correctly', () => {
      const sessionState = createMockSessionState();
      const updateSessionState = createMockUpdateFunction();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, updateSessionState)
      );

      // Initialize chance
      act(() => {
        result.current.initializeChance(10);
      });

      expect(result.current.isModalOpen).toBe(true);

      // Handle cash prize of $50
      let cashResult;
      act(() => {
        cashResult = result.current.handleCashPrize(50);
      });

      // Verify cash prize result
      expect(cashResult.success).toBe(true);
      expect(cashResult.amount).toBe(50);

      // Verify session state updates
      const lastUpdate = updateSessionState.getLastUpdate();
      expect(lastUpdate.currentCapital).toBe(1050); // 1000 + 50
      expect(lastUpdate.sessionProfit).toBe(50); // 1050 - 1000
      expect(lastUpdate.consecutiveLosses).toBe(0);
      expect(lastUpdate.lastBetWon).toBe(true);

      // Verify chance state reset
      expect(result.current.isPending).toBe(false);
      expect(result.current.isModalOpen).toBe(false);
    });
  });

  describe('Scenario 2: Single Multiplier', () => {
    test('should handle multiplier win correctly', () => {
      const sessionState = createMockSessionState();
      const updateSessionState = createMockUpdateFunction();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, updateSessionState)
      );

      // Initialize chance with $10 bet
      act(() => {
        result.current.initializeChance(10);
      });

      // Set 5x multiplier
      act(() => {
        result.current.handleMultiplier(5);
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.pendingMultiplier).toBe(5);
      expect(result.current.originalBetAmount).toBe(10);

      // Process next spin as "1" (WIN)
      let spinResult;
      act(() => {
        spinResult = result.current.processNextSpin('1');
      });

      // Verify win calculation: 5 * 10 = $50
      expect(spinResult.processed).toBe(true);
      expect(spinResult.won).toBe(true);
      expect(spinResult.amount).toBe(50);

      const lastUpdate = updateSessionState.getLastUpdate();
      expect(lastUpdate.currentCapital).toBe(1050); // 1000 + 50
      expect(lastUpdate.consecutiveLosses).toBe(0);
      expect(lastUpdate.lastBetWon).toBe(true);
    });

    test('should handle multiplier loss correctly', () => {
      const sessionState = createMockSessionState();
      const updateSessionState = createMockUpdateFunction();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, updateSessionState)
      );

      // Initialize chance with $10 bet
      act(() => {
        result.current.initializeChance(10);
      });

      // Set 5x multiplier
      act(() => {
        result.current.handleMultiplier(5);
      });

      // Process next spin as "2" (LOSS)
      let spinResult;
      act(() => {
        spinResult = result.current.processNextSpin('2');
      });

      // Verify loss calculation: -$10 (original bet)
      expect(spinResult.processed).toBe(true);
      expect(spinResult.won).toBe(false);
      expect(spinResult.amount).toBe(10);

      const lastUpdate = updateSessionState.getLastUpdate();
      expect(lastUpdate.currentCapital).toBe(990); // 1000 - 10
      expect(lastUpdate.consecutiveLosses).toBe(1);
      expect(lastUpdate.lastBetWon).toBe(false);
    });
  });

  describe('Scenario 3A: Multiplier + Multiplier Stacking', () => {
    test('should add multipliers together correctly', () => {
      const sessionState = createMockSessionState();
      const updateSessionState = createMockUpdateFunction();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, updateSessionState)
      );

      // Initialize chance with $10 bet
      act(() => {
        result.current.initializeChance(10);
      });

      // Set first multiplier: 3x
      act(() => {
        result.current.handleMultiplier(3);
      });

      expect(result.current.pendingMultiplier).toBe(3);

      // Initialize second chance (stacking)
      act(() => {
        result.current.initializeChance(10); // Same bet amount maintained
      });

      // Set second multiplier: 5x
      act(() => {
        result.current.handleMultiplier(5);
      });

      // Verify multipliers are added: 3 + 5 = 8
      expect(result.current.pendingMultiplier).toBe(8);
      expect(result.current.originalBetAmount).toBe(10);

      // Process next spin as "1" (WIN)
      act(() => {
        result.current.processNextSpin('1');
      });

      const lastUpdate = updateSessionState.getLastUpdate();
      expect(lastUpdate.currentCapital).toBe(1080); // 1000 + (10 * 8)
    });
  });

  describe('Scenario 3B: Multiplier + Cash', () => {
    test('should calculate multiplier + cash correctly', () => {
      const sessionState = createMockSessionState();
      const updateSessionState = createMockUpdateFunction();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, updateSessionState)
      );

      // Initialize chance with $10 bet
      act(() => {
        result.current.initializeChance(10);
      });

      // Set multiplier: 3x
      act(() => {
        result.current.handleMultiplier(3);
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.pendingMultiplier).toBe(3);

      // Initialize second chance (stacking)
      act(() => {
        result.current.initializeChance(10);
      });

      // Choose cash prize: $50
      let cashResult;
      act(() => {
        cashResult = result.current.handleCashPrize(50);
      });

      // Verify calculation: (10 * 3) + 50 = $80
      expect(cashResult.amount).toBe(80);

      const lastUpdate = updateSessionState.getLastUpdate();
      expect(lastUpdate.currentCapital).toBe(1080); // 1000 + 80
      expect(lastUpdate.sessionProfit).toBe(80);

      // Verify chance state is fully reset
      expect(result.current.isPending).toBe(false);
      expect(result.current.pendingMultiplier).toBe(0);
    });
  });

  describe('Edge Cases and State Management', () => {
    test('should not process spin when no multiplier is pending', () => {
      const sessionState = createMockSessionState();
      const updateSessionState = createMockUpdateFunction();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, updateSessionState)
      );

      const spinResult = result.current.processNextSpin('1');
      expect(spinResult.processed).toBe(false);
    });

    test('should maintain original bet amount during stacking', () => {
      const sessionState = createMockSessionState();
      const updateSessionState = createMockUpdateFunction();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, updateSessionState)
      );

      // First chance with $10 bet
      act(() => {
        result.current.initializeChance(10);
        result.current.handleMultiplier(3);
      });

      // Second chance - different bet amount should not change original
      act(() => {
        result.current.initializeChance(20);
        result.current.handleMultiplier(2);
      });

      // Original bet should remain $10
      expect(result.current.originalBetAmount).toBe(10);
      expect(result.current.pendingMultiplier).toBe(5); // 3 + 2
    });

    test('should close modal correctly', () => {
      const sessionState = createMockSessionState();
      const updateSessionState = createMockUpdateFunction();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, updateSessionState)
      );

      act(() => {
        result.current.initializeChance(10);
      });

      expect(result.current.isModalOpen).toBe(true);

      act(() => {
        result.current.closeModal();
      });

      expect(result.current.isModalOpen).toBe(false);
    });

    test('should provide correct chance status', () => {
      const sessionState = createMockSessionState();
      const updateSessionState = createMockUpdateFunction();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, updateSessionState)
      );

      // Initially no pending chance
      expect(result.current.getChanceStatus().status).toBe('none');

      // After setting multiplier
      act(() => {
        result.current.initializeChance(10);
        result.current.handleMultiplier(5);
      });

      const status = result.current.getChanceStatus();
      expect(status.status).toBe('pending');
      expect(status.multiplier).toBe(5);
      expect(status.originalBet).toBe(10);
      expect(status.potentialWin).toBe(50);
    });
  });

  describe('Integration with Session State', () => {
    test('should handle martingale progression correctly on loss', () => {
      const sessionState = createMockSessionState({
        consecutiveLosses: 1 // Already 1 loss
      });
      const updateSessionState = createMockUpdateFunction();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, updateSessionState)
      );

      act(() => {
        result.current.initializeChance(20); // $20 martingale bet
        result.current.handleMultiplier(3);
        result.current.processNextSpin('2'); // Loss
      });

      const lastUpdate = updateSessionState.getLastUpdate();
      expect(lastUpdate.consecutiveLosses).toBe(2); // 1 + 1
      expect(lastUpdate.currentBetAmount).toBe(40); // 10 * 2^2
    });

    test('should reset martingale on win', () => {
      const sessionState = createMockSessionState({
        consecutiveLosses: 3 // High consecutive losses
      });
      const updateSessionState = createMockUpdateFunction();
      
      const { result } = renderHook(() => 
        useChanceLogic(sessionState, updateSessionState)
      );

      act(() => {
        result.current.initializeChance(80); // High martingale bet
        result.current.handleMultiplier(2);
        result.current.processNextSpin('1'); // Win
      });

      const lastUpdate = updateSessionState.getLastUpdate();
      expect(lastUpdate.consecutiveLosses).toBe(0); // Reset
      expect(lastUpdate.currentBetAmount).toBe(10); // Back to base bet
    });
  });
}); 