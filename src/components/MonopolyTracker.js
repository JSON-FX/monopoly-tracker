import React, { useState, useEffect, useCallback } from 'react';

// Import custom hooks
import { useLocalStorage } from './MonopolyTracker/hooks/useLocalStorage';
import { useSessionManagement } from './MonopolyTracker/hooks/useSessionManagement';
import { useBettingLogic } from './MonopolyTracker/hooks/useBettingLogic';
import { useChanceLogic } from './MonopolyTracker/hooks/useChanceLogic';

// Import utility functions
import { calculateMartingaleBet, calculateSessionDuration } from './MonopolyTracker/utils/calculations';
import { getBettingRecommendation, analyzeOnesPattern } from './MonopolyTracker/utils/patterns';

// Import components
import ResultEntry from './MonopolyTracker/components/ResultEntry';
import RecentResults from './MonopolyTracker/components/RecentResults';
import ChanceModal from './MonopolyTracker/components/ChanceModal';

const MonopolyTracker = () => {
  // Core state
  const [results, setResults] = useState([]);
  const [resultTimestamps, setResultTimestamps] = useState([]);
  const [activeTab, setActiveTab] = useState('tracker');
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
  
  // Simplified betting state
  const [lastBetAmount, setLastBetAmount] = useState(0);
  const [lastBetWon, setLastBetWon] = useState(false);

  // Helper function to update multiple state values
  const updateState = useCallback((updates) => {
    Object.entries(updates).forEach(([key, value]) => {
      if (typeof value === 'function') {
        // Handle state setters that take a function
        switch (key) {
          case 'successfulBets':
            setSuccessfulBets(value);
            break;
          case 'totalBets':
            setTotalBets(value);
            break;
          default:
            console.warn(`Unknown function-based state update: ${key}`);
        }
      } else {
        // Handle direct value updates
        switch (key) {
          case 'results':
            setResults(value);
            break;
          case 'resultTimestamps':
            setResultTimestamps(value);
            break;
          case 'totalBets':
            setTotalBets(value);
            break;
          case 'successfulBets':
            setSuccessfulBets(value);
            break;
          case 'sessionActive':
            setSessionActive(value);
            break;
          case 'startingCapital':
            setStartingCapital(value);
            break;
          case 'currentCapital':
            setCurrentCapital(value);
            break;
          case 'baseBet':
            setBaseBet(value);
            break;
          case 'currentBetAmount':
            setCurrentBetAmount(value);
            break;
          case 'consecutiveLosses':
            setConsecutiveLosses(value);
            break;
          case 'sessionProfit':
            setSessionProfit(value);
            break;
          case 'sessionStartTime':
            setSessionStartTime(value);
            break;
          case 'sessionEndTime':
            setSessionEndTime(value);
            break;
          case 'sessionHistory':
            setSessionHistory(value);
            break;
          case 'highestMartingale':
            setHighestMartingale(value);
            break;
          case 'lastBetAmount':
            setLastBetAmount(value);
            break;
          case 'lastBetWon':
            setLastBetWon(value);
            break;
          default:
            console.warn(`Unknown state update: ${key}`);
        }
      }
    });
  }, []);

  // Combine all state for hooks
  const allState = {
    results, resultTimestamps, totalBets, successfulBets, sessionActive,
    startingCapital, currentCapital, baseBet, currentBetAmount, consecutiveLosses,
    sessionProfit, sessionStartTime, sessionEndTime, sessionHistory, highestMartingale,
    lastBetAmount, lastBetWon
  };

  // Initialize hooks
  const { loadData, clearData } = useLocalStorage(allState, dataLoaded);
  const { archiveCurrentSession, initializeSession, clearCurrentSession, resetHistory } = 
    useSessionManagement(allState, updateState);
  const { handleSessionBet, addResult, handleUndo } = 
    useBettingLogic(allState, updateState);
  
  // Initialize chance logic hook
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
  } = useChanceLogic(allState, updateState);

  // Load data on mount
  useEffect(() => {
    const savedData = loadData();
    if (savedData) {
      updateState(savedData);
    }
    setDataLoaded(true);
  }, [loadData, updateState]);

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

  // Get betting recommendation
  const recommendation = getBettingRecommendation(results, consecutiveLosses, baseBet);
  const analysis = analyzeOnesPattern(results);

  // Handle result addition with new chance logic
  const handleAddResult = useCallback((result) => {
    if (result === 'chance') {
      const shouldBet = sessionActive && recommendation.shouldBet && currentBetAmount <= currentCapital;
      
      if (shouldBet) {
        // Initialize chance with current bet amount (pre-condition: user must be in "Bet" status)
        initializeChance(currentBetAmount);
      } else {
        // No bet placed, just add result
        addResult(result);
      }
      return;
    }
    
    // Check if we need to process pending multiplier
    if (chanceIsPending) {
      const spinResult = processNextSpin(result);
      if (spinResult.processed) {
        // Multiplier was processed, add the result
        addResult(result);
        return;
      }
    }
    
    // Regular processing for non-chance results
    if (sessionActive && recommendation.shouldBet && currentBetAmount <= currentCapital) {
      const won = result === '1';
      handleSessionBet(currentBetAmount, won, false);
    }
    
    addResult(result);
  }, [sessionActive, recommendation, currentBetAmount, currentCapital, chanceIsPending, initializeChance, processNextSpin, handleSessionBet, addResult]);

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

  // Handle undo with alert
  const handleUndoWithAlert = useCallback(() => {
    const result = handleUndo();
    if (result.success) {
      alert(result.message);
    } else {
      alert(result.message);
    }
  }, [handleUndo]);

  // Chance modal handlers
  const handleChanceModalMultiplier = (multiplier) => {
    const result = handleMultiplier(multiplier);
    if (result.success) {
      addResult('chance');
    }
  };

  const handleChanceModalCash = (amount) => {
    const result = handleCashPrize(amount);
    if (result.success) {
      addResult('chance');
    }
  };

  const handleChanceModalClose = () => {
    closeModal();
    addResult('chance'); // Add chance result even if no selection is made
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
                    onClick={() => {
                      if (window.confirm('🚨 Are you sure you want to clear the current session? This action cannot be undone.')) {
                        clearCurrentSession();
                        alert('✅ Current session cleared!');
                      }
                    }}
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
                    {calculateSessionDuration(sessionStartTime, sessionEndTime)}
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
              {chanceIsPending && (
                <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-4">
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

              <ResultEntry onResultClick={handleAddResult} onUndo={handleUndoWithAlert} />
              <RecentResults 
                results={results} 
                resultTimestamps={resultTimestamps}
                onCopy={copyToClipboard}
                onExport={exportToCSV}
              />
            </div>

            {/* Recommendation Panel */}
            <div className="space-y-6">
              <div className={`bg-white rounded-lg shadow-lg p-6 ${
                recommendation.shouldBet ? 'ring-2 ring-green-500' : 'ring-2 ring-red-500'
              }`}>
                <h2 className="text-xl font-semibold mb-4">Betting Recommendation</h2>
                
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
                </div>
              </div>

              {/* Essential Stats */}
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

        {/* History Tab - Basic implementation */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Session History</h2>
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🏗️</div>
              <div className="text-gray-500">History component coming soon in Phase 3 completion</div>
              <button
                onClick={() => {
                  if (window.confirm('Clear all history?')) {
                    resetHistory();
                    clearData();
                    alert('✅ All history cleared!');
                  }
                }}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️ Clear All History
              </button>
            </div>
          </div>
        )}
      </div>
      
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

export default MonopolyTracker; 