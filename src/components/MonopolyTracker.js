import React, { useState, useEffect, useCallback } from 'react';

const MonopolyTracker = () => {
  const [results, setResults] = useState([]);
  const [resultTimestamps, setResultTimestamps] = useState([]);
  const [activeTab, setActiveTab] = useState('tracker');
  const [totalBets, setTotalBets] = useState(0);
  const [successfulBets, setSuccessfulBets] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Session management state - simplified
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [startingCapital, setStartingCapital] = useState(0);
  const [currentCapital, setCurrentCapital] = useState(0);
  const [baseBet, setBaseBet] = useState(0);
  const [currentBetAmount, setCurrentBetAmount] = useState(0);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  const [sessionProfit, setSessionProfit] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionEndTime, setSessionEndTime] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [highestMartingale, setHighestMartingale] = useState(0);
  
  // Simplified chance state - just track if we have a pending multiplier
  const [pendingMultiplier, setPendingMultiplier] = useState(1);
  
  // Simplified betting history - just basic tracking
  const [lastBetAmount, setLastBetAmount] = useState(0);
  const [lastBetWon, setLastBetWon] = useState(false);

  // Load data from localStorage on component mount - simplified
  useEffect(() => {
    const savedData = localStorage.getItem('monopolyTrackerData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setResults(data.results || []);
        setResultTimestamps(data.resultTimestamps || []);
        setTotalBets(data.totalBets || 0);
        setSuccessfulBets(data.successfulBets || 0);
        setSessionActive(data.sessionActive || false);
        setStartingCapital(data.startingCapital || 0);
        setCurrentCapital(data.currentCapital || 0);
        setBaseBet(data.baseBet || 0);
        setCurrentBetAmount(data.currentBetAmount || 0);
        setConsecutiveLosses(data.consecutiveLosses || 0);
        setSessionProfit(data.sessionProfit || 0);
        setSessionStartTime(data.sessionStartTime || null);
        setSessionEndTime(data.sessionEndTime || null);
        
        // Simplified session history - keep only last 5 sessions
        const recentSessions = (data.sessionHistory || []).slice(-5);
        setSessionHistory(recentSessions);
        
        setHighestMartingale(data.highestMartingale || 0);
        setPendingMultiplier(data.pendingMultiplier || 1);
        setLastBetAmount(data.lastBetAmount || 0);
        setLastBetWon(data.lastBetWon || false);
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
    setDataLoaded(true);
  }, []);

  // Save data to localStorage - simplified
  useEffect(() => {
    if (dataLoaded) {
      const dataToSave = {
        results,
        resultTimestamps,
        totalBets,
        successfulBets,
        sessionActive,
        startingCapital,
        currentCapital,
        baseBet,
        currentBetAmount,
        consecutiveLosses,
        sessionProfit,
        sessionStartTime,
        sessionEndTime,
        sessionHistory: sessionHistory.slice(-5), // Always keep only last 5
        highestMartingale,
        pendingMultiplier,
        lastBetAmount,
        lastBetWon
      };
      localStorage.setItem('monopolyTrackerData', JSON.stringify(dataToSave));
    }
  }, [dataLoaded, results, resultTimestamps, totalBets, successfulBets, sessionActive, startingCapital, currentCapital, baseBet, currentBetAmount, consecutiveLosses, sessionProfit, sessionStartTime, sessionEndTime, sessionHistory, highestMartingale, pendingMultiplier, lastBetAmount, lastBetWon]);

  // Calculate Martingale bet amount
  const calculateMartingaleBet = (baseBet, losses) => {
    return baseBet * Math.pow(2, losses);
  };

  // Update current bet amount based on consecutive losses
  useEffect(() => {
    if (sessionActive && baseBet > 0) {
      const newBetAmount = calculateMartingaleBet(baseBet, consecutiveLosses);
      setCurrentBetAmount(newBetAmount);
    }
  }, [consecutiveLosses, baseBet, sessionActive]);

  // Auto-show session modal on initial load if no history exists
  useEffect(() => {
    if (dataLoaded && results.length === 0 && !sessionActive && !sessionStartTime && !sessionEndTime) {
      setShowSessionModal(true);
    }
  }, [dataLoaded, results.length, sessionActive, sessionStartTime, sessionEndTime]);

  // Simplified session archiving
  const archiveCurrentSession = (customEndTime = null) => {
    if (sessionStartTime && results.length > 0) {
      const endTime = customEndTime || sessionEndTime || new Date().toISOString();
      const duration = sessionStartTime ? (() => {
        const start = new Date(sessionStartTime);
        const end = new Date(endTime);
        const diff = end - start;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
      })() : 'N/A';
      
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
        winRate: totalBets > 0 ? ((successfulBets / totalBets) * 100).toFixed(1) : 0,
        highestMartingale,
        duration
      };
      
      // Keep only last 5 sessions (including the new one)
      setSessionHistory(prev => [...prev, currentSession].slice(-5));
    }
  };

  // Session initialization
  const initializeSession = (startCapital, baseBetAmount) => {
    // Archive current session if it exists
    archiveCurrentSession();
    
    // Clear current session data for fresh start
    setResults([]);
    setResultTimestamps([]);
    setTotalBets(0);
    setSuccessfulBets(0);
    setConsecutiveLosses(0);
    setHighestMartingale(0);
    setPendingMultiplier(1);
    setLastBetAmount(0);
    setLastBetWon(false);
    
    // Set new session parameters
    setStartingCapital(startCapital);
    setCurrentCapital(startCapital);
    setBaseBet(baseBetAmount);
    setCurrentBetAmount(baseBetAmount);
    setSessionProfit(0);
    setSessionActive(true);
    setShowSessionModal(false);
    setSessionStartTime(new Date().toISOString());
    setSessionEndTime(null);
  };

  // Simplified session bet handling
  const handleSessionBet = (betAmount, won, isMultiplier = false) => {
    if (!sessionActive) return;
    
    // Track highest martingale bet amount
    if (betAmount >= highestMartingale) {
      setHighestMartingale(betAmount);
    }
    
    // Track last bet for simplified undo
    setLastBetAmount(betAmount);
    setLastBetWon(won);
    
    if (won) {
      // Win: Calculate winnings (with multiplier if applicable)
      const winAmount = isMultiplier ? betAmount * pendingMultiplier : betAmount;
      const newCapital = currentCapital + winAmount;
      setCurrentCapital(newCapital);
      setConsecutiveLosses(0);
      setCurrentBetAmount(baseBet);
      setSuccessfulBets(prev => prev + 1);
      setSessionProfit(newCapital - startingCapital);
      
      // Reset multiplier after use
      if (isMultiplier) {
        setPendingMultiplier(1);
      }
    } else {
      // Loss: Subtract bet amount from capital, increment consecutive losses
      const newCapital = currentCapital - betAmount;
      setCurrentCapital(newCapital);
      const newConsecutiveLosses = consecutiveLosses + 1;
      setConsecutiveLosses(newConsecutiveLosses);
      const newBetAmount = calculateMartingaleBet(baseBet, newConsecutiveLosses);
      setCurrentBetAmount(newBetAmount);
      setSessionProfit(newCapital - startingCapital);
      
      // Reset multiplier after loss
      setPendingMultiplier(1);
    }
    
    setTotalBets(prev => prev + 1);
  };

  // Analysis functions
  const analyzeOnesPattern = useCallback(() => {
    const last50 = results.slice(-50);
    const onesCount = last50.filter(r => r === '1').length;
    const onesFrequency = last50.length > 0 ? (onesCount / last50.length) * 100 : 0;
    
    // Find current dry spell (consecutive non-1s)
    let currentDrySpell = 0;
    for (let i = results.length - 1; i >= 0; i--) {
      if (results[i] === '1') break;
      currentDrySpell++;
    }

    return {
      onesFrequency: onesFrequency.toFixed(1),
      currentDrySpell,
      last50Count: onesCount,
      totalResults: results.length
    };
  }, [results]);

  // Pattern detection functions
  const analyzeLastThreeRolls = useCallback(() => {
    const last3 = results.slice(-3);
    return {
      pattern: last3.join(','),
      hasOne: last3.includes('1'),
      rolls: last3,
      length: last3.length
    };
  }, [results]);

  const analyzeLastTwoRolls = useCallback(() => {
    const last2 = results.slice(-2);
    return {
      pattern: last2.join(','),
      hasOne: last2.includes('1'),
      rolls: last2,
      length: last2.length
    };
  }, [results]);

  const isGoodPattern = useCallback(() => {
    const last3 = results.slice(-3);
    const last2 = results.slice(-2);
    const last5 = results.slice(-5);
    
    // Check if we have enough data
    if (last2.length < 2) {
      return { isGood: false, reason: 'Insufficient data (need at least 2 rolls)' };
    }
    
    // Count ones in last 3 rolls (or last 2 if we only have 2 rolls)
    const rollsToCheck = last3.length >= 3 ? last3 : last2;
    const onesCount = rollsToCheck.filter(r => r === '1').length;
    const pattern = rollsToCheck.join(',');
    
    // Good pattern: Any pattern with 1 or 2 ones in recent rolls
    if (onesCount >= 1 && onesCount <= 2) {
      return { 
        isGood: true, 
        reason: `Good pattern: ${pattern} (${onesCount} ones in last ${rollsToCheck.length} rolls)` 
      };
    }
    
    // Bad pattern: No ones in last 3-5 rolls
    const last5OnesCount = last5.filter(r => r === '1').length;
    if (onesCount === 0) {
      if (last5OnesCount === 0 && last5.length >= 5) {
        return { 
          isGood: false, 
          reason: `Bad pattern: ${pattern} (no "1" in last 5 rolls: ${last5.join(',')})` 
        };
      } else if (last5OnesCount === 0 && last5.length >= 3) {
        return { 
          isGood: false, 
          reason: `Bad pattern: ${pattern} (no "1" in last ${last5.length} rolls: ${last5.join(',')})` 
        };
      } else {
        return { 
          isGood: false, 
          reason: `Bad pattern: ${pattern} (no "1" in last ${rollsToCheck.length} rolls)` 
        };
      }
    }
    
    // Edge case: More than 2 ones (extremely rare, but handle it)
    if (onesCount > 2) {
      return { 
        isGood: true, 
        reason: `Excellent pattern: ${pattern} (${onesCount} ones in last ${rollsToCheck.length} rolls - very strong)` 
      };
    }
    
    return { isGood: false, reason: 'Unexpected pattern state' };
  }, [results]);

  const getBettingRecommendation = useCallback(() => {
    // eslint-disable-next-line no-unused-vars
    const analysis = analyzeOnesPattern();
    
    // Use the actual consecutive losses from our betting decisions (not game results)
    const actualConsecutiveLosses = consecutiveLosses;
    
    // Expected Value calculation (40.74% win rate on "1" segment)
    const expectedValue = (0.4074 * 1) - (0.5926 * 1); // Win 1x bet / Lose 1x bet
    
    // Streak prevention logic
    const streakRisk = actualConsecutiveLosses >= 3 ? 'HIGH' : 
                      actualConsecutiveLosses >= 2 ? 'MEDIUM' : 'LOW';
    
    // Get pattern analysis
    const patternAnalysis = isGoodPattern();
    const last3Analysis = analyzeLastThreeRolls();
    const last2Analysis = analyzeLastTwoRolls();
    
    // Dynamic betting decision
    let shouldBet = false;
    let confidence = 50;
    let reason = '';
    let bettingMode = 'NONE';

    // SAFETY LIMIT CHECK - ALWAYS FIRST
    if (actualConsecutiveLosses >= 7) {
      shouldBet = false;
      confidence = 99;
      reason = `💀 SAFETY LIMIT: ${actualConsecutiveLosses} losses - Next bet ₱${calculateMartingaleBet(baseBet, actualConsecutiveLosses)} - MAXIMUM RISK REACHED`;
      bettingMode = 'SAFETY_LIMIT';
    }
    else {
      // SIMPLE PATTERN-BASED BETTING
      if (patternAnalysis.isGood) {
        shouldBet = true;
        confidence = 85;
        reason = `✅ GOOD PATTERN: ${patternAnalysis.reason} - Safe to bet`;
        bettingMode = 'GOOD_PATTERN';
      } else {
        shouldBet = false;
        confidence = 85;
        reason = `❌ BAD PATTERN: ${patternAnalysis.reason} - Waiting for 1 or good pattern`;
        bettingMode = 'BAD_PATTERN';
      }
    }

    return {
      shouldBet,
      confidence: confidence.toFixed(0),
      reason,
      streakRisk,
      consecutiveLosses: actualConsecutiveLosses,
      expectedValue: expectedValue.toFixed(2),
      bettingMode,
      // Pattern data
      patternAnalysis,
      last3Analysis,
      last2Analysis
    };
  }, [analyzeOnesPattern, consecutiveLosses, baseBet, isGoodPattern, analyzeLastThreeRolls, analyzeLastTwoRolls]);

  // Simplified result handling
  const handleAddResult = (result) => {
    // Special handling for "Chance" - simplified
    if (result === 'chance') {
      const currentRecommendation = getBettingRecommendation();
      const shouldBet = sessionActive && currentRecommendation.shouldBet && currentBetAmount <= currentCapital;
      
      if (shouldBet) {
        // Show simplified chance modal
        setShowChanceModal(true);
      } else {
        // No bet placed, just add result
        addResult(result);
      }
      return;
    }
    
    // Check for pending multiplier
    if (pendingMultiplier > 1 && sessionActive) {
      const shouldBet = sessionActive && currentBetAmount <= currentCapital;
      const won = result === '1';
      
      if (shouldBet) {
        handleSessionBet(currentBetAmount, won, true); // true = is multiplier bet
      }
    } else {
      // Regular processing
      const currentRecommendation = getBettingRecommendation();
      
      if (sessionActive && currentRecommendation.shouldBet && currentBetAmount <= currentCapital) {
        const won = result === '1';
        handleSessionBet(currentBetAmount, won, false);
      }
    }
    
    // Add the result
    addResult(result);
  };

  // Helper function to add result
  const addResult = (result) => {
    const timestamp = new Date().toISOString();
    const newResults = [...results, result];
    const newTimestamps = [...resultTimestamps, timestamp];
    setResults(newResults);
    setResultTimestamps(newTimestamps);
  };

  // Simplified chance handling
  const handleChanceMultiplier = () => {
    setPendingMultiplier(2); // Fixed 2x multiplier
    setShowChanceModal(false);
    addResult('chance');
  };

  const handleChanceCash = (cashAmount) => {
    // Add cash to capital and reset martingale
    const newCapital = currentCapital + cashAmount;
    setCurrentCapital(newCapital);
    setSessionProfit(newCapital - startingCapital);
    setConsecutiveLosses(0);
    setCurrentBetAmount(baseBet);
    
    // Track as a winning "bet" for stats
    setSuccessfulBets(prev => prev + 1);
    setTotalBets(prev => prev + 1);
    
    setShowChanceModal(false);
    addResult('chance');
  };

  // Simplified undo function
  const handleUndo = () => {
    if (results.length === 0) {
      alert('No results to undo');
      return;
    }
    
    const lastResult = results[results.length - 1];
    const newResults = results.slice(0, -1);
    const newTimestamps = resultTimestamps.slice(0, -1);
    setResults(newResults);
    setResultTimestamps(newTimestamps);
    
    // Simple undo for betting if there was a last bet
    if (sessionActive && lastBetAmount > 0) {
      if (lastBetWon) {
        // Undo win: subtract amount from capital
        const newCapital = currentCapital - lastBetAmount;
        setCurrentCapital(newCapital);
        setSuccessfulBets(prev => Math.max(0, prev - 1));
      } else {
        // Undo loss: add amount back to capital
        const newCapital = currentCapital + lastBetAmount;
        setCurrentCapital(newCapital);
      }
      
      setTotalBets(prev => Math.max(0, prev - 1));
      setSessionProfit(currentCapital - startingCapital);
      
      // Reset last bet tracking
      setLastBetAmount(0);
      setLastBetWon(false);
    }
    
    // Reset any pending multiplier
    setPendingMultiplier(1);
    
    alert(`✅ Undid: ${lastResult.toUpperCase()}`);
  };

  // Simplified export function - only basic CSV export
  const exportToCSV = () => {
    // Create headers
    const headers = ['Spin Number', 'Result', 'Timestamp'];
    
    // Session info
    const sessionInfo = [
      ['Session Start', sessionStartTime ? new Date(sessionStartTime).toLocaleString() : 'N/A'],
      ['Session End', sessionEndTime ? new Date(sessionEndTime).toLocaleString() : 'Current Session'],
      ['Starting Capital', sessionActive ? `₱${startingCapital.toFixed(2)}` : 'N/A'],
      ['Current Capital', sessionActive ? `₱${currentCapital.toFixed(2)}` : 'N/A'],
      ['Session P/L', sessionActive ? `₱${sessionProfit.toFixed(2)}` : 'N/A'],
      [''],
      headers
    ];
    
    // Add results with timestamps
    const results_with_time = results.map((result, index) => {
      const resultTimestamp = resultTimestamps[index] || new Date().toISOString();
      return [
        index + 1,
        result.toUpperCase(),
        resultTimestamp ? new Date(resultTimestamp).toLocaleString() : 'N/A'
      ];
    });
    
    const csvContent = [
      ...sessionInfo,
      ...results_with_time
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monopoly-live-session-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Simplified copy function
  const copyToClipboard = async () => {
    if (results.length === 0) {
      alert('No results to copy');
      return;
    }

    // Join results with commas in chronological order
    const textToCopy = results.join(',');
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      alert(`✅ Copied ${results.length} results to clipboard!\nFormat: ${textToCopy.substring(0, 50)}${textToCopy.length > 50 ? '...' : ''}`);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert(`✅ Copied ${results.length} results to clipboard!\nFormat: ${textToCopy.substring(0, 50)}${textToCopy.length > 50 ? '...' : ''}`);
    }
  };

  const clearCurrentSession = () => {
    if (window.confirm('🚨 Are you sure you want to clear the current session? This will only clear current session data and keep previous sessions. This action cannot be undone.')) {
      // Archive current session if it exists and has data
      if (sessionActive && results.length > 0) {
        archiveCurrentSession();
      }
      
      // Clear only current session data
      setResults([]);
      setResultTimestamps([]);
      setTotalBets(0);
      setSuccessfulBets(0);
      setSessionActive(false);
      setStartingCapital(0);
      setCurrentCapital(0);
      setBaseBet(0);
      setCurrentBetAmount(0);
      setConsecutiveLosses(0);
      setSessionProfit(0);
      setSessionStartTime(null);
      setSessionEndTime(null);
      setHighestMartingale(0);
      setPendingMultiplier(1);
      setLastBetAmount(0);
      setLastBetWon(false);
      
      alert('✅ Current session cleared! Previous sessions preserved.');
    }
  };

  const resetHistory = () => {
    if (window.confirm('🚨 Are you sure you want to clear ALL history including all previous sessions? This will reset everything for a fresh start. This action cannot be undone.')) {
      setResults([]);
      setResultTimestamps([]);
      setTotalBets(0);
      setSuccessfulBets(0);
      if (sessionActive) {
        setSessionEndTime(new Date().toISOString());
      }
      setSessionActive(false);
      setStartingCapital(0);
      setCurrentCapital(0);
      setBaseBet(0);
      setCurrentBetAmount(0);
      setConsecutiveLosses(0);
      setSessionProfit(0);
      setSessionStartTime(null);
      setSessionEndTime(null);
      setSessionHistory([]);
      setHighestMartingale(0);
      setPendingMultiplier(1);
      setLastBetAmount(0);
      setLastBetWon(false);
      // Clear localStorage
      localStorage.removeItem('monopolyTrackerData');
      alert('✅ All history cleared! Ready for a fresh start.');
    }
  };

  // eslint-disable-next-line no-unused-vars
  const analysis = analyzeOnesPattern();
  const recommendation = getBettingRecommendation();
  const [showChanceModal, setShowChanceModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Session Modal */}
        {showSessionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">🎯 Start New Session</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const startCapital = parseFloat(formData.get('startingCapital'));
                  const baseBetAmount = parseFloat(formData.get('baseBet'));
                  
                  if (startCapital <= 0 || baseBetAmount <= 0) {
                    alert('Please enter valid amounts greater than 0');
                    return;
                  }
                  
                  if (baseBetAmount > startCapital) {
                    alert('Base bet cannot be greater than starting capital');
                    return;
                  }
                  
                  initializeSession(startCapital, baseBetAmount);
                }}
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Capital (₱)
                  </label>
                  <input
                    type="number"
                    name="startingCapital"
                    step="0.01"
                    placeholder="e.g., 2000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Bet Amount (₱)
                  </label>
                  <input
                    type="number"
                    name="baseBet"
                    step="0.01"
                    placeholder="e.g., 10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSessionModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Session
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🎯 Monopoly Live - Strategy Tracker
              </h1>
              <p className="text-gray-600">
                Advanced pattern analysis for optimal "1" betting strategy
              </p>
            </div>
            <div className="flex gap-3">
              {!sessionActive ? (
                <button
                  onClick={() => setShowSessionModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  💰 Start Session
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (window.confirm('End current session? This will archive the session to history and stop tracking.')) {
                        const endTime = new Date().toISOString();
                        setSessionEndTime(endTime);
                        
                        // Archive session using the unified function with the end time
                        archiveCurrentSession(endTime);
                        
                        setSessionActive(false);
                        alert('✅ Session ended and archived to history!');
                      }
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                  >
                    ⏹️ End Session
                  </button>
                  <button
                    onClick={clearCurrentSession}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    🗑️ Clear All
                  </button>
                </div>
              )}
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Results</div>
                <div className="text-xl font-bold text-blue-600">{results.length}</div>
              </div>
            </div>
          </div>
          
          {/* Session Stats */}
          {(sessionActive || sessionEndTime) && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Current Capital</div>
                  <div className={`text-lg font-bold ${currentCapital >= startingCapital ? 'text-green-600' : 'text-red-600'}`}>
                    ₱{currentCapital.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Next Bet</div>
                  <div className="text-lg font-bold text-blue-600">₱{currentBetAmount.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Session P/L</div>
                  <div className={`text-lg font-bold ${sessionProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {sessionProfit >= 0 ? '+' : ''}₱{sessionProfit.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Win Rate</div>
                  <div className="text-lg font-bold text-purple-600">
                    {totalBets > 0 ? ((successfulBets / totalBets) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Session Start</div>
                  <div className="text-sm font-bold text-gray-700">
                    {sessionStartTime ? new Date(sessionStartTime).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Session End</div>
                  <div className="text-sm font-bold text-gray-700">
                    {sessionEndTime ? new Date(sessionEndTime).toLocaleString() : 'Active'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Session Duration</div>
                  <div className="text-sm font-bold text-gray-700">
                    {sessionStartTime ? (() => {
                      const start = new Date(sessionStartTime);
                      const end = sessionEndTime ? new Date(sessionEndTime) : new Date();
                      const diff = end - start;
                      const hours = Math.floor(diff / (1000 * 60 * 60));
                      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                      return `${hours}h ${minutes}m`;
                    })() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation - Simplified to 2 tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            {[
              { id: 'tracker', label: '🎮 Live Tracker', desc: 'Quick-click results & get recommendations' },
              { id: 'history', label: '📜 History', desc: 'View session history' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 p-4 text-left transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold">{tab.label}</div>
                <div className="text-sm text-gray-600">{tab.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Tracker Tab */}
        {activeTab === 'tracker' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Prominent Martingale Display */}
              {sessionActive && (
                <div className={`bg-white rounded-lg shadow-lg p-6 border-4 ${
                  recommendation.shouldBet ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                }`}>
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-700 mb-1">MARTINGALE BET</div>
                      <div className="text-4xl font-bold text-blue-600">
                        ₱{currentBetAmount.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {consecutiveLosses === 0 ? 'Base bet' : `Martingale x${Math.pow(2, consecutiveLosses)}`}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${
                        recommendation.shouldBet ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {recommendation.shouldBet ? '✅ BET' : '❌ SKIP'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {recommendation.shouldBet ? 'Place bet on "1"' : 'Do not bet'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {recommendation.confidence}% confidence
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pending Multiplier Indicator */}
              {pendingMultiplier > 1 && (
                <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🎯</div>
                    <div>
                      <div className="font-bold text-yellow-800">
                        {`Pending Multiplier: ${pendingMultiplier}x`}
                      </div>
                      <div className="text-sm text-yellow-700">
                        {`Win = ₱${currentBetAmount} × ${pendingMultiplier} = ₱${(currentBetAmount * pendingMultiplier).toFixed(2)} if "1"`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Result Entry</h2>
                
                {/* Main Result Buttons */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <button
                    onClick={() => handleAddResult('1')}
                    className="h-16 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white text-xl font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  >
                    <div>1</div>
                    <div className="text-xs font-normal">40.74%</div>
                  </button>
                  <button
                    onClick={() => handleAddResult('2')}
                    className="h-16 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xl font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  >
                    <div>2</div>
                    <div className="text-xs font-normal">27.78%</div>
                  </button>
                  <button
                    onClick={() => handleAddResult('5')}
                    className="h-16 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xl font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  >
                    <div>5</div>
                    <div className="text-xs font-normal">12.96%</div>
                  </button>
                  <button
                    onClick={() => handleAddResult('10')}
                    className="h-16 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xl font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  >
                    <div>10</div>
                    <div className="text-xs font-normal">7.41%</div>
                  </button>
                </div>
                
                {/* Bonus/Special Buttons */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <button
                    onClick={() => handleAddResult('chance')}
                    className="h-12 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  >
                    <div>CHANCE</div>
                    <div className="text-xs font-normal">3.70%</div>
                  </button>
                  <button
                    onClick={() => handleAddResult('2rolls')}
                    className="h-12 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  >
                    <div>2 ROLLS</div>
                    <div className="text-xs font-normal">5.56%</div>
                  </button>
                  <button
                    onClick={() => handleAddResult('4rolls')}
                    className="h-12 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  >
                    <div>4 ROLLS</div>
                    <div className="text-xs font-normal">1.85%</div>
                  </button>
                </div>
                
                {/* Undo Button */}
                <button
                  onClick={handleUndo}
                  className="w-full h-12 bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <span className="text-lg">↶</span>
                  <span>UNDO LAST RESULT</span>
                </button>
              </div>

              {/* Recent Results */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Recent Results <span className="text-sm font-normal text-gray-500">(Latest → Oldest)</span></h2>
                  <div className="flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={exportToCSV}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      📊 CSV
                    </button>
                  </div>
                </div>
                {results.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🎲</div>
                    <div className="text-gray-500">No results yet - start your fresh session!</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-10 gap-2">
                    {/* Display current session results - newest first (left to right, top to bottom) */}
                    {[...results].reverse().slice(0, 20).map((result, index) => {
                      const getResultStyle = (result) => {
                        switch (result) {
                          case '1':
                            return 'bg-gray-200 text-gray-800 border-2 border-gray-600';
                          case '2':
                            return 'bg-green-100 text-green-800 border-2 border-green-600';
                          case '5':
                            return 'bg-red-100 text-red-800 border-2 border-red-600';
                          case '10':
                            return 'bg-blue-100 text-blue-800 border-2 border-blue-600';
                          case 'chance':
                            return 'bg-purple-100 text-purple-800 border-2 border-purple-600';
                          case '2rolls':
                            return 'bg-gray-200 text-gray-800 border-2 border-gray-600';
                          case '4rolls':
                            return 'bg-yellow-100 text-yellow-800 border-2 border-yellow-600';
                          default:
                            return 'bg-gray-100 text-gray-700';
                        }
                      };

                      const getDisplayText = (result) => {
                        switch (result) {
                          case 'chance':
                            return 'C';
                          case '2rolls':
                            return '2R';
                          case '4rolls':
                            return '4R';
                          default:
                            return result.toUpperCase();
                        }
                      };

                      return (
                        <div
                          key={index}
                          className={`px-3 py-2 rounded-lg text-center font-semibold ${getResultStyle(result)}`}
                          title={`Result: ${result.toUpperCase()}\nTime: ${resultTimestamps[results.length - 1 - index] ? new Date(resultTimestamps[results.length - 1 - index]).toLocaleString() : 'N/A'}`}
                        >
                          {getDisplayText(result)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recommendation Panel */}
            <div className="space-y-6">
              <div className={`bg-white rounded-lg shadow-lg p-6 ${
                recommendation.shouldBet ? 'ring-2 ring-green-500 pulse-green' : 'ring-2 ring-red-500 pulse-red'
              }`}>
                <h2 className="text-xl font-semibold mb-4">Betting Recommendation</h2>
                
                {/* Streak Risk Alert */}
                <div className={`mb-4 p-3 rounded-lg border-2 ${
                  recommendation.streakRisk === 'HIGH' ? 'bg-red-50 border-red-300' :
                  recommendation.streakRisk === 'MEDIUM' ? 'bg-yellow-50 border-yellow-300' :
                  'bg-green-50 border-green-300'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-sm">Streak Risk: </span>
                      <span className={`font-bold ${
                        recommendation.streakRisk === 'HIGH' ? 'text-red-600' :
                        recommendation.streakRisk === 'MEDIUM' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {recommendation.streakRisk}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Consecutive Losses</div>
                      <div className={`text-xl font-bold ${
                        recommendation.consecutiveLosses >= 3 ? 'text-red-600' :
                        recommendation.consecutiveLosses >= 2 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {recommendation.consecutiveLosses}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`text-center p-4 rounded-lg ${
                  recommendation.shouldBet ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className={`text-2xl font-bold ${
                    recommendation.shouldBet ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {recommendation.shouldBet ? '✅ BET ON 1' : '❌ SKIP BET'}
                  </div>
                  <div className="text-sm mt-2 text-gray-600">
                    Confidence: {recommendation.confidence}%
                  </div>
                  <div className="text-sm mt-2 text-gray-700">
                    {recommendation.reason}
                  </div>
                  <div className="text-xs mt-2 text-gray-500">
                    Expected Value: {(parseFloat(recommendation.expectedValue) * 100).toFixed(1)}% per bet
                  </div>
                </div>

                {/* Pattern Analysis */}
                <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                  <h2 className="text-xl font-semibold mb-4">🎯 Pattern Analysis</h2>
                  <div className="space-y-4">
                    {/* Last 3 Rolls */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Last 3 Rolls</h3>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-lg">
                          {recommendation.last3Analysis.length >= 3 ? 
                            recommendation.last3Analysis.pattern : 
                            'Need 3+ rolls'}
                        </span>
                        <span className={`px-2 py-1 rounded text-sm ${
                          recommendation.last3Analysis.hasOne ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {recommendation.last3Analysis.hasOne ? 'Has 1' : 'No 1'}
                        </span>
                      </div>
                    </div>

                    {/* Last 2 Rolls */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Last 2 Rolls</h3>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-lg">
                          {recommendation.last2Analysis.length >= 2 ? 
                            recommendation.last2Analysis.pattern : 
                            'Need 2+ rolls'}
                        </span>
                        <span className={`px-2 py-1 rounded text-sm ${
                          recommendation.last2Analysis.hasOne ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {recommendation.last2Analysis.hasOne ? 'Has 1' : 'No 1'}
                        </span>
                      </div>
                    </div>

                    {/* Pattern Status */}
                    <div className={`border rounded-lg p-4 ${
                      recommendation.patternAnalysis.isGood ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Pattern Status</h3>
                        <span className={`px-3 py-1 rounded text-sm font-semibold ${
                          recommendation.patternAnalysis.isGood ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {recommendation.patternAnalysis.isGood ? 'GOOD' : 'BAD'}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-700">
                        {recommendation.patternAnalysis.reason}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Essential Stats - Merged from Analytics */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Essential Stats</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Consecutive Losses:</span>
                    <span className={`font-semibold ${
                      recommendation.consecutiveLosses >= 3 ? 'text-red-600' : 
                      recommendation.consecutiveLosses >= 2 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {recommendation.consecutiveLosses}/7 max
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Streak Risk Level:</span>
                    <span className={`font-semibold ${
                      recommendation.streakRisk === 'HIGH' ? 'text-red-600' :
                      recommendation.streakRisk === 'MEDIUM' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {recommendation.streakRisk}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>1s Frequency (Last 50):</span>
                    <span className={`font-semibold ${
                      analysis.onesFrequency < 30 ? 'text-red-600' : 
                      analysis.onesFrequency < 35 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {analysis.onesFrequency}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected Win Rate:</span>
                    <span className="font-semibold text-blue-600">40.74%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Session Win Rate:</span>
                    <span className="font-semibold text-purple-600">
                      {totalBets > 0 ? ((successfulBets / totalBets) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab - Simplified to last 5 sessions */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Current Session */}
            {(sessionActive || results.length > 0) && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Current Session</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      📋 Copy Results
                    </button>
                    <button
                      onClick={exportToCSV}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      📊 Export CSV
                    </button>
                  </div>
                </div>
                
                {results.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🎯</div>
                    <div className="text-gray-500">No results in current session</div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-12 gap-1 max-h-96 overflow-y-auto">
                      {results.map((result, index) => {
                        const getHistoryResultStyle = (result) => {
                          switch (result) {
                            case '1':
                              return 'bg-gray-200 text-gray-800 font-bold';
                            case '2':
                              return 'bg-green-100 text-green-800 font-bold';
                            case '5':
                              return 'bg-red-100 text-red-800 font-bold';
                            case '10':
                              return 'bg-blue-100 text-blue-800 font-bold';
                            case 'chance':
                              return 'bg-purple-100 text-purple-800 font-bold';
                            case '2rolls':
                              return 'bg-gray-200 text-gray-800 font-bold';
                            case '4rolls':
                              return 'bg-yellow-100 text-yellow-800 font-bold';
                            default:
                              return 'bg-gray-100 text-gray-700';
                          }
                        };

                        const getHistoryDisplayText = (result) => {
                          switch (result) {
                            case 'chance':
                              return 'C';
                            case '2rolls':
                              return '2R';
                            case '4rolls':
                              return '4R';
                            default:
                              return result.toUpperCase();
                          }
                        };

                        return (
                          <div
                            key={index}
                            className={`px-2 py-1 text-xs text-center rounded ${getHistoryResultStyle(result)}`}
                            title={`Spin ${index + 1}: ${result.toUpperCase()}\nTime: ${resultTimestamps[index] ? new Date(resultTimestamps[index]).toLocaleString() : 'N/A'}`}
                          >
                            {getHistoryDisplayText(result)}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-4 text-sm text-gray-600">
                      Total Results: {results.length} | 
                      1s: {results.filter(r => r === '1').length} ({results.length > 0 ? ((results.filter(r => r === '1').length / results.length) * 100).toFixed(1) : 0}%)
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Session History - Simplified to last 5 sessions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Previous Sessions (Last 5)</h2>
                <button
                  onClick={resetHistory}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  🗑️ Clear All History
                </button>
              </div>
              
              {sessionHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📚</div>
                  <div className="text-xl font-semibold text-gray-600 mb-2">No Previous Sessions</div>
                  <div className="text-gray-500">Complete your first session to see history here</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...sessionHistory].reverse().map((session, index) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">Session {sessionHistory.length - index}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">Duration: {session.duration}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${session.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {session.profit >= 0 ? '+' : ''}₱{session.profit.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Win Rate: {session.winRate}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Starting Capital</div>
                          <div className="font-bold">₱{session.startingCapital.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Final Capital</div>
                          <div className="font-bold">₱{session.finalCapital.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Total Bets</div>
                          <div className="font-bold">{session.totalBets}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Results</div>
                          <div className="font-bold">{session.results.length}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-12 gap-1 max-h-32 overflow-y-auto">
                        {[...session.results].reverse().map((result, resultIndex) => {
                          const getHistoryResultStyle = (result) => {
                            switch (result) {
                              case '1':
                                return 'bg-gray-200 text-gray-800 font-bold';
                              case '2':
                                return 'bg-green-100 text-green-800 font-bold';
                              case '5':
                                return 'bg-red-100 text-red-800 font-bold';
                              case '10':
                                return 'bg-blue-100 text-blue-800 font-bold';
                              case 'chance':
                                return 'bg-purple-100 text-purple-800 font-bold';
                              case '2rolls':
                                return 'bg-gray-200 text-gray-800 font-bold';
                              case '4rolls':
                                return 'bg-yellow-100 text-yellow-800 font-bold';
                              default:
                                return 'bg-gray-100 text-gray-700';
                            }
                          };

                          const getHistoryDisplayText = (result) => {
                            switch (result) {
                              case 'chance':
                                return 'C';
                              case '2rolls':
                                return '2R';
                              case '4rolls':
                                return '4R';
                              default:
                                return result.toUpperCase();
                            }
                          };

                          return (
                            <div
                              key={resultIndex}
                              className={`px-2 py-1 text-xs text-center rounded ${getHistoryResultStyle(result)}`}
                              title={`Spin ${session.results.length - resultIndex}: ${result.toUpperCase()}`}
                            >
                              {getHistoryDisplayText(result)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  
                  {/* Overall Statistics */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Overall Statistics (Last 5 Sessions)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Total Sessions</div>
                        <div className="text-lg font-bold">{sessionHistory.length}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Total Profit/Loss</div>
                        <div className={`text-lg font-bold ${sessionHistory.reduce((sum, session) => sum + session.profit, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {sessionHistory.reduce((sum, session) => sum + session.profit, 0) >= 0 ? '+' : ''}₱{sessionHistory.reduce((sum, session) => sum + session.profit, 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Avg Session Length</div>
                        <div className="text-lg font-bold">
                          {sessionHistory.length > 0 ? Math.round(sessionHistory.reduce((sum, session) => sum + session.results.length, 0) / sessionHistory.length) : 0} spins
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Overall Win Rate</div>
                        <div className="text-lg font-bold text-purple-600">
                          {sessionHistory.length > 0 && sessionHistory.reduce((sum, session) => sum + session.totalBets, 0) > 0 ? 
                            ((sessionHistory.reduce((sum, session) => sum + session.successfulBets, 0) / sessionHistory.reduce((sum, session) => sum + session.totalBets, 0)) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Simplified Chance Modal */}
      {showChanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-purple-600 mb-2">
                🎲 Chance Segment
              </h2>
              <p className="text-gray-600">
                Choose your outcome:
              </p>
            </div>
            
            <div className="space-y-4">
              {/* Fixed 2x Multiplier Option */}
              <button
                onClick={handleChanceMultiplier}
                className="w-full border-2 border-yellow-500 rounded-lg p-4 bg-yellow-50 hover:bg-yellow-100 transition-colors"
              >
                <div className="text-lg font-bold text-yellow-700 mb-2">
                  🎯 2x Multiplier
                </div>
                <div className="text-sm text-yellow-600">
                  Win = bet × 2 if next result is "1"
                </div>
              </button>
              
              {/* Cash Option */}
              <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
                <div className="text-lg font-bold text-green-700 mb-3">
                  💰 Cash Out
                </div>
                <div className="text-sm text-green-600 mb-3">
                  Add cash to your capital and reset martingale
                </div>
                
                <div className="space-y-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter cash amount (₱)"
                    id="cashAmount"
                  />
                  
                  <button
                    onClick={() => {
                      const cashInput = document.getElementById('cashAmount');
                      const cashAmount = parseFloat(cashInput.value) || 0;
                      if (cashAmount <= 0) {
                        alert('Please enter a valid cash amount greater than 0');
                        return;
                      }
                      handleChanceCash(cashAmount);
                    }}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    Confirm Cash Out
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowChanceModal(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonopolyTracker; 