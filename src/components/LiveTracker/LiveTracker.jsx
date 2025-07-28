import React, { useState, useEffect, useCallback } from 'react';
import useSessionData from '../../hooks/useSessionData';
import { calculateMartingaleBet } from '../MonopolyTracker/utils/calculations';
import { getBettingRecommendation, analyzeOnesPattern } from '../MonopolyTracker/utils/patterns';
import ResultEntry from '../MonopolyTracker/components/ResultEntry';
import RecentResults from '../MonopolyTracker/components/RecentResults';
import ChanceModal from '../MonopolyTracker/components/ChanceModal';
import { useChanceLogic } from '../MonopolyTracker/hooks/useChanceLogic';
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
    loadHistory();
  }, [loadSessionHistory]);

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

  // Get betting recommendation
  const recommendation = getBettingRecommendation(results, consecutiveLosses, baseBet);
  // eslint-disable-next-line no-unused-vars
  const analysis = analyzeOnesPattern(results); // Pattern analysis for future features

  // Session management functions
  const initializeSession = useCallback(async (capital, bet) => {
    try {
      const safeCapital = parseFloat(capital) || 0;
      const safeBet = parseFloat(bet) || 0;
      
      if (safeCapital <= 0 || safeBet <= 0) {
        throw new Error('Invalid capital or bet amount');
      }
      
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
      
    } catch (error) {
      console.error('Failed to initialize session:', error);
      alert('Failed to create session');
    }
  }, [createSession]);

  const archiveCurrentSession = useCallback(async (customEndTime = null) => {
    if (!currentSessionId || !sessionActive) return;

    try {
      const endData = {
        finalCapital: currentCapital,
        profit: sessionProfit,
        totalBets: totalBets,
        successfulBets: successfulBets,
        winRate: totalBets > 0 ? (successfulBets / totalBets * 100) : 0,
        highestMartingale: highestMartingale
      };

      await endSession(currentSessionId, endData);
      setSessionActive(false);
      setSessionEndTime(customEndTime || new Date().toISOString());

      // Reload session history
      const history = await loadSessionHistory();
      setSessionHistory(history || []);

    } catch (error) {
      console.error('Failed to archive session:', error);
      alert('Failed to end session');
    }
  }, [currentSessionId, sessionActive, currentCapital, sessionProfit, totalBets, successfulBets, highestMartingale, endSession, loadSessionHistory]);

  const clearCurrentSession = useCallback(() => {
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
  }, []);

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
  }, [sessionActive, recommendation, currentBetAmount, currentCapital, chanceIsPending, initializeChance, processNextSpin, results, resultTimestamps, currentSessionId, addResultToDb, consecutiveLosses, baseBet, successfulBets, totalBets, startingCapital, sessionProfit]);

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
  const handleChanceModalMultiplier = (multiplier) => {
    const result = handleMultiplier(multiplier);
    if (result.success) {
      const newResults = [...results, 'chance'];
      const newTimestamps = [...resultTimestamps, new Date().toISOString()];
      setResults(newResults);
      setResultTimestamps(newTimestamps);
    }
  };

  const handleChanceModalCash = (amount) => {
    const result = handleCashPrize(amount);
    if (result.success) {
      const newResults = [...results, 'chance'];
      const newTimestamps = [...resultTimestamps, new Date().toISOString()];
      setResults(newResults);
      setResultTimestamps(newTimestamps);
    }
  };

  const handleChanceModalClose = () => {
    closeModal();
    const newResults = [...results, 'chance'];
    const newTimestamps = [...resultTimestamps, new Date().toISOString()];
    setResults(newResults);
    setResultTimestamps(newTimestamps);
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
                  
                  if (startCapital <= 0 || baseBetAmount <= 0) {
                    alert('Please enter valid amounts greater than 0');
                    return;
                  }
                  
                  if (baseBetAmount > startCapital) {
                    alert('Base bet cannot be greater than starting capital');
                    return;
                  }
                  
                  initializeSession(startCapital, baseBetAmount);
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

        {/* Recent Results - Full Width */}
        <div className="mb-6">
          <RecentResults 
            results={results} 
            resultTimestamps={resultTimestamps}
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
      {isFloatingCardVisible && !showSessionModal && !chanceModalOpen && (
        <ResultEntry 
          onResultClick={handleAddResult} 
          onUndo={handleUndoWithAlert} 
          sessionData={{
            consecutiveLosses,
            recommendation,
            sessionActive,
            totalResults: results.length,
            currentBetAmount,
            currentCapital,
            sessionProfit,
            totalBets,
            successfulBets,
            onStartSession: () => setShowSessionModal(true),
            onEndSession: () => {
              if (window.confirm('End current session? This will archive the session to history and stop tracking.')) {
                const endTime = new Date().toISOString();
                setSessionEndTime(endTime);
                archiveCurrentSession(endTime);
                setSessionActive(false);
                alert('✅ Session ended and archived to history!');
              }
            },
            onClearSession: () => {
              if (window.confirm('🚨 Are you sure you want to clear the current session? This action cannot be undone.')) {
                clearCurrentSession();
                alert('✅ Current session cleared!');
              }
            }
          }}
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