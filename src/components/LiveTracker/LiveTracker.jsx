import React, { useState, useEffect, useCallback } from 'react';
import useSessionData from '../../hooks/useSessionData';
import { calculateMartingaleBet } from '../MonopolyTracker/utils/calculations';
import { getBettingRecommendation, analyzeOnesPattern } from '../MonopolyTracker/utils/patterns';
import ResultEntry from '../MonopolyTracker/components/ResultEntry';
import RecentResults from '../MonopolyTracker/components/RecentResults';
import HotZoneStatusCard from '../MonopolyTracker/components/HotZoneStatusCard';
import ChanceModal from '../MonopolyTracker/components/ChanceModal';
import { useChanceLogic } from '../MonopolyTracker/hooks/useChanceLogic';
import { useHotZone } from '../../hooks/useHotZone';
import { useFloatingCard } from '../../contexts/FloatingCardContext';

const LiveTracker = () => {
  // Core state
  const [results, setResults] = useState([]);
  const [resultTimestamps, setResultTimestamps] = useState([]);
  const [totalBets, setTotalBets] = useState(0);
  const [successfulBets, setSuccessfulBets] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Session state
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
  
  // Target Profit tracking
  const [targetWinCount, setTargetWinCount] = useState(0);
  const [targetProfitAmount, setTargetProfitAmount] = useState(0);
  const [currentWinCount, setCurrentWinCount] = useState(0);
  
  // Session duration tracking
  const [sessionDuration, setSessionDuration] = useState(0);
  
  // Additional state for chance logic
  const [lastBetAmount, setLastBetAmount] = useState(0);
  const [lastBetWon, setLastBetWon] = useState(false);
  
  // Database integration hooks
  const {
    createSession,
    endSession,
    addResult: addResultToDb,
    loadSessionHistory
  } = useSessionData();

  // Hot zone detection hook
  const {
    analyzeShiftStatus,
    loading: hotZoneLoading,
    error: hotZoneError,
    isAnalysisActive,
    getCurrentStatus,
    getMinSpinsRequired,
    clearError: clearHotZoneError
  } = useHotZone();

  // Current session tracking
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  // Floating card toggle from context
  const { isVisible: isFloatingCardVisible } = useFloatingCard();

  // Create session state object for chance logic hook
  const sessionState = {
    currentCapital,
    startingCapital,
    baseBet,
    consecutiveLosses,
    totalBets,
    successfulBets,
    sessionActive,
    lastBetAmount,
    lastBetWon
  };

  // Create update function for chance logic hook
  const updateSessionState = useCallback((updates) => {
    Object.entries(updates).forEach(([key, value]) => {
      switch (key) {
        case 'currentCapital':
          setCurrentCapital(typeof value === 'function' ? value(currentCapital || 0) : value);
          break;
        case 'sessionProfit':
          setSessionProfit(typeof value === 'function' ? value(sessionProfit || 0) : value);
          break;
        case 'consecutiveLosses':
          setConsecutiveLosses(typeof value === 'function' ? value(consecutiveLosses || 0) : value);
          break;
        case 'currentBetAmount':
          setCurrentBetAmount(typeof value === 'function' ? value(currentBetAmount || 0) : value);
          break;
        case 'successfulBets':
          setSuccessfulBets(typeof value === 'function' ? value(successfulBets || 0) : value);
          break;
        case 'totalBets':
          setTotalBets(typeof value === 'function' ? value(totalBets || 0) : value);
          break;
        case 'lastBetAmount':
          setLastBetAmount(typeof value === 'function' ? value(lastBetAmount || 0) : value);
          break;
        case 'lastBetWon':
          setLastBetWon(typeof value === 'function' ? value(lastBetWon || false) : value);
          break;
        default:
          console.warn(`Unknown session state key: ${key}`);
      }
    });
  }, [currentCapital, sessionProfit, consecutiveLosses, currentBetAmount, successfulBets, totalBets, lastBetAmount, lastBetWon]);

  // Initialize chance logic hook with proper parameters
  const {
    initializeChance,
    handleCashPrize,
    handleMultiplier,
    processNextSpin,
    closeModal,
    isPending: chanceIsPending,
    isModalOpen: chanceModalOpen,
    pendingMultiplier: chancePendingMultiplier,
    originalBetAmount: chanceOriginalBet
  } = useChanceLogic(sessionState, updateSessionState);

  // Load session history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        console.log('LiveTracker - Loading session history...');
        
        const history = await loadSessionHistory();
        console.log('LiveTracker - Session history loaded:', history);
        setSessionHistory(history || []);
        setDataLoaded(true);
      } catch (error) {
        console.error('LiveTracker - Failed to load session history:', error);
        setSessionHistory([]);
        setDataLoaded(true);
      }
    };
    
    // Load Target Profit data from localStorage
    const loadTargetProfitData = () => {
      try {
        const targetData = JSON.parse(localStorage.getItem('monopolyTargetProfit') || '{}');
        if (targetData.targetProfit) {
          setTargetProfitAmount(targetData.targetProfit || 0);
          setTargetWinCount(targetData.targetWinCount || 0);
          setCurrentWinCount(targetData.currentWinCount || 0);
        }
      } catch (error) {
        console.error('Failed to load target profit data:', error);
      }
    };
    
    loadHistory();
    loadTargetProfitData();
  }, [loadSessionHistory]);

  // Session duration timer
  useEffect(() => {
    let interval;
    
    if (sessionActive && sessionStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const startTime = new Date(sessionStartTime);
        const diffMs = now - startTime;
        setSessionDuration(Math.floor(diffMs / 1000)); // Duration in seconds
      }, 1000); // Update every second
    } else {
      setSessionDuration(0);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [sessionActive, sessionStartTime]);

  // Format session duration for display
  const formatDuration = (seconds) => {
    if (seconds === 0) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Update current bet amount based on consecutive losses
  useEffect(() => {
    if (sessionActive && baseBet > 0) {
      const newBetAmount = calculateMartingaleBet(baseBet, consecutiveLosses);
      setCurrentBetAmount(newBetAmount);
      setHighestMartingale(Math.max(highestMartingale, newBetAmount));
    }
  }, [consecutiveLosses, baseBet, sessionActive, highestMartingale]);

  // Auto-show session modal on initial load if no history exists
  useEffect(() => {
    if (dataLoaded && sessionHistory.length === 0 && !sessionActive && !sessionStartTime) {
      setShowSessionModal(true);
    }
  }, [dataLoaded, sessionHistory.length, sessionActive, sessionStartTime]);

  // Auto-analyze hot zones when results change
  useEffect(() => {
    if (results.length > 0) {
      analyzeShiftStatus(results).catch(err => {
        console.warn('Hot zone analysis failed:', err.message);
      });
    }
  }, [results, analyzeShiftStatus]);

  // Get betting recommendation
  const recommendation = getBettingRecommendation(results, consecutiveLosses, baseBet);
  // eslint-disable-next-line no-unused-vars
  const analysis = analyzeOnesPattern(results); // Pattern analysis for future features

  // Session management functions
  const initializeSession = useCallback(async (capital, bet, targetProfitAmount = 0) => {
    try {
      const safeCapital = parseFloat(capital) || 0;
      const safeBet = parseFloat(bet) || 0;
      const safeTargetProfit = parseFloat(targetProfitAmount) || 0;
      
      if (safeCapital <= 0 || safeBet <= 0) {
        throw new Error('Invalid capital or bet amount');
      }
      
      // Calculate target win count if target profit is set
      const calculatedTargetWinCount = safeTargetProfit > 0 ? Math.ceil(safeTargetProfit / safeBet) : 0;
      
      const sessionData = {
        startingCapital: safeCapital,
        baseBet: safeBet,
        currentCapital: safeCapital
      };

      const newSession = await createSession(sessionData);
      
      setCurrentSessionId(newSession.id);
      setSessionActive(true);
      setStartingCapital(safeCapital);
      setCurrentCapital(safeCapital);
      setBaseBet(safeBet);
      setCurrentBetAmount(safeBet);
      setSessionStartTime(newSession.startTime);
      setSessionEndTime(null);
      setResults([]);
      setResultTimestamps([]);
      setTotalBets(0);
      setSuccessfulBets(0);
      setConsecutiveLosses(0);
      setSessionProfit(0);
      setHighestMartingale(safeBet);
      
      // Initialize Target Profit tracking
      setTargetProfitAmount(safeTargetProfit);
      setTargetWinCount(calculatedTargetWinCount);
      setCurrentWinCount(0);
      
      // Reset session duration
      setSessionDuration(0);
      
      // Store Target Profit in localStorage
      if (safeTargetProfit > 0) {
        localStorage.setItem('monopolyTargetProfit', JSON.stringify({
          targetProfit: safeTargetProfit,
          targetWinCount: calculatedTargetWinCount,
          currentWinCount: 0
        }));
      } else {
        localStorage.removeItem('monopolyTargetProfit');
      }
      
    } catch (error) {
      console.error('Failed to initialize session:', error);
      alert('Failed to create session');
    }
  }, [createSession]);

  const archiveCurrentSession = useCallback(async (customEndTime = null) => {
    if (!currentSessionId) {
      return;
    }

    try {
      const endData = {
        finalCapital: Number(currentCapital) || 0,
        profit: Number(sessionProfit) || 0,
        totalBets: Number(totalBets) || 0,
        successfulBets: Number(successfulBets) || 0,
        winRate: totalBets > 0 ? Number(((successfulBets / totalBets) * 100).toFixed(2)) : 0,
        highestMartingale: Number(highestMartingale) || 0
      };

      await endSession(currentSessionId, endData);

      // Reload session history in background
      setTimeout(async () => {
        try {
          const history = await loadSessionHistory();
          setSessionHistory(history || []);
        } catch (error) {
          console.warn('Failed to reload session history:', error);
        }
      }, 100);

    } catch (error) {
      console.error('Failed to archive session:', error);
      throw error;
    }
  }, [currentSessionId, currentCapital, sessionProfit, totalBets, successfulBets, highestMartingale, endSession, loadSessionHistory]);

  const clearCurrentSession = useCallback(() => {
    console.log('🚀 clearCurrentSession: Starting to clear all session data...');
    setSessionActive(false);
    setCurrentSessionId(null);
    setStartingCapital(0);
    setCurrentCapital(0);
    setBaseBet(0);
    setCurrentBetAmount(0);
    setConsecutiveLosses(0);
    setSessionProfit(0);
    setSessionStartTime(null);
    setSessionEndTime(null);
    setResults([]);
    setResultTimestamps([]);
    setTotalBets(0);
    setSuccessfulBets(0);
    setHighestMartingale(0);
    
    // Clear Target Profit tracking
    setTargetProfitAmount(0);
    setTargetWinCount(0);
    setCurrentWinCount(0);
    
    try {
      localStorage.removeItem('monopolyTargetProfit');
      console.log('🚀 clearCurrentSession: localStorage cleared');
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }
    
    // Clear session duration
    setSessionDuration(0);
    console.log('🚀 clearCurrentSession: All session data cleared successfully');
  }, []);

  // Memoized session control functions (defined after clearCurrentSession)
  const handleEndSession = useCallback(() => {
    console.log('🚀 LiveTracker.handleEndSession called');
    // Skip confirmation if target profit achieved
    const isTargetAchieved = targetProfitAmount > 0 && sessionProfit >= targetProfitAmount;
    console.log('🚀 isTargetAchieved:', isTargetAchieved);
    
         // TEMPORARY: Auto-confirm for testing
     let confirmed = true;
     console.log('🚀 TESTING: Auto-confirming end session');
     
     /* ORIGINAL CONFIRMATION CODE - Will restore after testing
     let confirmed = false;
     if (isTargetAchieved) {
       confirmed = true;
       console.log('🚀 Target achieved - skipping confirmation');
     } else {
       console.log('🚀 Showing confirmation dialog...');
       confirmed = window.confirm('🎯 End current session?\n\nThis will archive the session to history and stop tracking.\n\nClick OK to confirm or Cancel to continue.');
       console.log('🚀 Dialog result:', confirmed);
     }
     */
    
    if (confirmed) {
      try {
        // Clear Target Profit tracking immediately
        setTargetProfitAmount(0);
        setTargetWinCount(0);
        setCurrentWinCount(0);
        
        try {
          localStorage.removeItem('monopolyTargetProfit');
        } catch (e) {
          console.warn('Could not clear localStorage:', e);
        }
        
        // End the session
        setSessionActive(false);
        setSessionEndTime(new Date().toISOString());
        
        // Archive the session (non-blocking)
        const endTime = new Date().toISOString();
        archiveCurrentSession(endTime).catch(error => {
          console.error('Failed to archive session (background):', error);
        });
        
        alert('✅ Session ended successfully!');
      } catch (error) {
        console.error('Error ending session:', error);
        alert('❌ Failed to end session. Please try again.');
      }
    }
  }, [targetProfitAmount, sessionProfit, archiveCurrentSession]);

  const handleClearSession = useCallback(() => {
    console.log('🚀 LiveTracker.handleClearSession called');
    
    // TEMPORARY: Auto-confirm for testing
    const confirmed = true;
    console.log('🚀 TESTING: Auto-confirming clear session');
    
    /* ORIGINAL CONFIRMATION CODE - Will restore after testing
    console.log('🚀 Showing clear confirmation dialog...');
    const confirmed = window.confirm('🚨 Clear Current Session?\n\nThis action cannot be undone!\n\nAll current session data will be permanently lost.\n\nClick OK to clear or Cancel to keep session.');
    console.log('🚀 Clear dialog result:', confirmed);
    */
    
    if (confirmed) {
      console.log('🚀 User confirmed clear - calling clearCurrentSession...');
      clearCurrentSession();
      alert('✅ Current session cleared!');
    } else {
      console.log('🚀 User cancelled clear operation');
    }
  }, [clearCurrentSession]);

  // Handle result addition
  const handleAddResult = useCallback(async (result) => {
    if (result === 'chance') {
      const shouldBet = sessionActive && recommendation.shouldBet && currentBetAmount <= currentCapital;
      
      if (shouldBet) {
        initializeChance(currentBetAmount);
      } else {
        // Add result to local state
        const newResults = [...results, result];
        const newTimestamps = [...resultTimestamps, new Date().toISOString()];
        setResults(newResults);
        setResultTimestamps(newTimestamps);
        
        // Add to database if session active
        if (sessionActive && currentSessionId) {
          try {
            await addResultToDb(currentSessionId, {
              resultValue: result,
              betAmount: 0,
              won: false,
              capitalAfter: currentCapital,
              martingaleLevel: consecutiveLosses
            });
          } catch (error) {
            console.error('Failed to save result to database:', error);
          }
        }
      }
      return;
    }
    
    // Check if we need to process pending multiplier
    if (chanceIsPending) {
      const spinResult = processNextSpin(result);
      if (spinResult.processed) {
        // Add result and handle multiplier
        const newResults = [...results, result];
        const newTimestamps = [...resultTimestamps, new Date().toISOString()];
        setResults(newResults);
        setResultTimestamps(newTimestamps);
        
        if (sessionActive && currentSessionId) {
          try {
            await addResultToDb(currentSessionId, {
              resultValue: result,
              betAmount: spinResult.amount || 0,
              won: spinResult.won || false,
              capitalAfter: currentCapital + (spinResult.won ? spinResult.amount : -spinResult.amount),
              martingaleLevel: consecutiveLosses,
              isMultiplier: true
            });
            
            if (spinResult.won) {
              setCurrentCapital(currentCapital + spinResult.amount);
              setSessionProfit(sessionProfit + spinResult.amount);
            } else {
              setCurrentCapital(currentCapital - spinResult.amount);
              setSessionProfit(sessionProfit - spinResult.amount);
            }
          } catch (error) {
            console.error('Failed to save multiplier result:', error);
          }
        }
        return;
      }
    }
    
    // Regular processing for non-chance results
    const isWinningNumber = result === '1';
    let newCapital = currentCapital;
    let won = false;
    let actualBetAmount = 0;

    if (sessionActive && recommendation.shouldBet && currentBetAmount <= currentCapital) {
      actualBetAmount = currentBetAmount;
      if (isWinningNumber) {
        newCapital = currentCapital + actualBetAmount;
        won = true;
        setSuccessfulBets(successfulBets + 1);
        setConsecutiveLosses(0);
        setCurrentBetAmount(baseBet);
        
        // Track Target Wins
        if (targetWinCount > 0) {
          const newCurrentWinCount = currentWinCount + 1;
          setCurrentWinCount(newCurrentWinCount);
          
          // Update localStorage
          const targetData = JSON.parse(localStorage.getItem('monopolyTargetProfit') || '{}');
          if (targetData.targetProfit) {
            targetData.currentWinCount = newCurrentWinCount;
            localStorage.setItem('monopolyTargetProfit', JSON.stringify(targetData));
          }
        }
      } else {
        newCapital = currentCapital - actualBetAmount;
        const newConsecutiveLosses = consecutiveLosses + 1;
        setConsecutiveLosses(newConsecutiveLosses);
        const newBetAmount = calculateMartingaleBet(baseBet, newConsecutiveLosses);
        setCurrentBetAmount(newBetAmount);
      }
      setTotalBets(totalBets + 1);
      setCurrentCapital(newCapital);
      setSessionProfit(newCapital - startingCapital);
    }
    
    // Add result to local state
    const newResults = [...results, result];
    const newTimestamps = [...resultTimestamps, new Date().toISOString()];
    setResults(newResults);
    setResultTimestamps(newTimestamps);
    
    // Save to database if session active
    if (sessionActive && currentSessionId) {
      try {
        await addResultToDb(currentSessionId, {
          resultValue: result,
          betAmount: actualBetAmount,
          won: won,
          capitalAfter: newCapital,
          martingaleLevel: consecutiveLosses
        });
      } catch (error) {
        console.error('Failed to save result to database:', error);
      }
    }
  }, [sessionActive, recommendation, currentBetAmount, currentCapital, chanceIsPending, initializeChance, processNextSpin, results, resultTimestamps, currentSessionId, addResultToDb, consecutiveLosses, baseBet, successfulBets, totalBets, startingCapital, sessionProfit, targetWinCount, currentWinCount]);

  // Export functions
  const exportToCSV = useCallback(() => {
    const headers = ['Spin Number', 'Result', 'Timestamp'];
    const sessionInfo = [
      ['Session Start', sessionStartTime ? new Date(sessionStartTime).toLocaleString() : 'N/A'],
      ['Session End', sessionEndTime ? new Date(sessionEndTime).toLocaleString() : 'Current Session'],
      ['Starting Capital', sessionActive ? `₱${startingCapital.toFixed(2)}` : 'N/A'],
      ['Current Capital', sessionActive ? `₱${currentCapital.toFixed(2)}` : 'N/A'],
      ['Session P/L', sessionActive ? `₱${sessionProfit.toFixed(2)}` : 'N/A'],
      [''],
      headers
    ];
    
    const results_with_time = results.map((result, index) => {
      const resultTimestamp = resultTimestamps[index] || new Date().toISOString();
      return [
        index + 1,
        result.toUpperCase(),
        resultTimestamp ? new Date(resultTimestamp).toLocaleString() : 'N/A'
      ];
    });
    
    const csvContent = [...sessionInfo, ...results_with_time].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monopoly-live-session-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [sessionStartTime, sessionEndTime, sessionActive, startingCapital, currentCapital, sessionProfit, results, resultTimestamps]);

  const copyToClipboard = useCallback(async () => {
    if (results.length === 0) {
      alert('No results to copy');
      return;
    }

    const textToCopy = results.join(',');
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      alert(`✅ Copied ${results.length} results to clipboard!\nFormat: ${textToCopy.substring(0, 50)}${textToCopy.length > 50 ? '...' : ''}`);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert(`✅ Copied ${results.length} results to clipboard!\nFormat: ${textToCopy.substring(0, 50)}${textToCopy.length > 50 ? '...' : ''}`);
    }
  }, [results]);

  // Handle undo
  const handleUndoWithAlert = useCallback(() => {
    if (results.length === 0) {
      alert('No results to undo');
      return;
    }

    const newResults = results.slice(0, -1);
    const newTimestamps = resultTimestamps.slice(0, -1);
    setResults(newResults);
    setResultTimestamps(newTimestamps);
    
    alert(`✅ Undid last result`);
  }, [results, resultTimestamps]);

  // Chance modal handlers
  const handleChanceModalMultiplier = async (multiplier) => {
    const result = handleMultiplier(multiplier);
    if (result.success) {
      const newResults = [...results, 'chance'];
      const newTimestamps = [...resultTimestamps, new Date().toISOString()];
      setResults(newResults);
      setResultTimestamps(newTimestamps);
      
      // Save chance result to database
      if (sessionActive && currentSessionId) {
        try {
          await addResultToDb(currentSessionId, {
            resultValue: 'chance',
            betAmount: chanceOriginalBet || 0,
            won: false, // Multiplier is pending, not won yet
            capitalAfter: currentCapital,
            martingaleLevel: consecutiveLosses,
            chanceEvent: {
              eventType: 'MULTIPLIER',
              multiplierValue: multiplier,
              originalBetAmount: chanceOriginalBet || 0
            }
          });
        } catch (error) {
          console.error('Failed to save chance multiplier result to database:', error);
        }
      }
    }
  };

  const handleChanceModalCash = async (amount) => {
    const result = handleCashPrize(amount);
    if (result.success) {
      const newResults = [...results, 'chance'];
      const newTimestamps = [...resultTimestamps, new Date().toISOString()];
      setResults(newResults);
      setResultTimestamps(newTimestamps);
      
      // Save chance result to database
      if (sessionActive && currentSessionId) {
        try {
          await addResultToDb(currentSessionId, {
            resultValue: 'chance',
            betAmount: chanceIsPending ? chanceOriginalBet : 0,
            won: true, // Cash prize is an immediate win
            capitalAfter: currentCapital,
            martingaleLevel: consecutiveLosses,
            chanceEvent: {
              eventType: 'CASH_PRIZE',
              cashAmount: amount,
              originalBetAmount: chanceIsPending ? chanceOriginalBet : 0
            }
          });
        } catch (error) {
          console.error('Failed to save chance cash result to database:', error);
        }
      }
    }
  };

  const handleChanceModalClose = async () => {
    closeModal();
    const newResults = [...results, 'chance'];
    const newTimestamps = [...resultTimestamps, new Date().toISOString()];
    setResults(newResults);
    setResultTimestamps(newTimestamps);
    
    // Save chance result to database when modal is closed without selection
    if (sessionActive && currentSessionId) {
      try {
        await addResultToDb(currentSessionId, {
          resultValue: 'chance',
          betAmount: 0,
          won: false,
          capitalAfter: currentCapital,
          martingaleLevel: consecutiveLosses
        });
      } catch (error) {
        console.error('Failed to save skipped chance result to database:', error);
      }
    }
  };

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
                  const targetProfitAmount = parseFloat(formData.get('targetProfit')) || 0;
                  
                  if (startCapital <= 0 || baseBetAmount <= 0) {
                    alert('Please enter valid amounts greater than 0');
                    return;
                  }
                  
                  if (baseBetAmount > startCapital) {
                    alert('Base bet cannot be greater than starting capital');
                    return;
                  }
                  
                  initializeSession(startCapital, baseBetAmount, targetProfitAmount);
                  setShowSessionModal(false);
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
                <div className="mb-4">
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
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Profit (₱) <span className="text-gray-500 text-xs">- Optional</span>
                  </label>
                  <input
                    type="number"
                    name="targetProfit"
                    step="0.01"
                    placeholder="e.g., 500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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



        {/* Prominent Martingale Display */}
        {sessionActive && (
          <div className={`bg-white rounded-lg shadow-lg p-6 border-4 mb-6 ${
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

        {/* Recent Results & Hot Zone Detection - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Results - Left Column */}
          <div className="min-h-0">
            <RecentResults 
              results={results} 
              resultTimestamps={resultTimestamps}
              onCopy={copyToClipboard}
              onExport={exportToCSV}
            />
          </div>

          {/* Hot Zone Status Card - Right Column */}
          <div className="min-h-0">
            <HotZoneStatusCard
              isActive={isAnalysisActive}
              status={getCurrentStatus()?.status || 'Cold'}
              dominantZone={getCurrentStatus()?.dominantZone || 'A'}
              score={getCurrentStatus()?.score || 0}
              trendDirection={getCurrentStatus()?.trendDirection || 'stable'}
              totalSpins={getCurrentStatus()?.totalSpins || results.length}
              requiredSpins={getMinSpinsRequired()}
              loading={hotZoneLoading}
              error={hotZoneError}
              onRetry={clearHotZoneError}
            />
          </div>
        </div>

        {/* Pending Multiplier Indicator */}
        {chanceIsPending && (
          <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🎯</div>
              <div>
                <div className="font-bold text-yellow-800">
                  {`Pending Multiplier: ${chancePendingMultiplier}x`}
                </div>
                <div className="text-sm text-yellow-700">
                  {`Win = ₱${chanceOriginalBet} × ${chancePendingMultiplier} = ₱${(chanceOriginalBet * chancePendingMultiplier).toFixed(2)} if "1"`}
                </div>
                <div className="text-xs text-yellow-600 mt-1">
                  Original bet: ₱{chanceOriginalBet} | Next spin determines outcome
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Spacer for floating card */}
        {isFloatingCardVisible && <div className="pb-32"></div>}
      </div>
      
      {/* Floating Quick Result Entry with Session Controls */}
      {/* Always show session controls when session is active, otherwise respect floating card visibility */}
      {((sessionActive && !showSessionModal && !chanceModalOpen) || (isFloatingCardVisible && !showSessionModal && !chanceModalOpen)) && (
        <ResultEntry 
          onResultClick={handleAddResult} 
          onUndo={handleUndoWithAlert} 
          sessionData={{
            consecutiveLosses,
            recommendation,
            sessionActive,
            currentBetAmount,
            currentCapital,
            sessionProfit,
            totalBets,
            successfulBets,
            results, // Add results array for last 3 rolls display
            targetWinCount,
            currentWinCount,
            targetProfitAmount,
            sessionDuration: formatDuration(sessionDuration),
            onStartSession: () => setShowSessionModal(true),
            onEndSession: handleEndSession,
            onClearSession: handleClearSession
          }}
          hideControlsWhenInactive={!isFloatingCardVisible}
        />
      )}
      
      {/* Chance Modal */}
      <ChanceModal
        isOpen={chanceModalOpen}
        onClose={handleChanceModalClose}
        onMultiplier={handleChanceModalMultiplier}
        onCash={handleChanceModalCash}
        hasMultiplier={chanceIsPending}
        pendingMultiplier={chancePendingMultiplier}
        originalBet={chanceOriginalBet}
      />
    </div>
  );
};

export default LiveTracker; 