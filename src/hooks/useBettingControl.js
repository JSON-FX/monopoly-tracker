import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing betting control state including skip bet functionality
 * Follows Single Responsibility Principle - only handles betting control logic
 */
export const useBettingControl = () => {
  const [skipBetMode, setSkipBetMode] = useState(false);
  const [skipBetReason, setSkipBetReason] = useState('Manual');
  const [autoSkipEnabled, setAutoSkipEnabled] = useState(true);

  // Load skip bet state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('monopolySkipBetState');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSkipBetMode(Boolean(parsed.skipBetMode));
        setSkipBetReason(typeof parsed.skipBetReason === 'string' ? parsed.skipBetReason : 'Manual');
        setAutoSkipEnabled(parsed.autoSkipEnabled !== false); // Default to true
      }
    } catch (error) {
      console.warn('Failed to load skip bet state from localStorage:', error);
      // Reset to default values on error
      setSkipBetMode(false);
      setSkipBetReason('Manual');
      setAutoSkipEnabled(true);
    }
  }, []);

  // Save skip bet state to localStorage when it changes
  const saveToStorage = useCallback((mode, reason, autoEnabled) => {
    try {
      const state = {
        skipBetMode: Boolean(mode),
        skipBetReason: typeof reason === 'string' ? reason : 'Manual',
        autoSkipEnabled: Boolean(autoEnabled),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('monopolySkipBetState', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save skip bet state to localStorage:', error);
    }
  }, []);

  /**
   * Toggle skip bet mode manually
   * @param {string} reason - Optional reason for the change
   */
  const toggleSkipBetMode = useCallback((reason = 'Manual') => {
    const newMode = !skipBetMode;
    const safeReason = typeof reason === 'string' ? reason : 'Manual';
    const newReason = newMode ? safeReason : 'Manual';
    
    setSkipBetMode(newMode);
    setSkipBetReason(newReason);
    saveToStorage(newMode, newReason, autoSkipEnabled);
  }, [skipBetMode, autoSkipEnabled, saveToStorage]);

  /**
   * Enable skip bet mode with reason
   * @param {string} reason - Reason for enabling skip bet
   */
  const enableSkipBet = useCallback((reason = 'Manual') => {
    if (!skipBetMode) {
      const safeReason = typeof reason === 'string' ? reason : 'Manual';
      setSkipBetMode(true);
      setSkipBetReason(safeReason);
      saveToStorage(true, safeReason, autoSkipEnabled);
    }
  }, [skipBetMode, autoSkipEnabled, saveToStorage]);

  /**
   * Disable skip bet mode
   * @param {string} reason - Reason for disabling skip bet
   */
  const disableSkipBet = useCallback((reason = 'Manual') => {
    if (skipBetMode) {
      const safeReason = typeof reason === 'string' ? reason : 'Manual';
      setSkipBetMode(false);
      setSkipBetReason(safeReason);
      saveToStorage(false, safeReason, autoSkipEnabled);
    }
  }, [skipBetMode, autoSkipEnabled, saveToStorage]);

  /**
   * Handle auto-skip suggestions from hot zone analysis
   * @param {Object} suggestions - Auto-skip suggestions from hot zone
   */
  const handleAutoSkipSuggestions = useCallback((suggestions) => {
    if (!autoSkipEnabled || !suggestions) return;

    if (suggestions.shouldEnableSkipBet && !skipBetMode) {
      enableSkipBet('Hot Zone: Zone is cooling/cold');
    } else if (suggestions.shouldDisableSkipBet && skipBetMode && skipBetReason.includes('Hot Zone')) {
      disableSkipBet('Hot Zone: Zone is warming/hot');
    }
  }, [autoSkipEnabled, skipBetMode, skipBetReason, enableSkipBet, disableSkipBet]);

  /**
   * Toggle auto-skip functionality
   */
  const toggleAutoSkip = useCallback(() => {
    const newAutoEnabled = !autoSkipEnabled;
    setAutoSkipEnabled(newAutoEnabled);
    saveToStorage(skipBetMode, skipBetReason, newAutoEnabled);
  }, [autoSkipEnabled, skipBetMode, skipBetReason, saveToStorage]);

  /**
   * Check if a bet should be skipped based on current state
   * @returns {Object} - { shouldSkip: boolean, reason: string }
   */
  const shouldSkipBet = useCallback(() => {
    return {
      shouldSkip: skipBetMode,
      reason: skipBetMode ? skipBetReason : null
    };
  }, [skipBetMode, skipBetReason]);

  /**
   * Get skip bet statistics from localStorage
   * @returns {Object} - Statistics about skip bet usage
   */
  const getSkipBetStats = useCallback(() => {
    try {
      const saved = localStorage.getItem('monopolySkipBetStats');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load skip bet stats:', error);
    }
    
    return {
      totalToggles: 0,
      manualToggles: 0,
      autoToggles: 0,
      timeInSkipMode: 0,
      lastToggle: null
    };
  }, []);

  /**
   * Update skip bet statistics
   * @param {boolean} wasAuto - Whether the toggle was automatic
   */
  const updateSkipBetStats = useCallback((wasAuto = false) => {
    try {
      const stats = getSkipBetStats();
      const now = new Date().toISOString();
      
      const updatedStats = {
        ...stats,
        totalToggles: stats.totalToggles + 1,
        manualToggles: wasAuto ? stats.manualToggles : stats.manualToggles + 1,
        autoToggles: wasAuto ? stats.autoToggles + 1 : stats.autoToggles,
        lastToggle: now
      };
      
      localStorage.setItem('monopolySkipBetStats', JSON.stringify(updatedStats));
    } catch (error) {
      console.warn('Failed to update skip bet stats:', error);
    }
  }, [getSkipBetStats]);

  /**
   * Clear skip bet data (for reset/testing purposes)
   */
  const clearSkipBetData = useCallback(() => {
    setSkipBetMode(false);
    setSkipBetReason('Manual');
    setAutoSkipEnabled(true);
    
    try {
      localStorage.removeItem('monopolySkipBetState');
      localStorage.removeItem('monopolySkipBetStats');
    } catch (error) {
      console.warn('Failed to clear skip bet data:', error);
    }
  }, []);

  return {
    // State
    skipBetMode,
    skipBetReason,
    autoSkipEnabled,
    
    // Actions
    toggleSkipBetMode,
    enableSkipBet,
    disableSkipBet,
    toggleAutoSkip,
    handleAutoSkipSuggestions,
    
    // Utilities
    shouldSkipBet,
    getSkipBetStats,
    updateSkipBetStats,
    clearSkipBetData
  };
}; 