import React, { useState, useEffect, useCallback } from 'react';
import useSessionData from '../../hooks/useSessionData';
import { calculateMartingaleBet } from '../MonopolyTracker/utils/calculations';
import { getBettingRecommendation, analyzeOnesPattern } from '../MonopolyTracker/utils/patterns';
import ResultEntry from '../MonopolyTracker/components/ResultEntry';
import RecentResultsWithSkip from '../MonopolyTracker/components/RecentResults/RecentResultsWithSkip';
import ChanceModal from '../MonopolyTracker/components/ChanceModal';
import { useChanceLogic } from '../MonopolyTracker/hooks/useChanceLogic';
import { useHotZone } from '../../hooks/useHotZone';
import { useFloatingCard } from '../../contexts/FloatingCardContext';
import DebugConsole from '../DebugConsole';
import ModeSelector from '../BettingControls/ModeSelector';


const LiveTracker = () => {
  // Utility function for showing notifications
  const showNotification = useCallback((message, type = 'success') => {
    const colors = {
      success: '#10B981',
      error: '#EF4444', 
      warning: '#F59E0B',
      info: '#3B82F6'
    };
    
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
      ">
        ${message}
      </div>
    `;
    
    // Add animation styles
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.transition = 'all 0.3s ease-out';
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);
  }, []);

  // Core state
  const [results, setResults] = useState([]);
  const [resultTimestamps, setResultTimestamps] = useState([]);
  const [resultSkipInfo, setResultSkipInfo] = useState([]); // Track skip information for each result
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
  const [bettingStrategy, setBettingStrategy] = useState('martingale');
  const [conditionStrategy, setConditionStrategy] = useState('hz_l3');
  
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
    getActiveSession,
    updateSession,
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
    getMinSpinsRequired
  } = useHotZone();

  // Current session tracking
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  // Floating card toggle from context
  const { isVisible: isFloatingCardVisible } = useFloatingCard();

  // Debug console state
  const [showDebugConsole, setShowDebugConsole] = useState(false);

  // Debug console hotkey (Ctrl+D or Cmd+D)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        setShowDebugConsole(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dual-condition betting control: Hot Zone + Last 3 Rolls or L3 Only
  const getDualConditionBettingStatus = useCallback(() => {
    // Analyze last 3 rolls - always needed for both strategies
    const getLast3RollsCondition = () => {
      if (results.length < 3) {
        return 'Insufficient Data';
      }

      // Get last 3 non-chance results
      const nonChanceResults = results.filter(r => r !== 'chance');
      if (nonChanceResults.length < 3) {
        return 'Insufficient Data';
      }

      const last3 = nonChanceResults.slice(-3);
      const onesCount = last3.filter(result => result === '1').length;
      
      // 1 or more "1"s in last 3 = Bet, otherwise Do Not Bet
      return onesCount >= 1 ? 'Bet' : 'Do Not Bet';
    };

    const last3Condition = getLast3RollsCondition();

    // Handle L3 Only strategy (for Flat Betting mode)
    if (bettingStrategy === 'flat') {
      const shouldBet = (last3Condition === 'Bet');
      const reason = shouldBet 
        ? `✅ Betting Enabled: L3 Only (${last3Condition})`
        : `🛑 Betting Skipped: L3 Only (${last3Condition})`;
      
      return {
        shouldBet,
        reason,
        hotZoneCondition: 'N/A (L3 Only)',
        last3Condition
      };
    }

    // Handle HZ + L3 dual condition strategy (for Martingale mode)
    const hotZoneStatus = getCurrentStatus();
    if (!hotZoneStatus || !isAnalysisActive) {
      return {
        shouldBet: false,
        reason: 'Hot Zone: Analyzing...',
        hotZoneCondition: 'Analyzing',
        last3Condition
      };
    }

    // Convert hot zone status to betting condition
    const hotZoneCondition = (hotZoneStatus.status === 'Hot' || hotZoneStatus.status === 'Warming') 
      ? 'Bet' : 'Do Not Bet';
    
    // Both conditions must be "Bet" for betting to be enabled
    const shouldBet = (hotZoneCondition === 'Bet' && last3Condition === 'Bet');
    
    const reason = shouldBet 
      ? `✅ Betting Enabled: Hot Zone (${hotZoneCondition}) + Last 3 Rolls (${last3Condition})`
      : `🛑 Betting Skipped: Hot Zone (${hotZoneCondition}) + Last 3 Rolls (${last3Condition})`;

    return {
      shouldBet,
      reason,
      hotZoneCondition,
      last3Condition
    };
  }, [getCurrentStatus, isAnalysisActive, results, bettingStrategy]);



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

  // Load session history and restore active session on mount
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

    // Restore active session if exists
    const restoreActiveSession = async () => {
      try {
        console.log('LiveTracker - Checking for active session...');
        const activeSession = await getActiveSession();
        
        if (activeSession) {
          console.log('LiveTracker - Active session found, restoring:', activeSession);
          
          // Check if session has exceeded 30-minute inactivity timeout
          const now = new Date();
          const lastActivity = activeSession.lastActivity ? new Date(activeSession.lastActivity) : new Date(activeSession.startTime);
          const inactiveMinutes = (now - lastActivity) / (1000 * 60);
          
          if (inactiveMinutes > 30) {
            console.log('LiveTracker - Session exceeded 30-minute timeout, ending session');
            try {
              await endSession(activeSession.id, {
                endTime: now.toISOString(),
                reason: 'inactivity_timeout'
              });
              showNotification('Previous session ended due to 30-minute inactivity timeout', 'warning');
            } catch (error) {
              console.error('Failed to end expired session:', error);
            }
            return;
          }
          
          // Restore session state - convert string values from database to numbers
          setCurrentSessionId(activeSession.id);
          setSessionActive(true);
          setStartingCapital(parseFloat(activeSession.startingCapital) || 0);
          setCurrentCapital(parseFloat(activeSession.currentCapital) || 0);
          setBaseBet(parseFloat(activeSession.baseBet) || 0);
          setCurrentBetAmount(parseFloat(activeSession.currentBetAmount || activeSession.baseBet) || 0);
          setSessionStartTime(activeSession.startTime);
          setSessionEndTime(null);
          setResults(activeSession.results || []);
          setResultTimestamps(activeSession.resultTimestamps || []);
          setTotalBets(parseInt(activeSession.totalBets) || 0);
          setSuccessfulBets(parseInt(activeSession.successfulBets) || 0);
          setConsecutiveLosses(parseInt(activeSession.consecutiveLosses) || 0);
          setSessionProfit(parseFloat(activeSession.profit) || (parseFloat(activeSession.currentCapital) - parseFloat(activeSession.startingCapital)));
          setHighestMartingale(parseFloat(activeSession.highestMartingale || activeSession.baseBet) || 0);
          
          // Restore target profit data if exists
          if (activeSession.targetProfitAmount) {
            setTargetProfitAmount(parseFloat(activeSession.targetProfitAmount) || 0);
            setTargetWinCount(parseInt(activeSession.targetWinCount) || 0);
            setCurrentWinCount(parseInt(activeSession.currentWinCount) || 0);
          }
          
          showNotification('Previous session restored successfully!', 'success');
          console.log('LiveTracker - Session restoration completed');
        } else {
          console.log('LiveTracker - No active session found');
        }
      } catch (error) {
        console.error('LiveTracker - Failed to restore active session:', error);
        // Don't show user error - just continue without restoration
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
    
    // Execute all initialization tasks
    const initializeComponent = async () => {
      await loadHistory();
      await restoreActiveSession();
      loadTargetProfitData();
    };
    
    initializeComponent();
  }, [loadSessionHistory, getActiveSession, endSession, showNotification]);

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

  // Calculate bet amount based on selected strategy
  const calculateBetAmount = useCallback((baseBetAmount, losses) => {
    switch (bettingStrategy) {
      case 'flat':
        return baseBetAmount; // Always bet the same amount
      case 'martingale':
      default:
        return calculateMartingaleBet(baseBetAmount, losses);
    }
  }, [bettingStrategy]);

  // Update current bet amount based on consecutive losses and strategy
  useEffect(() => {
    if (sessionActive && baseBet > 0) {
      const newBetAmount = calculateBetAmount(baseBet, consecutiveLosses);
      setCurrentBetAmount(newBetAmount);
      setHighestMartingale(Math.max(highestMartingale, newBetAmount));
    }
  }, [consecutiveLosses, baseBet, sessionActive, highestMartingale, calculateBetAmount]);

  // Auto-show session modal on initial load if no history exists
  useEffect(() => {
    if (dataLoaded && sessionHistory.length === 0 && !sessionActive && !sessionStartTime) {
      setShowSessionModal(true);
    }
  }, [dataLoaded, sessionHistory.length, sessionActive, sessionStartTime]);

  // Auto-analyze hot zones when results change
  useEffect(() => {
    if (results.length > 0) {
      analyzeShiftStatus(results).then(response => {
        // Hot zone analysis complete - auto skip mode is now handled in ResultEntry component
      }).catch(err => {
        console.warn('Hot zone analysis failed:', err.message);
      });
    }
  }, [results, analyzeShiftStatus]); // Only depend on results and analyzeShiftStatus

  // Update session state in database for persistence
  const persistSessionState = useCallback(async () => {
    if (sessionActive && currentSessionId) {
      try {
        await updateSession(currentSessionId, {
          currentCapital,
          currentBetAmount,
          consecutiveLosses,
          totalBets,
          successfulBets,
          highestMartingale,
          profit: sessionProfit,
          targetProfitAmount,
          targetWinCount,
          currentWinCount,
          lastActivity: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to update session state:', error);
        // Don't throw - this is not critical for gameplay
      }
    }
  }, [sessionActive, currentSessionId, updateSession, currentCapital, currentBetAmount, consecutiveLosses, totalBets, successfulBets, highestMartingale, sessionProfit, targetProfitAmount, targetWinCount, currentWinCount]);

  // Update session state in database when key values change (for persistence)
  useEffect(() => {
    // Debounce the update to avoid too many database calls
    const timeoutId = setTimeout(() => {
      persistSessionState();
    }, 1000); // Update after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [currentCapital, consecutiveLosses, totalBets, successfulBets, sessionProfit, targetWinCount, currentWinCount, persistSessionState]);

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

  // Update last activity timestamp for inactivity timeout tracking
  const updateLastActivity = useCallback(async () => {
    if (sessionActive && currentSessionId) {
      try {
        await updateSession(currentSessionId, {
          lastActivity: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to update last activity:', error);
        // Don't throw - this is not critical for gameplay
      }
    }
  }, [sessionActive, currentSessionId, updateSession]);

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
        const timestamp = new Date().toISOString();
        const newResults = [...results, result];
        const newTimestamps = [...resultTimestamps, timestamp];
        const newSkipInfo = [...resultSkipInfo, {
          isSkipped: false, // Chance results are never skipped in this context
          skipReason: null,
          timestamp: timestamp
        }];
        
        setResults(newResults);
        setResultTimestamps(newTimestamps);
        setResultSkipInfo(newSkipInfo);
        
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
            // Update last activity timestamp
            await updateLastActivity();
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
        const timestamp = new Date().toISOString();
        const newResults = [...results, result];
        const newTimestamps = [...resultTimestamps, timestamp];
        const newSkipInfo = [...resultSkipInfo, {
          isSkipped: false, // Multiplier results are never skipped
          skipReason: null,
          timestamp: timestamp
        }];
        
        setResults(newResults);
        setResultTimestamps(newTimestamps);
        setResultSkipInfo(newSkipInfo);
        
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
            // Update last activity timestamp
            await updateLastActivity();
            
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
    let isSkipped = false;

    // Check dual-condition betting status
    const bettingStatus = getDualConditionBettingStatus();
    if (!bettingStatus.shouldBet && sessionActive) {
      // Betting skipped: Record result but no P/L or martingale changes
      actualBetAmount = 0;
      won = false;
      isSkipped = true;
      // Keep all values the same - no capital change, no martingale progression
      newCapital = currentCapital;
    } else if (sessionActive && recommendation.shouldBet && currentBetAmount <= currentCapital) {
      // Normal betting mode
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
    
    // Add result to local state with skip information
    const timestamp = new Date().toISOString();
    const newResults = [...results, result];
    const newTimestamps = [...resultTimestamps, timestamp];
    const newSkipInfo = [...resultSkipInfo, {
      isSkipped: isSkipped,
      skipReason: isSkipped ? bettingStatus.reason : null,
      timestamp: timestamp
    }];
    
    setResults(newResults);
    setResultTimestamps(newTimestamps);
    setResultSkipInfo(newSkipInfo);
    
    // Save to database if session active
    if (sessionActive && currentSessionId) {
      try {
        await addResultToDb(currentSessionId, {
          resultValue: result,
          betAmount: actualBetAmount,
          won: won,
          capitalAfter: newCapital,
          martingaleLevel: consecutiveLosses,
          isSkipped: isSkipped,
          skipReason: isSkipped ? bettingStatus.reason : null
        });
        // Update last activity timestamp
        await updateLastActivity();
      } catch (error) {
        console.error('Failed to save result to database:', error);
      }
    }
  }, [sessionActive, recommendation, currentBetAmount, currentCapital, chanceIsPending, initializeChance, processNextSpin, results, resultTimestamps, resultSkipInfo, getDualConditionBettingStatus, currentSessionId, addResultToDb, consecutiveLosses, baseBet, successfulBets, totalBets, startingCapital, sessionProfit, targetWinCount, currentWinCount, updateLastActivity]);

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
      showNotification('⚠️ No results to copy', 'warning');
      return;
    }

    const textToCopy = results.join(',');
    
    // Check if modern clipboard API is available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        showNotification(`✅ Copied ${results.length} results to clipboard!`, 'success');
        return;
      } catch (err) {
        console.warn('Clipboard API failed, falling back to execCommand:', err);
      }
    }
    
    // Fallback method for older browsers or when clipboard API is not available
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showNotification(`✅ Copied ${results.length} results to clipboard!`, 'success');
      } else {
        throw new Error('execCommand copy failed');
      }
    } catch (fallbackErr) {
      console.error('Failed to copy to clipboard:', fallbackErr);
      showNotification('❌ Failed to copy to clipboard. Please copy manually from console.', 'error');
      console.log('Copy this text manually:', textToCopy);
    } finally {
      document.body.removeChild(textArea);
    }
  }, [results, showNotification]);

  // Handle undo
  const handleUndoWithAlert = useCallback(() => {
    if (results.length === 0) {
      showNotification('⚠️ No results to undo', 'warning');
      return;
    }

    const newResults = results.slice(0, -1);
    const newTimestamps = resultTimestamps.slice(0, -1);
    setResults(newResults);
    setResultTimestamps(newTimestamps);
    
    showNotification('✅ Undid last result', 'success');
  }, [results, resultTimestamps, showNotification]);

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
          // Update last activity timestamp
          await updateLastActivity();
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
          // Calculate correct capital using the profit/loss from handleCashPrize
          // This avoids double-counting the cash prize amount
          const capitalAfterCashPrize = currentCapital + result.amount;
          
          await addResultToDb(currentSessionId, {
            resultValue: 'chance',
            betAmount: chanceIsPending ? chanceOriginalBet : 0,
            won: true, // Cash prize is an immediate win
            capitalAfter: capitalAfterCashPrize,
            martingaleLevel: consecutiveLosses,
            chanceEvent: {
              eventType: 'CASH_PRIZE',
              cashAmount: amount,
              originalBetAmount: chanceIsPending ? chanceOriginalBet : 0
            }
          });
          // Update last activity timestamp
          await updateLastActivity();
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
        // Update last activity timestamp
        await updateLastActivity();
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

              <ModeSelector
                mode={bettingStrategy}
                onModeChange={(newMode) => {
                  setBettingStrategy(newMode);
                  if (newMode === 'flat') {
                    setConditionStrategy('l3_only');
                  } else {
                    setConditionStrategy('hz_l3');
                  }
                }}
              />

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
        {/* Prominent Betting Display */}
        {sessionActive && (() => {
          const bettingStatus = getDualConditionBettingStatus();
          const strategyName = bettingStrategy === 'martingale' ? 'Martingale' : 'Flat Betting';

          return (
            <div className={`bg-white rounded-lg shadow-lg p-6 border-4 mb-6 ${
              bettingStatus.shouldBet 
                ? 'border-green-500 bg-green-50 animate-pulse shadow-green-400/50 shadow-xl' 
                : 'border-red-500 bg-red-50 animate-pulse shadow-red-400/50 shadow-xl'
            }`}>
            <div className="flex justify-between items-center">
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-700 mb-1">{strategyName.toUpperCase()} BET</div>
                <div className="text-4xl font-bold text-blue-600">
                  ₱{currentBetAmount.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  {bettingStrategy === 'martingale' && consecutiveLosses > 0 ? `Martingale x${Math.pow(2, consecutiveLosses)}` : 'Base bet'}
                </div>
              </div>
              <div className="text-center">
                {(() => {
                  const bettingStatus = getDualConditionBettingStatus();
                  return (
                    <>
                      <div className={`text-3xl font-bold ${
                        bettingStatus.shouldBet ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {bettingStatus.shouldBet ? '✅ BET' : '🛑 SKIP'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {bettingStatus.shouldBet ? 'Place bet on "1"' : 'Do not bet'}
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center gap-2">
                          <span>HZ: {bettingStatus.hotZoneCondition}</span>
                          {(() => {
                            const currentHotZoneStatus = getCurrentStatus();
                            return currentHotZoneStatus && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Zone {currentHotZoneStatus.dominantZone}</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  currentHotZoneStatus.status === 'Hot' ? 'bg-red-500 text-white' :
                                  currentHotZoneStatus.status === 'Warming' ? 'bg-orange-500 text-white' :
                                  currentHotZoneStatus.status === 'Cooling' ? 'bg-blue-500 text-white' :
                                  currentHotZoneStatus.status === 'Cold' ? 'bg-gray-500 text-white' :
                                  'bg-gray-300 text-gray-700'
                                }`}>
                                  {currentHotZoneStatus.status}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                        <div>L3: {bettingStatus.last3Condition}</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
          );
        })()}

        {/* Recent Results - Full Width */}
        <div className={`mb-6 ${
          bettingStrategy === 'martingale' && results.length < 20 ? 'opacity-50 pointer-events-none' : ''
        }`}>
          <RecentResultsWithSkip 
            results={results} 
            resultTimestamps={resultTimestamps}
            resultSkipInfo={resultSkipInfo}
            onCopy={copyToClipboard}
            onExport={exportToCSV}
          />
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
            onClearSession: handleClearSession,
            // Hot zone data
            hotZone: {
              isActive: isAnalysisActive,
              status: getCurrentStatus()?.status || 'Cold',
              dominantZone: getCurrentStatus()?.dominantZone || 'A',
              totalSpins: getCurrentStatus()?.totalSpins || results.length,
              requiredSpins: getMinSpinsRequired(),
              loading: hotZoneLoading,
              error: hotZoneError
            },
            // Dual-condition betting status
            bettingStatus: getDualConditionBettingStatus(),
            conditionStrategy: conditionStrategy
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

      {/* Debug Console - Press Ctrl+D or Cmd+D to toggle */}
      <DebugConsole 
        isVisible={showDebugConsole}
        onClose={() => setShowDebugConsole(false)}
      />

      {/* Debug Console Toggle Button (visible only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => setShowDebugConsole(true)}
          className="fixed bottom-4 right-4 bg-red-600 text-white px-3 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-red-700"
          title="Open Debug Console (or press Ctrl+D)"
        >
          🐛 DEBUG
        </button>
      )}
    </div>
  );
};

export default LiveTracker; 