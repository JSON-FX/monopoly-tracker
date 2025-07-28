import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import useSessionData from '../hooks/useSessionData';
import ResultEntry from './MonopolyTracker/components/ResultEntry';
import RecentResults from './MonopolyTracker/components/RecentResults';
import History from './MonopolyTracker/components/History';
import ChanceModal from './MonopolyTracker/components/ChanceModal';
import BettingRecommendation from './MonopolyTracker/components/BettingRecommendation';

// Import utility functions
import { calculateMartingaleBet, calculateSessionDuration } from './MonopolyTracker/utils/calculations';
import { getBettingRecommendation, analyzeOnesPattern } from './MonopolyTracker/utils/patterns';

// Import hooks
import { useChanceLogic } from './MonopolyTracker/hooks/useChanceLogic';

// User Header Component
const UserHeader = ({ user, onLogout }) => {
  if (!user) return null;

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold">
              {user.initials}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Welcome back, {user.first_name}!
              </h1>
              <p className="text-sm text-gray-500">Ready for some Monopoly Live?</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

const MonopolyTracker = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const {
    loading: sessionLoading,
    error: sessionError,
    createSession,
    getActiveSession,
    getUserSessions,
    updateSession,
    endSession,
    addResult,
    undoLastResult,
    loadSessionHistory
  } = useSessionData();

  // Core state - ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [results, setResults] = useState([]);
  const [resultTimestamps, setResultTimestamps] = useState([]);
  const [activeTab, setActiveTab] = useState('tracker');
  const [totalBets, setTotalBets] = useState(0);
  const [successfulBets, setSuccessfulBets] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Session management state
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [startingCapital, setStartingCapital] = useState(0);
  const [currentCapital, setCurrentCapital] = useState(0);
  const [baseBet, setBaseBet] = useState(0);
  const [currentBetAmount, setCurrentBetAmount] = useState(0);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  const [betsPlaced, setBetsPlaced] = useState([]);
  const [sessionProfit, setSessionProfit] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionEndTime, setSessionEndTime] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [sessionArchived, setSessionArchived] = useState(false);
  const [highestMartingale, setHighestMartingale] = useState(0);

  // Chance modal state
  const [showChanceModal, setShowChanceModal] = useState(false);
  const [chanceModalData, setChanceModalData] = useState(null);

  // Betting decision state
  const [currentBetDecision, setCurrentBetDecision] = useState(null); // 'bet', 'skip', or null
  const [betAmount, setBetAmount] = useState(0);
  const [isWaitingForResult, setIsWaitingForResult] = useState(false);

  // Chance state model
  const [chanceState, setChanceState] = useState({
    stackedMultiplier: 1,
    pendingCash: 0
  });

  // Initialize chance logic hook
  const chanceLogic = useChanceLogic(
    {
      currentCapital,
      startingCapital,
      baseBet,
      consecutiveLosses,
      sessionActive
    },
    (updates) => {
      // Handle state updates from chance logic
      if (updates.currentCapital !== undefined) setCurrentCapital(updates.currentCapital);
      if (updates.sessionProfit !== undefined) setSessionProfit(updates.sessionProfit);
      if (updates.consecutiveLosses !== undefined) setConsecutiveLosses(updates.consecutiveLosses);
      if (updates.currentBetAmount !== undefined) setCurrentBetAmount(updates.currentBetAmount);
      if (updates.successfulBets !== undefined) setSuccessfulBets(prev => updates.successfulBets(prev));
      if (updates.totalBets !== undefined) setTotalBets(prev => updates.totalBets(prev));
    }
  );

  // Simulation state
  const [simulationData, setSimulationData] = useState([]);
  const [simulationInput, setSimulationInput] = useState('');
  const [simulationCapital, setSimulationCapital] = useState(1000);
  const [simulationBaseBet, setSimulationBaseBet] = useState(10);

  // Load active session and session history on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated || !user) return;

      try {
        // Load active session
        const activeSession = await getActiveSession();
        if (activeSession) {
          setCurrentSessionId(activeSession.id);
          setSessionActive(true);
          setStartingCapital(parseFloat(activeSession.startingCapital) || 0);
          setCurrentCapital(parseFloat(activeSession.currentCapital || activeSession.finalCapital) || 0);
          setBaseBet(parseFloat(activeSession.baseBet) || 0);
          setCurrentBetAmount(parseFloat(activeSession.baseBet) || 0);
          setSessionStartTime(activeSession.startTime);
          setSessionEndTime(activeSession.endTime);
          setTotalBets(parseInt(activeSession.totalBets) || 0);
          setSuccessfulBets(parseInt(activeSession.successfulBets) || 0);
          setConsecutiveLosses(0); // Reset for active session
          setHighestMartingale(parseFloat(activeSession.highestMartingale || activeSession.baseBet) || 0);
          setSessionProfit((parseFloat(activeSession.currentCapital || activeSession.finalCapital) || 0) - (parseFloat(activeSession.startingCapital) || 0));
          
          // Calculate consecutive losses from results
          const recentResults = (activeSession.results || []).slice(-10);
          let losses = 0;
          for (let i = recentResults.length - 1; i >= 0; i--) {
            if (['1', '2', '5', '10'].includes(recentResults[i])) {
              losses++;
            } else {
              break;
            }
          }
          setConsecutiveLosses(losses);
        }

        // Load session history
        const history = await loadSessionHistory();
        setSessionHistory(history);

        setDataLoaded(true);
      } catch (error) {
        console.error('Failed to load session data:', error);
        setDataLoaded(true);
      }
    };

    loadData();
  }, [isAuthenticated, user, getActiveSession, loadSessionHistory]);

  // Update current bet amount based on consecutive losses
  useEffect(() => {
    if (sessionActive && baseBet > 0) {
      const martingaleBet = calculateMartingaleBet(baseBet, consecutiveLosses);
      setCurrentBetAmount(martingaleBet);
      
      // Update highest martingale if current bet is higher
      if (martingaleBet > highestMartingale) {
        setHighestMartingale(martingaleBet);
      }
    }
  }, [consecutiveLosses, baseBet, sessionActive, highestMartingale]);

  // Auto-show session modal on initial load if no active session
  useEffect(() => {
    if (dataLoaded && !sessionActive && sessionHistory.length === 0) {
      setShowSessionModal(true);
    }
  }, [dataLoaded, sessionActive, sessionHistory.length]);

  // Get betting recommendation
  const recommendation = getBettingRecommendation(results, consecutiveLosses, baseBet, currentBetAmount);
  const analysis = analyzeOnesPattern(results);

  // Handle betting decisions
  const handleBetDecision = useCallback(async (decision, amount) => {
    if (!sessionActive) return;
    
    setCurrentBetDecision(decision);
    // Store the current bet amount (which includes martingale progression)
    setBetAmount(decision === 'bet' ? currentBetAmount : 0);
    setIsWaitingForResult(true);
    
    console.log(`Betting decision: ${decision.toUpperCase()}${decision === 'bet' ? ` for ₱${currentBetAmount}` : ''}`);
    
    // If user chose to skip, we still track the decision but don't risk capital
    if (decision === 'skip') {
      // Just track that we're waiting for the result to see if the recommendation was good
      window.showNotification && window.showNotification(`⏸️ Skipped bet - Waiting for result`, 'info');
    } else {
      const martingaleInfo = currentBetAmount > baseBet ? ` (Martingale x${Math.round(currentBetAmount / baseBet)})` : '';
      window.showNotification && window.showNotification(`🎯 Bet placed: ₱${currentBetAmount}${martingaleInfo} - Waiting for result`, 'success');
    }
  }, [sessionActive, currentBetAmount, baseBet]);

  // Reset betting decision after result
  const resetBettingDecision = useCallback(() => {
    setCurrentBetDecision(null);
    setBetAmount(0);
    setIsWaitingForResult(false);
  }, []);

  // Session management functions
  const initializeSession = useCallback(async (capital, bet) => {
    try {
      // Ensure values are numbers
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
      setCurrentBetAmount(safeBet); // Initialize with base bet
      setSessionStartTime(newSession.startTime);
      setSessionEndTime(null);
      setResults([]);
      setResultTimestamps([]);
      setTotalBets(0);
      setSuccessfulBets(0);
      setConsecutiveLosses(0);
      setSessionProfit(0);
      setHighestMartingale(safeBet);
      setSessionArchived(false);
      setBetsPlaced([]);
      setShowSessionModal(false);

    } catch (error) {
      console.error('Failed to initialize session:', error);
      window.showNotification && window.showNotification('Failed to create session', 'error');
    }
  }, [createSession, isAuthenticated, user]);

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

      // Update local state
      setSessionActive(false);
      setSessionEndTime(customEndTime || new Date().toISOString());
      setSessionArchived(true);

      // Reload session history
      const history = await loadSessionHistory();
      setSessionHistory(history);

      console.log('Session archived successfully');
    } catch (error) {
      console.error('Failed to archive session:', error);
      window.showNotification && window.showNotification('Failed to end session', 'error');
    }
  }, [currentSessionId, sessionActive, currentCapital, sessionProfit, totalBets, successfulBets, highestMartingale, endSession, loadSessionHistory]);

  const handleAddResult = useCallback(async (result) => {
    if (!sessionActive || !currentSessionId) {
      window.showNotification && window.showNotification('No active session', 'error');
      return;
    }

    try {
      // Handle chance results specially
      if (result.toLowerCase() === 'chance') {
        if (currentBetDecision === 'bet') {
          // User was betting, show chance modal
          chanceLogic.initializeChance(betAmount || currentBetAmount);
          setShowChanceModal(true);
        } else {
          // User was skipping, just add the result without capital changes
          const newResults = [...results, result];
          const newTimestamps = [...resultTimestamps, new Date().toISOString()];
          setResults(newResults);
          setResultTimestamps(newTimestamps);
          
          await addResult(currentSessionId, {
            resultValue: result,
            betAmount: 0,
            won: false,
            capitalAfter: currentCapital,
            martingaleLevel: consecutiveLosses,
            userDecision: currentBetDecision
          });
        }
        resetBettingDecision();
        return;
      }

      // Check if there's a pending multiplier from chance
      if (chanceLogic.isPending) {
        const chanceResult = chanceLogic.processNextSpin(result);
        if (chanceResult.processed) {
          // Add result with chance processing
          const newResults = [...results, result];
          const newTimestamps = [...resultTimestamps, new Date().toISOString()];
          setResults(newResults);
          setResultTimestamps(newTimestamps);
          
          await addResult(currentSessionId, {
            resultValue: result,
            betAmount: chanceResult.amount,
            won: chanceResult.won,
            capitalAfter: currentCapital,
            martingaleLevel: consecutiveLosses,
            isMultiplier: true,
            userDecision: 'bet' // Chance always counts as betting
          });
          
          window.showNotification && window.showNotification(
            chanceResult.won 
              ? `🎉 Multiplier WIN! +₱${chanceResult.amount}` 
              : `💔 Multiplier LOSS: -₱${chanceResult.amount}`,
            chanceResult.won ? 'success' : 'error'
          );
          
          resetBettingDecision();
          return;
        }
      }

      // Regular result processing
      const isWinningNumber = result === '1';
      let newCapital = currentCapital;
      let won = false;
      let actualBetAmount = 0;

      if (currentBetDecision === 'bet') {
        // User placed a bet - use the current bet amount (which has martingale applied)
        actualBetAmount = currentBetAmount;
        if (isWinningNumber) {
          // Win: Add bet amount to capital
          newCapital = currentCapital + actualBetAmount;
          won = true;
          setSuccessfulBets(successfulBets + 1);
          setConsecutiveLosses(0);
          setCurrentBetAmount(baseBet); // Reset to base bet
          window.showNotification && window.showNotification(`🎉 WIN! +₱${actualBetAmount}`, 'success');
        } else {
          // Loss: Subtract bet amount from capital
          newCapital = currentCapital - actualBetAmount;
          won = false;
          const newConsecutiveLosses = consecutiveLosses + 1;
          setConsecutiveLosses(newConsecutiveLosses);
          const newBetAmount = calculateMartingaleBet(baseBet, newConsecutiveLosses);
          setCurrentBetAmount(newBetAmount); // Apply martingale progression
          window.showNotification && window.showNotification(`💔 LOSS: -₱${actualBetAmount} | Next bet: ₱${newBetAmount}`, 'error');
        }
        setTotalBets(totalBets + 1);
      } else if (currentBetDecision === 'skip') {
        // User skipped - no capital change, but track for recommendation accuracy
        if (isWinningNumber) {
          window.showNotification && window.showNotification(
            recommendation.shouldBet 
              ? `😅 Missed opportunity: Would have won ₱${recommendation.amount}` 
              : `✅ Good skip: Avoided potential loss`,
            recommendation.shouldBet ? 'warning' : 'info'
          );
        } else {
          window.showNotification && window.showNotification(
            recommendation.shouldBet 
              ? `✅ Good skip: Avoided loss of ₱${recommendation.amount}` 
              : `✅ Good skip: Pattern was correct`,
            'success'
          );
        }
      } else {
        // No decision made, just track result
        window.showNotification && window.showNotification(`📊 Result recorded: ${result}`, 'info');
      }

      // Update local state
      const newResults = [...results, result];
      const newTimestamps = [...resultTimestamps, new Date().toISOString()];
      
      setResults(newResults);
      setResultTimestamps(newTimestamps);
      setCurrentCapital(newCapital);
      setSessionProfit(newCapital - startingCapital);

      // Track bet decision
      setBetsPlaced([...betsPlaced, { 
        amount: actualBetAmount, 
        won, 
        result, 
        decision: currentBetDecision,
        timestamp: new Date().toISOString()
      }]);

      // Add result to database
      await addResult(currentSessionId, {
        resultValue: result,
        betAmount: actualBetAmount,
        won,
        capitalAfter: newCapital,
        martingaleLevel: consecutiveLosses,
        userDecision: currentBetDecision
      });

      // Update session in database
      await updateSession(currentSessionId, {
        currentCapital: newCapital,
        totalBets: currentBetDecision === 'bet' ? totalBets + 1 : totalBets,
        successfulBets: (currentBetDecision === 'bet' && won) ? successfulBets + 1 : successfulBets,
        profit: newCapital - startingCapital
      });

      resetBettingDecision();

    } catch (error) {
      console.error('Failed to add result:', error);
      window.showNotification && window.showNotification('Failed to add result', 'error');
    }
  }, [
    sessionActive, currentSessionId, currentCapital, consecutiveLosses, results, resultTimestamps, 
    totalBets, successfulBets, startingCapital, betsPlaced, currentBetDecision, betAmount, 
    currentBetAmount, baseBet, chanceLogic, recommendation, addResult, updateSession, resetBettingDecision
  ]);

  const handleUndo = useCallback(async () => {
    if (!sessionActive || !currentSessionId || results.length === 0) {
      window.showNotification && window.showNotification('Nothing to undo', 'warning');
      return;
    }

    try {
      await undoLastResult(currentSessionId);

      // Update local state by removing last result
      const newResults = results.slice(0, -1);
      const newTimestamps = resultTimestamps.slice(0, -1);
      const lastBet = betsPlaced[betsPlaced.length - 1];
      
      if (lastBet) {
        const newCapital = lastBet.won 
          ? currentCapital - lastBet.amount 
          : currentCapital + lastBet.amount;
        
        setResults(newResults);
        setResultTimestamps(newTimestamps);
        setCurrentCapital(newCapital);
        setTotalBets(Math.max(0, totalBets - 1));
        
        if (lastBet.won) {
          setSuccessfulBets(Math.max(0, successfulBets - 1));
        }
        
        setBetsPlaced(betsPlaced.slice(0, -1));
        setSessionProfit(newCapital - startingCapital);

        // Recalculate consecutive losses
        const recentResults = newResults.slice(-10);
        let losses = 0;
        for (let i = recentResults.length - 1; i >= 0; i--) {
          if (['1', '2', '5', '10'].includes(recentResults[i])) {
            losses++;
          } else {
            break;
          }
        }
        setConsecutiveLosses(losses);

        // Update session in database
        await updateSession(currentSessionId, {
          currentCapital: newCapital,
          totalBets: Math.max(0, totalBets - 1),
          successfulBets: lastBet.won ? Math.max(0, successfulBets - 1) : successfulBets,
          profit: newCapital - startingCapital
        });

        console.log('Last result undone');
        window.showNotification && window.showNotification('Last result undone', 'success');
      }
    } catch (error) {
      console.error('Failed to undo result:', error);
      window.showNotification && window.showNotification('Failed to undo result', 'error');
    }
  }, [sessionActive, currentSessionId, results, resultTimestamps, currentCapital, totalBets, successfulBets, startingCapital, betsPlaced, undoLastResult, updateSession]);

  const exportToCSV = useCallback(() => {
    if (!sessionActive || results.length === 0) {
      window.showNotification && window.showNotification('No data to export', 'warning');
      return;
    }

    try {
      const headers = ['Spin', 'Result', 'Timestamp', 'Bet Amount', 'Capital After'];
      const csvData = results.map((result, index) => [
        index + 1,
        result,
        new Date(resultTimestamps[index] || Date.now()).toLocaleString(),
        betsPlaced[index]?.amount || 'N/A',
        'N/A' // We'd need to track this better
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monopoly-session-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      window.showNotification && window.showNotification('Data exported successfully', 'success');
    } catch (error) {
      console.error('Export error:', error);
      window.showNotification && window.showNotification('Failed to export data', 'error');
    }
  }, [sessionActive, results, resultTimestamps, betsPlaced]);

  const copyToClipboard = useCallback(async () => {
    if (results.length === 0) {
      window.showNotification && window.showNotification('No data to copy', 'warning');
      return;
    }

    try {
      const resultsText = results.join(', ');
      await navigator.clipboard.writeText(resultsText);
      window.showNotification && window.showNotification('Results copied to clipboard', 'success');
    } catch (error) {
      console.error('Copy error:', error);
      window.showNotification && window.showNotification('Failed to copy results', 'error');
    }
  }, [results]);

  // AUTHENTICATION CHECK - Only after all hooks are called
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (sessionLoading && !dataLoaded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {sessionError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{sessionError}</p>
              </div>
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
                {user ? `Welcome back, ${user.first_name}! Advanced pattern analysis for optimal "1" betting strategy.` : 'Advanced pattern analysis for optimal "1" betting strategy'}
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
                        archiveCurrentSession();
                      }
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                  >
                    ⏹️ End Session
                  </button>
                </div>
              )}
              {user && (
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
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
                    ₱{(currentCapital || 0).toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Next Bet</div>
                  <div className={`text-lg font-bold ${currentBetAmount > baseBet ? 'text-red-600' : 'text-blue-600'}`}>
                    ₱{(currentBetAmount || 0).toFixed(2)}
                  </div>
                  {currentBetAmount > baseBet && (
                    <div className="text-xs text-red-500">
                      Martingale x{Math.round(currentBetAmount / baseBet)}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Session P/L</div>
                  <div className={`text-lg font-bold ${sessionProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(sessionProfit || 0) >= 0 ? '+' : ''}₱{(sessionProfit || 0).toFixed(2)}
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
                    {sessionStartTime ? calculateSessionDuration(sessionStartTime, sessionEndTime) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            {[
              { id: 'tracker', label: '🎮 Live Tracker', desc: 'Quick-click results & get recommendations' },
              { id: 'history', label: '📜 History', desc: `View past sessions (${sessionHistory.length})` }
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
                        ₱{(currentBetAmount || 0).toFixed(2)}
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
              {chanceLogic.isPending && (
                <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🎯</div>
                    <div>
                      <div className="font-bold text-yellow-800">
                        Pending Multiplier: {chanceLogic.pendingMultiplier}x
                      </div>
                      <div className="text-sm text-yellow-700">
                        Waiting for next result. Win = ₱{chanceLogic.originalBetAmount} × {chanceLogic.pendingMultiplier} = ₱{(chanceLogic.originalBetAmount * chanceLogic.pendingMultiplier).toFixed(2)} if "1"
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Betting Decision UI */}
              {sessionActive && !isWaitingForResult && (
                <BettingRecommendation
                  recommendation={recommendation}
                  onBetDecision={handleBetDecision}
                  hasActiveSession={sessionActive}
                  isPendingMultiplier={chanceLogic.isPending}
                  pendingMultiplier={chanceLogic.pendingMultiplier}
                />
              )}

              {/* Waiting for Result Status */}
              {sessionActive && isWaitingForResult && (
                <div className="bg-white rounded-lg shadow-lg p-6 border-4 border-blue-500 bg-blue-50">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {currentBetDecision === 'bet' 
                        ? `🎯 BET PLACED: ₱${betAmount?.toFixed(2)}` 
                        : '⏸️ SKIPPED BET'}
                    </div>
                    <div className="text-sm text-blue-700">Enter the spin result to see outcome</div>
                    {chanceLogic.isPending && (
                      <div className="text-sm mt-1 text-purple-600 font-medium">
                        ⚡ {chanceLogic.pendingMultiplier}x multiplier active
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Result Entry */}
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
            </div>

            {/* Sidebar - Recent Results */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Recent Results <span className="text-sm font-normal text-gray-500">(Latest → Oldest)</span></h2>
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    📋 Copy All
                  </button>
                </div>
                {results.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🎲</div>
                    <div className="text-gray-500">No results yet - start your fresh session!</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-2">
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
                            return result;
                        }
                      };

                      return (
                        <div
                          key={index}
                          className={`w-10 h-10 flex items-center justify-center text-sm font-bold rounded-lg ${getResultStyle(result)}`}
                        >
                          {getDisplayText(result)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Start Session Prompt */}
              {!sessionActive && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🎯</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Ready to Start?</h2>
                    <p className="text-gray-600 mb-4">Begin tracking your Monopoly Live session with intelligent betting recommendations.</p>
                    <button
                      onClick={() => setShowSessionModal(true)}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      💰 Start New Session
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <History 
            sessionHistory={sessionHistory}
            onClose={() => setActiveTab('tracker')}
            onSessionHistoryUpdate={setSessionHistory}
          />
        )}

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

        {/* Chance Modal */}
        {showChanceModal && chanceLogic.isModalOpen && (
          <ChanceModal
            isOpen={true}
            hasMultiplier={chanceLogic.isPending}
            pendingMultiplier={chanceLogic.pendingMultiplier}
            originalBet={chanceLogic.originalBetAmount}
            onClose={() => {
              chanceLogic.closeModal();
              setShowChanceModal(false);
            }}
            onMultiplierSelect={(multiplierValue) => {
              const result = chanceLogic.handleMultiplier(multiplierValue);
              setShowChanceModal(false);
              
              // Add chance result to history
              const newResults = [...results, 'chance'];
              const newTimestamps = [...resultTimestamps, new Date().toISOString()];
              setResults(newResults);
              setResultTimestamps(newTimestamps);
              
              window.showNotification && window.showNotification(
                `⚡ ${result.multiplier}x multiplier pending - Next "1" will be multiplied!`, 
                'info'
              );
            }}
            onCashSelect={async (cashAmount) => {
              const result = chanceLogic.handleCashPrize(cashAmount);
              setShowChanceModal(false);
              
              // Add chance result to history  
              const newResults = [...results, 'chance'];
              const newTimestamps = [...resultTimestamps, new Date().toISOString()];
              setResults(newResults);
              setResultTimestamps(newTimestamps);
              
              // Update session in database
              await updateSession(currentSessionId, {
                currentCapital,
                profit: sessionProfit
              });
              
              window.showNotification && window.showNotification(
                `💰 Cash prize: +₱${result.amount}`, 
                'success'
              );
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MonopolyTracker; 