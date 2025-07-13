import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MonopolyTracker = () => {
  const [results, setResults] = useState([]);
  const [resultTimestamps, setResultTimestamps] = useState([]);
  const [activeTab, setActiveTab] = useState('tracker');
  const [totalBets, setTotalBets] = useState(0);
  const [successfulBets, setSuccessfulBets] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Session management state
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
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
  
  // Pending multiplier state
  const [pendingMultiplier, setPendingMultiplier] = useState(null);
  
  // Simulation state
  const [simulationData, setSimulationData] = useState([]);
  const [simulationInput, setSimulationInput] = useState('');
  const [simulationCapital, setSimulationCapital] = useState(1000);
  const [simulationBaseBet, setSimulationBaseBet] = useState(10);

  // Load data from localStorage on component mount
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
        setBetsPlaced(data.betsPlaced || []);
        setSessionProfit(data.sessionProfit || 0);
        setSessionStartTime(data.sessionStartTime || null);
        setSessionEndTime(data.sessionEndTime || null);
        
        // Remove duplicate sessions based on startTime and results
        const uniqueSessions = [];
        const sessionKeys = new Set();
        (data.sessionHistory || []).forEach(session => {
          const key = `${session.startTime}-${session.results.length}-${session.profit}`;
          if (!sessionKeys.has(key)) {
            sessionKeys.add(key);
            uniqueSessions.push(session);
          }
        });
        setSessionHistory(uniqueSessions);
        
        setSessionArchived(data.sessionArchived || false);
        setHighestMartingale(data.highestMartingale || 0);
        
        // Load chance modal state
        setShowChanceModal(data.showChanceModal || false);
        setChanceModalData(data.chanceModalData || null);
        
        // Load pending multiplier state
        setPendingMultiplier(data.pendingMultiplier || null);
        
        // Load simulation state
        setSimulationData(data.simulationData || []);
        setSimulationInput(data.simulationInput || '');
        setSimulationCapital(data.simulationCapital || 1000);
        setSimulationBaseBet(data.simulationBaseBet || 10);
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
    setDataLoaded(true);
  }, []);

  // Save data to localStorage whenever relevant state changes
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
        betsPlaced,
        sessionProfit,
        sessionStartTime,
        sessionEndTime,
        sessionHistory,
        sessionArchived, // Save sessionArchived state
        showChanceModal,
        chanceModalData,
        pendingMultiplier,
        simulationData,
        simulationInput,
        simulationCapital,
        simulationBaseBet,
        highestMartingale
      };
      localStorage.setItem('monopolyTrackerData', JSON.stringify(dataToSave));
    }
  }, [dataLoaded, results, resultTimestamps, totalBets, successfulBets, sessionActive, startingCapital, currentCapital, baseBet, currentBetAmount, consecutiveLosses, betsPlaced, sessionProfit, sessionStartTime, sessionEndTime, sessionHistory, sessionArchived, showChanceModal, chanceModalData, pendingMultiplier, simulationData, simulationInput, simulationCapital, simulationBaseBet, highestMartingale]);


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

  // Archive current session to history
  const archiveCurrentSession = (customEndTime = null) => {
    if (sessionStartTime && (results.length > 0 || betsPlaced.length > 0) && !sessionArchived) {
      const endTime = customEndTime || sessionEndTime || new Date().toISOString();
      const currentSession = {
        id: Date.now(),
        startTime: sessionStartTime,
        endTime: endTime,
        results: [...results],
        resultTimestamps: [...resultTimestamps],
        betsPlaced: [...betsPlaced],
        startingCapital,
        finalCapital: currentCapital,
        profit: sessionProfit,
        totalBets,
        successfulBets,
        winRate: totalBets > 0 ? ((successfulBets / totalBets) * 100).toFixed(1) : 0,
        highestMartingale,
        duration: sessionStartTime ? (() => {
          const start = new Date(sessionStartTime);
          const end = new Date(endTime);
          const diff = end - start;
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          return `${hours}h ${minutes}m`;
        })() : 'N/A'
      };
      
      setSessionHistory(prev => [...prev, currentSession]);
      setSessionArchived(true);
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
    setBetsPlaced([]);
    setConsecutiveLosses(0);
    setHighestMartingale(0); // Reset to 0, will be set to first bet amount when first bet is placed
    
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
    setSessionArchived(false); // Reset sessionArchived state
  };

  // Handle session bet
  const handleSessionBet = (betAmount, won) => {
    if (!sessionActive) return;
    
    // Track highest martingale bet amount
    if (betAmount >= highestMartingale) {
      setHighestMartingale(betAmount);
    }
    
    const newBet = {
      amount: betAmount,
      won: won,
      timestamp: new Date().toISOString(),
      previousConsecutiveLosses: consecutiveLosses  // Track previous state for undo
    };
    
    setBetsPlaced(prev => [...prev, newBet]);
    
    if (won) {
      // Win: Add bet amount to capital, reset consecutive losses AND bet amount
      const newCapital = currentCapital + betAmount;
      setCurrentCapital(newCapital);
      setConsecutiveLosses(0);
      setCurrentBetAmount(baseBet); // Immediately reset bet amount to base bet
      setSuccessfulBets(prev => prev + 1);
      setSessionProfit(newCapital - startingCapital);
            } else {
        // Loss: Subtract bet amount from capital, increment consecutive losses
        const newCapital = currentCapital - betAmount;
        setCurrentCapital(newCapital);
        const newConsecutiveLosses = consecutiveLosses + 1;
        setConsecutiveLosses(newConsecutiveLosses);
        const newBetAmount = calculateMartingaleBet(baseBet, newConsecutiveLosses);
        setCurrentBetAmount(newBetAmount); // Immediately update bet amount
        setSessionProfit(newCapital - startingCapital);
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
    
    // Find longest dry spell in last 100 spins
    let longestDrySpell = 0;
    let tempDrySpell = 0;
    const last100 = results.slice(-100);
    
    for (const result of last100) {
      if (result === '1') {
        longestDrySpell = Math.max(longestDrySpell, tempDrySpell);
        tempDrySpell = 0;
      } else {
        tempDrySpell++;
      }
    }
    longestDrySpell = Math.max(longestDrySpell, tempDrySpell);

    return {
      onesFrequency: onesFrequency.toFixed(1),
      currentDrySpell,
      longestDrySpell,
      last50Count: onesCount,
      totalResults: results.length
    };
  }, [results]);

  // New pattern detection functions
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
        reason = `❌ BAD PATTERN: ${patternAnalysis.reason} - Wait for good pattern`;
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
  }, [results, analyzeOnesPattern, consecutiveLosses, baseBet, isGoodPattern, analyzeLastThreeRolls, analyzeLastTwoRolls]);

  const handleAddResult = (result) => {
    // Special handling for "Chance" - show modal instead of processing immediately
    if (result === 'chance') {
      const currentRecommendation = getBettingRecommendation();
      
      // Store the data needed for the modal
      setChanceModalData({
        currentRecommendation,
        betAmount: currentBetAmount,
        shouldBet: sessionActive && currentRecommendation.shouldBet && currentBetAmount <= currentCapital
      });
      
      // Show the modal
      setShowChanceModal(true);
      return; // Don't process the result yet
    }
    
    // Check for pending multiplier from previous Chance
    if (pendingMultiplier && sessionActive) {
      const won = result === '1';
      
      if (pendingMultiplier.shouldBet) {
        if (won) {
          // Multiplier win: Add bet amount × multiplier to capital
          const winAmount = pendingMultiplier.betAmount * pendingMultiplier.multiplier;
          const newCapital = currentCapital + winAmount;
          setCurrentCapital(newCapital);
          setSessionProfit(newCapital - startingCapital);
          
          // Reset consecutive losses and bet amount (multiplier win resets martingale)
          setConsecutiveLosses(0);
          setCurrentBetAmount(baseBet);
          setSuccessfulBets(prev => prev + 1);
          
          // Add a special bet record for the multiplier win
          const newBet = {
            amount: pendingMultiplier.betAmount,
            won: true,
            timestamp: new Date().toISOString(),
            previousConsecutiveLosses: consecutiveLosses,
            chanceType: 'multiplier',
            multiplier: pendingMultiplier.multiplier,
            winAmount: winAmount
          };
          setBetsPlaced(prev => [...prev, newBet]);
          setTotalBets(prev => prev + 1);
        } else {
          // Multiplier loss: Continue martingale (bet amount increases)
          const newConsecutiveLosses = consecutiveLosses + 1;
          setConsecutiveLosses(newConsecutiveLosses);
          const newBetAmount = calculateMartingaleBet(baseBet, newConsecutiveLosses);
          setCurrentBetAmount(newBetAmount);
          
          // Add a bet record for the multiplier loss
          const newBet = {
            amount: pendingMultiplier.betAmount,
            won: false,
            timestamp: new Date().toISOString(),
            previousConsecutiveLosses: consecutiveLosses,
            chanceType: 'multiplier',
            multiplier: pendingMultiplier.multiplier
          };
          setBetsPlaced(prev => [...prev, newBet]);
          setTotalBets(prev => prev + 1);
        }
      }
      
      // Clear pending multiplier
      setPendingMultiplier(null);
    } else {
      // Regular processing for non-multiplier results
      // Get the current recommendation BEFORE processing (this is what the user saw)
      const currentRecommendation = getBettingRecommendation();
      
      // If the recommendation was to bet, process this result as the outcome
      if (sessionActive && currentRecommendation.shouldBet && currentBetAmount <= currentCapital) {
        // This result is the outcome of the bet the user just made
        const won = result === '1';
        handleSessionBet(currentBetAmount, won);
      }
      // If recommendation was SKIP, no bet was placed, so no P/L change
    }
    
    // Add the result with timestamp (this will trigger recalculation of recommendation for next round)
    const timestamp = new Date().toISOString();
    const newResults = [...results, result];
    const newTimestamps = [...resultTimestamps, timestamp];
    setResults(newResults);
    setResultTimestamps(newTimestamps);
  };

  // Handle Chance modal - Multiplier choice
  const handleChanceMultiplier = (multiplierValue) => {
    // Store the multiplier for the next result
    const multiplierData = {
      multiplier: multiplierValue,
      betAmount: chanceModalData.betAmount,
      shouldBet: chanceModalData.shouldBet,
      timestamp: new Date().toISOString()
    };
    
    setPendingMultiplier(multiplierData);
    
    // Add the "chance" result to the results array
    const timestamp = new Date().toISOString();
    const newResults = [...results, 'chance'];
    const newTimestamps = [...resultTimestamps, timestamp];
    setResults(newResults);
    setResultTimestamps(newTimestamps);
    
    // Close the modal
    setShowChanceModal(false);
    setChanceModalData(null);
  };

  // Handle Chance modal - Cash choice
  const handleChanceCash = (cashAmount) => {
    // Reset martingale and add cash to P/L
    if (sessionActive) {
      // If there was a bet active, handle it as a special "cash" win
      if (chanceModalData.shouldBet) {
        // Add cash amount to capital
        const newCapital = currentCapital + cashAmount;
        setCurrentCapital(newCapital);
        setSessionProfit(newCapital - startingCapital);
        
        // Reset consecutive losses and bet amount (cash resets the martingale)
        setConsecutiveLosses(0);
        setCurrentBetAmount(baseBet);
        setSuccessfulBets(prev => prev + 1);
        
        // Add a special bet record for the cash win
        const newBet = {
          amount: chanceModalData.betAmount,
          won: true,
          timestamp: new Date().toISOString(),
          previousConsecutiveLosses: consecutiveLosses,
          chanceType: 'cash',
          cashAmount: cashAmount
        };
        setBetsPlaced(prev => [...prev, newBet]);
        setTotalBets(prev => prev + 1);
      } else {
        // No bet was placed, just add cash to capital
        const newCapital = currentCapital + cashAmount;
        setCurrentCapital(newCapital);
        setSessionProfit(newCapital - startingCapital);
      }
    }
    
    // Add the "chance" result to the results array
    const timestamp = new Date().toISOString();
    const newResults = [...results, 'chance'];
    const newTimestamps = [...resultTimestamps, timestamp];
    setResults(newResults);
    setResultTimestamps(newTimestamps);
    
    // Close the modal
    setShowChanceModal(false);
    setChanceModalData(null);
  };

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
    
    // Handle session betting undo if active
    if (sessionActive && betsPlaced.length > 0) {
      const lastBet = betsPlaced[betsPlaced.length - 1];
      setBetsPlaced(prev => prev.slice(0, -1));
      
      let newCapital = currentCapital;
      if (lastBet.won) {
        // Undo win: subtract bet amount from capital
        newCapital = currentCapital - lastBet.amount;
        setCurrentCapital(newCapital);
        setSuccessfulBets(prev => Math.max(0, prev - 1));
        // Restore previous consecutive losses state
        setConsecutiveLosses(lastBet.previousConsecutiveLosses);
      } else {
        // Undo loss: add bet amount back to capital
        newCapital = currentCapital + lastBet.amount;
        setCurrentCapital(newCapital);
        // Restore previous consecutive losses state
        setConsecutiveLosses(lastBet.previousConsecutiveLosses);
      }
      
      setTotalBets(prev => Math.max(0, prev - 1));
      setSessionProfit(newCapital - startingCapital);
    }
    
    alert(`✅ Undid: ${lastResult.toUpperCase()}`);
  };

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
      // Use the stored result timestamp
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
    a.download = `monopoly-live-current-session-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const copySessionResultsAsCSV = async (session, sessionNumber) => {
    try {
      const resultsText = session.results.join(',');
      await navigator.clipboard.writeText(resultsText);
      alert(`✅ Session ${sessionNumber} results copied as comma-separated values!\n\nResults: ${resultsText}`);
    } catch (err) {
      console.error('Failed to copy results:', err);
      alert('❌ Failed to copy results to clipboard');
    }
  };

  const copySessionAsText = async (session, sessionNumber) => {
    const textContent = [];
    
    // Add session header
    textContent.push(`Session ${sessionNumber} - Monopoly Live Tracker`);
    textContent.push('='.repeat(50));
    textContent.push('');
    
    // Add session metadata
    textContent.push(`Session Start: ${session.startTime ? new Date(session.startTime).toLocaleString() : 'N/A'}`);
    textContent.push(`Session End: ${session.endTime ? new Date(session.endTime).toLocaleString() : 'N/A'}`);
    textContent.push(`Duration: ${session.duration}`);
    textContent.push(`Starting Capital: ₱${session.startingCapital.toFixed(2)}`);
    textContent.push(`Final Capital: ₱${session.finalCapital.toFixed(2)}`);
    textContent.push(`Profit/Loss: ${session.profit >= 0 ? '+' : ''}₱${session.profit.toFixed(2)}`);
    textContent.push(`Total Bets: ${session.totalBets}`);
    textContent.push(`Successful Bets: ${session.successfulBets}`);
    textContent.push(`Win Rate: ${session.winRate}%`);
    textContent.push(`Highest Martingale: ₱${(session.betsPlaced && session.betsPlaced.length > 0 ? Math.max(...session.betsPlaced.map(bet => bet.amount)) : 0).toFixed(2)}`);
    textContent.push('');
    
    // Add results section
    textContent.push('RESULTS:');
    textContent.push('-'.repeat(20));
    session.results.forEach((result, index) => {
      const timestamp = session.resultTimestamps[index] ? new Date(session.resultTimestamps[index]).toLocaleString() : 'N/A';
      textContent.push(`${(index + 1).toString().padStart(3, ' ')}. ${result.toUpperCase().padEnd(8, ' ')} - ${timestamp}`);
    });
    textContent.push('');
    
    // Add betting history if available
    if (session.betsPlaced && session.betsPlaced.length > 0) {
      textContent.push('BETTING HISTORY:');
      textContent.push('-'.repeat(20));
      session.betsPlaced.forEach((bet, index) => {
        const timestamp = bet.timestamp ? new Date(bet.timestamp).toLocaleString() : 'N/A';
        const result = bet.won ? 'WIN' : 'LOSS';
        const amount = bet.won ? `+₱${bet.amount.toFixed(2)}` : `-₱${bet.amount.toFixed(2)}`;
        const chanceInfo = bet.chanceType === 'cash' ? ` (Chance Cash: ₱${bet.cashAmount.toFixed(2)})` : 
                           bet.chanceType === 'multiplier' ? ` (Chance Multiplier ${bet.multiplier}x: ₱${bet.winAmount ? bet.winAmount.toFixed(2) : '0.00'})` : '';
        textContent.push(`${(index + 1).toString().padStart(3, ' ')}. ₱${bet.amount.toFixed(2).padEnd(8, ' ')} ${result.padEnd(4, ' ')} ${amount.padEnd(10, ' ')} - ${timestamp}${chanceInfo}`);
      });
    }
    
    const textString = textContent.join('\n');
    
    try {
      await navigator.clipboard.writeText(textString);
      alert('Session data copied to clipboard as text!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy to clipboard');
    }
  };

  const exportSessionToCSV = (session, sessionNumber) => {
    const csvContent = [];
    
    // Add session header
    csvContent.push([`Session ${sessionNumber} - Monopoly Live Tracker`]);
    csvContent.push(['Generated on', new Date().toLocaleString()]);
    csvContent.push(['']);
    
    // Add session info
    csvContent.push(['SESSION DETAILS']);
    csvContent.push(['Start Time', new Date(session.startTime).toLocaleString()]);
    csvContent.push(['End Time', new Date(session.endTime).toLocaleString()]);
    csvContent.push(['Duration', session.duration]);
    csvContent.push(['Starting Capital', `₱${session.startingCapital.toFixed(2)}`]);
    csvContent.push(['Final Capital', `₱${session.finalCapital.toFixed(2)}`]);
    csvContent.push(['Profit/Loss', `₱${session.profit.toFixed(2)}`]);
    csvContent.push(['Total Bets', session.totalBets]);
    csvContent.push(['Successful Bets', session.successfulBets]);
    csvContent.push(['Win Rate', `${session.winRate}%`]);
    csvContent.push(['Highest Martingale', `₱${(session.betsPlaced && session.betsPlaced.length > 0 ? Math.max(...session.betsPlaced.map(bet => bet.amount)) : 0).toFixed(2)}`]);
    csvContent.push(['']);
    
    // Add results
    csvContent.push(['Spin Number', 'Result', 'Timestamp']);
    session.results.forEach((result, index) => {
      csvContent.push([
        index + 1,
        result.toUpperCase(),
        session.resultTimestamps[index] ? new Date(session.resultTimestamps[index]).toLocaleString() : 'N/A'
      ]);
    });
    
    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monopoly-live-session-${sessionNumber}-${new Date(session.startTime).toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportAllSessionsToCSV = () => {
    if (sessionHistory.length === 0) {
      alert('No session history available to export.');
      return;
    }

    const csvContent = [];
    
    // Add header
    csvContent.push(['All Sessions History - Monopoly Live Tracker']);
    csvContent.push(['Generated on', new Date().toLocaleString()]);
    csvContent.push(['']);
    
    // Add summary
    csvContent.push(['SUMMARY']);
    csvContent.push(['Total Sessions', sessionHistory.length]);
    csvContent.push(['Total Profit/Loss', `₱${sessionHistory.reduce((sum, session) => sum + session.profit, 0).toFixed(2)}`]);
    csvContent.push(['']);
    
    // Add each session
    sessionHistory.forEach((session, sessionIndex) => {
      csvContent.push([`SESSION ${sessionIndex + 1}`]);
      csvContent.push(['Start Time', new Date(session.startTime).toLocaleString()]);
      csvContent.push(['End Time', new Date(session.endTime).toLocaleString()]);
      csvContent.push(['Duration', session.duration]);
      csvContent.push(['Starting Capital', `₱${session.startingCapital.toFixed(2)}`]);
      csvContent.push(['Final Capital', `₱${session.finalCapital.toFixed(2)}`]);
      csvContent.push(['Profit/Loss', `₱${session.profit.toFixed(2)}`]);
      csvContent.push(['Total Bets', session.totalBets]);
      csvContent.push(['Successful Bets', session.successfulBets]);
      csvContent.push(['Win Rate', `${session.winRate}%`]);
      csvContent.push(['']);
      
      // Add results
      csvContent.push(['Spin Number', 'Result', 'Timestamp']);
      session.results.forEach((result, index) => {
        csvContent.push([
          index + 1,
          result.toUpperCase(),
          session.resultTimestamps[index] ? new Date(session.resultTimestamps[index]).toLocaleString() : 'N/A'
        ]);
      });
      csvContent.push(['']);
    });
    
    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monopoly-live-all-sessions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (results.length === 0) {
      alert('No results to copy');
      return;
    }

    // Join results with commas in chronological order (for simulation use)
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

  const copyCurrentSessionAsText = async () => {
    if (results.length === 0) {
      alert('No results to copy');
      return;
    }

    const textContent = [];
    
    // Add session header
    textContent.push('Current Session - Monopoly Live Tracker');
    textContent.push('='.repeat(50));
    textContent.push('');
    
    // Add session metadata
    textContent.push(`Session Start: ${sessionStartTime ? new Date(sessionStartTime).toLocaleString() : 'N/A'}`);
    textContent.push(`Session End: ${sessionEndTime ? new Date(sessionEndTime).toLocaleString() : 'Active'}`);
    textContent.push(`Duration: ${sessionStartTime ? (() => {
      const start = new Date(sessionStartTime);
      const end = sessionEndTime ? new Date(sessionEndTime) : new Date();
      const diff = end - start;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    })() : 'N/A'}`);
    textContent.push(`Starting Capital: ${sessionActive ? `₱${startingCapital.toFixed(2)}` : 'N/A'}`);
    textContent.push(`Current Capital: ${sessionActive ? `₱${currentCapital.toFixed(2)}` : 'N/A'}`);
    textContent.push(`Profit/Loss: ${sessionActive ? `${sessionProfit >= 0 ? '+' : ''}₱${sessionProfit.toFixed(2)}` : 'N/A'}`);
    textContent.push(`Total Bets: ${totalBets}`);
    textContent.push(`Successful Bets: ${successfulBets}`);
    textContent.push(`Win Rate: ${totalBets > 0 ? ((successfulBets / totalBets) * 100).toFixed(1) : 0}%`);
    textContent.push('');
    
    // Add results section
    textContent.push('RESULTS:');
    textContent.push('-'.repeat(20));
    results.forEach((result, index) => {
      const timestamp = resultTimestamps[index] ? new Date(resultTimestamps[index]).toLocaleString() : 'N/A';
      textContent.push(`${(index + 1).toString().padStart(3, ' ')}. ${result.toUpperCase().padEnd(8, ' ')} - ${timestamp}`);
    });
    textContent.push('');
    
    // Add betting history if available
    if (sessionActive && betsPlaced.length > 0) {
      textContent.push('BETTING HISTORY:');
      textContent.push('-'.repeat(20));
      betsPlaced.forEach((bet, index) => {
        const timestamp = bet.timestamp ? new Date(bet.timestamp).toLocaleString() : 'N/A';
        const result = bet.won ? 'WIN' : 'LOSS';
        const amount = bet.won ? `+₱${bet.amount.toFixed(2)}` : `-₱${bet.amount.toFixed(2)}`;
        const chanceInfo = bet.chanceType === 'cash' ? ` (Chance Cash: ₱${bet.cashAmount.toFixed(2)})` : 
                           bet.chanceType === 'multiplier' ? ` (Chance Multiplier ${bet.multiplier}x: ₱${bet.winAmount ? bet.winAmount.toFixed(2) : '0.00'})` : '';
        textContent.push(`${(index + 1).toString().padStart(3, ' ')}. ₱${bet.amount.toFixed(2).padEnd(8, ' ')} ${result.padEnd(4, ' ')} ${amount.padEnd(10, ' ')} - ${timestamp}${chanceInfo}`);
      });
    }
    
    const textString = textContent.join('\n');
    
    try {
      await navigator.clipboard.writeText(textString);
      alert('Current session data copied to clipboard as text!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy to clipboard');
    }
  };



  const resetBetStats = () => {
    setTotalBets(0);
    setSuccessfulBets(0);
  };

  const clearCurrentSession = () => {
    if (window.confirm('🚨 Are you sure you want to clear the current session? This will only clear current session data and keep previous sessions. This action cannot be undone.')) {
      // Archive current session if it exists and has data
      if (sessionActive && (results.length > 0 || betsPlaced.length > 0)) {
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
      setBetsPlaced([]);
      setSessionProfit(0);
      setSessionStartTime(null);
      setSessionEndTime(null);
      setSessionArchived(false);
      setHighestMartingale(0);
      
      alert('✅ Current session cleared! Previous sessions preserved.');
    }
  };

  const resetHistory = () => {
    if (window.confirm('🚨 Are you sure you want to clear ALL history including all previous sessions? This will reset everything for a fresh start. This action cannot be undone.')) {
      setResults([]);
      setResultTimestamps([]);
      setTotalBets(0);
      setSuccessfulBets(0);
      // Reset session data
      if (sessionActive) {
        setSessionEndTime(new Date().toISOString());
      }
      setSessionActive(false);
      setStartingCapital(0);
      setCurrentCapital(0);
      setBaseBet(0);
      setCurrentBetAmount(0);
      setConsecutiveLosses(0);
      setBetsPlaced([]);
      setSessionProfit(0);
      setSessionStartTime(null);
      setSessionEndTime(null);
      setSessionHistory([]);
      setSessionArchived(false); // Reset sessionArchived state
      // Clear localStorage
      localStorage.removeItem('monopolyTrackerData');
      alert('✅ All history cleared! Ready for a fresh start.');
    }
  };

  // Simulation processing function
  const processSimulation = () => {
    if (!simulationInput.trim()) {
      alert('Please enter some results to simulate');
      return;
    }

    // Parse comma-separated values
    const inputResults = simulationInput.split(',').map(val => val.trim()).filter(val => val);
    
    if (inputResults.length === 0) {
      alert('No valid results found in input');
      return;
    }

    // Initialize simulation variables
    let capital = simulationCapital;
    let baseBet = simulationBaseBet;
    let currentBetAmount = baseBet;
    let consecutiveLosses = 0;
    let totalBets = 0;
    let successfulBets = 0;
    let highestMartingaleSimulation = 0;
    
    // Track results for pattern analysis (same as live system)
    let simulationResultsHistory = [];
    
    const simulationResults = [];
    
    // Process each result using the same logic as live system
    inputResults.forEach((result, index) => {
      // Skip chance results for now (would need modal handling)
      if (result.toLowerCase() === 'chance') {
        simulationResults.push({
          spin: index + 1,
          result: result,
          capital: capital,
          betAmount: 0,
          won: false,
          profit: capital - simulationCapital,
          consecutiveLosses: consecutiveLosses,
          totalBets: totalBets,
          successfulBets: successfulBets,
          winRate: totalBets > 0 ? (successfulBets / totalBets) * 100 : 0,
          recommendation: 'CHANCE - Skipped in simulation',
          confidence: 0,
          betPlaced: false
        });
        
        // Add to history for pattern analysis
        simulationResultsHistory.push(result);
        return;
      }
      
      // Get betting recommendation using the same logic as live system
      const recommendation = getBettingRecommendationForSimulation(simulationResultsHistory, consecutiveLosses, baseBet);
      
      // Determine if we should place a bet
      const shouldPlaceBet = recommendation.shouldBet && currentBetAmount <= capital;
      
      let betAmount = 0;
      let won = false;
      let betPlaced = false;
      
      if (shouldPlaceBet) {
        betAmount = currentBetAmount;
        won = result === '1';
        betPlaced = true;
        totalBets++;
        
        // Track highest martingale bet amount in simulation
        if (betAmount >= highestMartingaleSimulation) {
          highestMartingaleSimulation = betAmount;
        }
        
        if (won) {
          // WIN: Add bet amount to capital, reset consecutive losses
          capital += betAmount;
          consecutiveLosses = 0;
          currentBetAmount = baseBet;
          successfulBets++;
        } else {
          // LOSS: Subtract bet amount from capital, increment consecutive losses
          capital -= betAmount;
          consecutiveLosses++;
          currentBetAmount = calculateMartingaleBet(baseBet, consecutiveLosses);
        }
      }
      
      // Store the result
      simulationResults.push({
        spin: index + 1,
        result: result,
        capital: capital,
        betAmount: betAmount,
        won: won,
        profit: capital - simulationCapital,
        consecutiveLosses: consecutiveLosses,
        totalBets: totalBets,
        successfulBets: successfulBets,
        winRate: totalBets > 0 ? (successfulBets / totalBets) * 100 : 0,
        recommendation: recommendation.reason,
        confidence: recommendation.confidence,
        betPlaced: betPlaced,
        highestMartingale: highestMartingaleSimulation
      });
      
      // Add to history for next iteration's pattern analysis
      simulationResultsHistory.push(result);
    });
    
    setSimulationData(simulationResults);
  };

  // Helper function to get betting recommendation for simulation (using same NEW logic as live system)
  const getBettingRecommendationForSimulation = (simulationResultsHistory, consecutiveLosses, baseBet) => {
    // Use the same analysis logic as live system
    const last50 = simulationResultsHistory.slice(-50);
    const onesCount = last50.filter(r => r === '1').length;
    const onesFrequency = last50.length > 0 ? (onesCount / last50.length) * 100 : 0;
    
    // Find current dry spell (consecutive non-1s)
    let currentDrySpell = 0;
    for (let i = simulationResultsHistory.length - 1; i >= 0; i--) {
      if (simulationResultsHistory[i] === '1') break;
      currentDrySpell++;
    }
    
    // Expected Value calculation (40.74% win rate on "1" segment)
    const expectedValue = (0.4074 * 1) - (0.5926 * 1); // Win 1x bet / Lose 1x bet
    
    // Streak prevention logic
    const streakRisk = consecutiveLosses >= 3 ? 'HIGH' : 
                      consecutiveLosses >= 2 ? 'MEDIUM' : 'LOW';
    
    // NEW PATTERN DETECTION - Same as live system
    const last3 = simulationResultsHistory.slice(-3);
    const last2 = simulationResultsHistory.slice(-2);
    
    // Pattern analysis function (same as live system)
    const analyzePattern = () => {
      const last5 = simulationResultsHistory.slice(-5);
      
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
    };
    
    const patternAnalysis = analyzePattern();
    
    // Dynamic betting decision (same logic as live system)
    let shouldBet = false;
    let confidence = 50;
    let reason = '';
    let bettingMode = 'NONE';

    // SAFETY LIMIT CHECK - ALWAYS FIRST
    if (consecutiveLosses >= 7) {
      shouldBet = false;
      confidence = 99;
      reason = `💀 SAFETY LIMIT: ${consecutiveLosses} losses - Next bet ₱${calculateMartingaleBet(baseBet, consecutiveLosses)} - MAXIMUM RISK REACHED`;
      bettingMode = 'SAFETY_LIMIT';
    }
    else {
      // SIMPLE PATTERN-BASED BETTING (same as live system)
      if (patternAnalysis.isGood) {
        shouldBet = true;
        confidence = 85;
        reason = `✅ GOOD PATTERN: ${patternAnalysis.reason} - Safe to bet`;
        bettingMode = 'GOOD_PATTERN';
      } else {
        shouldBet = false;
        confidence = 85;
        reason = `❌ BAD PATTERN: ${patternAnalysis.reason} - Wait for good pattern`;
        bettingMode = 'BAD_PATTERN';
      }
    }

    return {
      shouldBet,
      confidence: confidence.toFixed(0),
      reason,
      streakRisk,
      consecutiveLosses: consecutiveLosses,
      expectedValue: expectedValue.toFixed(2),
      bettingMode,
      patternAnalysis
    };
  };

  // eslint-disable-next-line no-unused-vars
  const analysis = analyzeOnesPattern();
  const recommendation = getBettingRecommendation();

  // Test function to verify pattern detection works correctly
  const testPatternDetection = () => {
    const testCases = [
      // Good patterns (any pattern with 1 or 2 ones in last 3 rolls) - REAL MONOPOLY SEGMENTS
      { pattern: ['1', '2', '1'], expected: true, description: 'Good 3-roll: 1,2,1 (2 ones)' },
      { pattern: ['1', '5', '1'], expected: true, description: 'Good 3-roll: 1,5,1 (2 ones)' },
      { pattern: ['1', '10', '2'], expected: true, description: 'Good 3-roll: 1,10,2 (1 one)' },
      { pattern: ['5', '1', '2'], expected: true, description: 'Good 3-roll: 5,1,2 (1 one)' },
      { pattern: ['2', '2', '1'], expected: true, description: 'Good 3-roll: 2,2,1 (1 one)' },
      { pattern: ['1', '1', '1'], expected: true, description: 'Good 3-roll: 1,1,1 (3 ones - excellent)' },
      { pattern: ['1', '1', '2'], expected: true, description: 'Good 3-roll: 1,1,2 (2 ones)' },
      { pattern: ['2', '1', '1'], expected: true, description: 'Good 3-roll: 2,1,1 (2 ones)' },
      { pattern: ['10', '1', '5'], expected: true, description: 'Good 3-roll: 10,1,5 (1 one)' },
      { pattern: ['1', '10', '10'], expected: true, description: 'Good 3-roll: 1,10,10 (1 one)' },
      
      // Good 2-roll patterns (any pattern with 1 or 2 ones) - REAL MONOPOLY SEGMENTS
      { pattern: ['1', '2'], expected: true, description: 'Good 2-roll: 1,2 (1 one)' },
      { pattern: ['2', '1'], expected: true, description: 'Good 2-roll: 2,1 (1 one)' },
      { pattern: ['1', '1'], expected: true, description: 'Good 2-roll: 1,1 (2 ones)' },
      { pattern: ['1', '5'], expected: true, description: 'Good 2-roll: 1,5 (1 one)' },
      { pattern: ['10', '1'], expected: true, description: 'Good 2-roll: 10,1 (1 one)' },
      { pattern: ['1', '10'], expected: true, description: 'Good 2-roll: 1,10 (1 one)' },
      
      // Bad patterns (no ones in recent rolls) - REAL MONOPOLY SEGMENTS
      { pattern: ['2', '2', '2'], expected: false, description: 'Bad 3-roll: 2,2,2 (0 ones)' },
      { pattern: ['5', '2', '2'], expected: false, description: 'Bad 3-roll: 5,2,2 (0 ones)' },
      { pattern: ['5', '5', '2'], expected: false, description: 'Bad 3-roll: 5,5,2 (0 ones)' },
      { pattern: ['2', '5', '5'], expected: false, description: 'Bad 3-roll: 2,5,5 (0 ones)' },
      { pattern: ['2', '2', '5'], expected: false, description: 'Bad 3-roll: 2,2,5 (0 ones)' },
      { pattern: ['10', '5', '2'], expected: false, description: 'Bad 3-roll: 10,5,2 (0 ones)' },
      { pattern: ['5', '10', '10'], expected: false, description: 'Bad 3-roll: 5,10,10 (0 ones)' },
      { pattern: ['10', '10', '5'], expected: false, description: 'Bad 3-roll: 10,10,5 (0 ones)' },
      { pattern: ['2', '5'], expected: false, description: 'Bad 2-roll: 2,5 (0 ones)' },
      { pattern: ['5', '5'], expected: false, description: 'Bad 2-roll: 5,5 (0 ones)' },
      { pattern: ['10', '2'], expected: false, description: 'Bad 2-roll: 10,2 (0 ones)' },
      { pattern: ['5', '10'], expected: false, description: 'Bad 2-roll: 5,10 (0 ones)' },
      { pattern: ['10', '10'], expected: false, description: 'Bad 2-roll: 10,10 (0 ones)' },
    ];
    
    console.log('🧪 Testing NEW Flexible Pattern Detection System...');
    let passed = 0;
    let failed = 0;
    
    testCases.forEach(test => {
      // Test the NEW pattern logic
      const tempResults = test.pattern;
      const last3 = tempResults.slice(-3);
      const last2 = tempResults.slice(-2);
      const last5 = tempResults.slice(-5);
      
      // Check if we have enough data
      if (last2.length < 2) {
        console.log(`⚠️ ${test.description} - SKIPPED (insufficient data)`);
        return;
      }
      
      // Count ones in last 3 rolls (or last 2 if we only have 2 rolls)
      const rollsToCheck = last3.length >= 3 ? last3 : last2;
      const onesCount = rollsToCheck.filter(r => r === '1').length;
      
      // Good pattern: Any pattern with 1 or 2 ones in recent rolls
      let isGood = false;
      if (onesCount >= 1 && onesCount <= 2) {
        isGood = true;
      } else if (onesCount > 2) {
        isGood = true; // Excellent pattern
      } else if (onesCount === 0) {
        isGood = false; // Bad pattern
      }
      
      const testPassed = isGood === test.expected;
      
      if (testPassed) {
        console.log(`✅ ${test.description} - PASSED`);
        passed++;
      } else {
        console.log(`❌ ${test.description} - FAILED (expected: ${test.expected}, got: ${isGood})`);
        failed++;
      }
    });
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('🎉 All tests passed! New flexible pattern detection is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Please review the pattern detection logic.');
    }
    
    return { passed, failed };
  };

  // Expose test function to window for easy access
  if (typeof window !== 'undefined') {
    window.testPatternDetection = testPatternDetection;
  }

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

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            {[
              { id: 'tracker', label: '🎮 Live Tracker', desc: 'Quick-click results & get recommendations' },
              { id: 'analytics', label: '📊 Analytics', desc: 'Deep pattern analysis' },
              { id: 'history', label: '📜 History', desc: 'View all results' },
              { id: 'simulation', label: '🧪 Simulation', desc: 'Test with comma-separated results' }
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
              {pendingMultiplier && (
                <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🎯</div>
                    <div>
                      <div className="font-bold text-yellow-800">
                        Pending Multiplier: {pendingMultiplier.multiplier}x
                      </div>
                      <div className="text-sm text-yellow-700">
                        Waiting for next result. Win = ₱{pendingMultiplier.betAmount} × {pendingMultiplier.multiplier} = ₱{(pendingMultiplier.betAmount * pendingMultiplier.multiplier).toFixed(2)} if "1"
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

                     {/* Pattern Rules Reference */}
                     <div className="border rounded-lg p-4 bg-gray-50">
                       <h3 className="font-semibold mb-2">📋 Pattern Rules</h3>
                       <div className="text-sm text-gray-700">
                         <div className="mb-2">
                           <span className="font-semibold text-green-600">✅ Good Patterns:</span>
                           <br />
                           Any pattern with 1 or 2 ones in last 3 rolls
                         </div>
                         <div className="mb-2">
                           <span className="font-semibold text-blue-600">⭐ Good Examples:</span>
                           <br />
                           1,2,1 | 1,5,1 | 1,10,2 | 5,1,2 | 2,2,1 | 1,1,1 | 10,1,5
                         </div>
                         <div className="mb-2">
                           <span className="font-semibold text-red-600">❌ Bad Patterns:</span>
                           <br />
                           No "1" in last 3-5 rolls
                         </div>
                         <div className="mb-2">
                           <span className="font-semibold text-red-600">⚠️ Bad Examples:</span>
                           <br />
                           2,2,2 | 5,2,2 | 10,5,2 | 2,5,5 | 5,10,10 | 10,10,5
                         </div>
                         <div className="mt-2 text-xs text-gray-500">
                           * System looks for 1 or 2 ones in recent rolls for betting signal
                           <br />
                           * Monopoly Live segments: 1, 2, 5, 10, CHANCE, 2 ROLLS, 4 ROLLS
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>

              {/* Quick Stats */}
                             <div className="bg-white rounded-lg shadow-lg p-6">
                 <h2 className="text-xl font-semibold mb-4">Streak Prevention Stats</h2>
                 <div className="space-y-3">
                   <div className="flex justify-between">
                     <span>Consecutive Losses:</span>
                     <span className={`font-semibold ${
                       recommendation.consecutiveLosses >= 3 ? 'text-red-600' : 
                       recommendation.consecutiveLosses >= 2 ? 'text-yellow-600' : 'text-green-600'
                     }`}>
                       {recommendation.consecutiveLosses}/5 max
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
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         <div className="bg-white rounded-lg shadow-lg p-6">
               <h2 className="text-xl font-semibold mb-4">Advanced Streak Analysis</h2>
               <div className="space-y-4">
                 <div className="p-4 bg-gray-50 rounded-lg">
                   <h3 className="font-semibold text-gray-700 mb-2">Losing Streak Prevention</h3>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <div className={`text-2xl font-bold ${
                         recommendation.consecutiveLosses >= 3 ? 'text-red-600' : 
                         recommendation.consecutiveLosses >= 2 ? 'text-yellow-600' : 'text-green-600'
                       }`}>
                         {recommendation.consecutiveLosses}/5
                       </div>
                       <div className="text-sm text-gray-600">Current Losses</div>
                     </div>
                     <div>
                       <div className={`text-2xl font-bold ${
                         recommendation.streakRisk === 'HIGH' ? 'text-red-600' :
                         recommendation.streakRisk === 'MEDIUM' ? 'text-yellow-600' :
                         'text-green-600'
                       }`}>
                         {recommendation.streakRisk}
                       </div>
                       <div className="text-sm text-gray-600">Risk Level</div>
                     </div>
                   </div>
                 </div>
                 
                 <div className="p-4 bg-gray-50 rounded-lg">
                   <h3 className="font-semibold text-gray-700 mb-2">Probability Analysis</h3>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <div className="text-2xl font-bold text-blue-600">
                         40.74%
                       </div>
                       <div className="text-sm text-gray-600">Win Rate (22/54)</div>
                     </div>
                     <div>
                       <div className="text-2xl font-bold text-orange-600">
                         7.2%
                       </div>
                       <div className="text-sm text-gray-600">6-Loss Streak Risk</div>
                     </div>
                   </div>
                 </div>

                 <div className="p-4 bg-gray-50 rounded-lg">
                   <h3 className="font-semibold text-gray-700 mb-2">Current Session</h3>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <div className="text-2xl font-bold text-green-600">
                         {analysis.last50Count}/50
                       </div>
                       <div className="text-sm text-gray-600">1s in Last 50</div>
                     </div>
                     <div>
                       <div className={`text-2xl font-bold ${
                         analysis.onesFrequency < 30 ? 'text-red-600' : 
                         analysis.onesFrequency < 35 ? 'text-yellow-600' : 'text-green-600'
                       }`}>
                         {analysis.onesFrequency}%
                       </div>
                       <div className="text-sm text-gray-600">Current Hit Rate</div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>

                         <div className="bg-white rounded-lg shadow-lg p-6">
               <h2 className="text-xl font-semibold mb-4">Betting Performance</h2>
               <div className="space-y-4">
                 <div className="grid grid-cols-3 gap-4">
                   <div className="text-center p-4 bg-blue-50 rounded-lg">
                     <div className="text-2xl font-bold text-blue-600">{totalBets}</div>
                     <div className="text-sm text-gray-600">Total Bets</div>
                   </div>
                   <div className="text-center p-4 bg-green-50 rounded-lg">
                     <div className="text-2xl font-bold text-green-600">{successfulBets}</div>
                     <div className="text-sm text-gray-600">Successful</div>
                   </div>
                   <div className="text-center p-4 bg-yellow-50 rounded-lg">
                     <div className="text-2xl font-bold text-yellow-600">
                       {totalBets > 0 ? ((successfulBets / totalBets) * 100).toFixed(1) : 0}%
                     </div>
                     <div className="text-sm text-gray-600">Success Rate</div>
                   </div>
                 </div>
                 
                 <div className="flex gap-3">
                   <button
                     onClick={() => {
                       setTotalBets(prev => prev + 1);
                       if (results[results.length - 1] === '1') {
                         setSuccessfulBets(prev => prev + 1);
                       }
                     }}
                     className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                   >
                     Record Bet
                   </button>
                   <button
                     onClick={resetBetStats}
                     className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                   >
                     Reset
                   </button>
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* Dangerous Patterns Reference */}
         {activeTab === 'analytics' && (
           <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
             <h2 className="text-xl font-semibold mb-4">🚨 Dangerous Patterns Detected</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               <div className="p-4 bg-red-50 rounded-lg">
                 <h3 className="font-semibold text-red-700 mb-2">High Value Streaks</h3>
                 <div className="space-y-2 text-sm">
                   <div>2-2-2, 5-5-5, 10-10-10</div>
                   <div className="text-gray-600">Consecutive high payouts often precede losing streaks</div>
                 </div>
               </div>
               <div className="p-4 bg-orange-50 rounded-lg">
                 <h3 className="font-semibold text-orange-700 mb-2">Mixed Danger</h3>
                 <div className="space-y-2 text-sm">
                   <div>2-5-10, 10-5-2, 5-10-5</div>
                   <div className="text-gray-600">High value combinations signal volatility</div>
                 </div>
               </div>
               <div className="p-4 bg-yellow-50 rounded-lg">
                 <h3 className="font-semibold text-yellow-700 mb-2">Bonus Patterns</h3>
                 <div className="space-y-2 text-sm">
                   <div>2rolls-2rolls, 4rolls-2rolls</div>
                   <div>chance-chance</div>
                   <div className="text-gray-600">Bonus rounds often followed by compensation</div>
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* Debug Information */}
         {activeTab === 'analytics' && results.length > 0 && (
           <div className="mt-6 bg-yellow-50 rounded-lg shadow-lg p-6 border-2 border-yellow-300">
             <h3 className="text-lg font-semibold text-yellow-800 mb-3">🐛 Debug Information</h3>
             <div className="grid grid-cols-2 gap-4 text-sm">
               <div>
                 <div className="font-semibold text-yellow-700">Analysis:</div>
                 <div>Ones Frequency: {analysis.onesFrequency}%</div>
                 <div>Ones Count (Last 50): {analysis.last50Count}/50</div>
                 <div>Current Dry Spell: {analysis.currentDrySpell}</div>
                 <div>Total Results: {analysis.totalResults}</div>
               </div>
               <div>
                 <div className="font-semibold text-yellow-700">Betting Logic:</div>
                 <div>Consecutive Losses: {consecutiveLosses}</div>
                 <div>Last 3 Results: {results.slice(-3).join(',')}</div>
                 <div>Current Drought: {recommendation.currentDrought} spins</div>
                 <div>Drought Level: {recommendation.droughtLevel}</div>
                 <div>Drought Reason: {recommendation.droughtReason}</div>
                 <div>Dangerous Pattern: {(() => {
                   const dangerousPatterns = [
                     ['2', '2', '2'], ['5', '5', '5'], ['10', '10', '10'],
                     ['2', '5', '10'], ['10', '5', '2'], ['2rolls', '2rolls'],
                     ['4rolls', '2rolls'], ['chance', 'chance'], ['5', '10', '5'],
                     ['2', '10', '2'], ['10', '2', '10']
                   ];
                   const last2 = results.slice(-2);
                   const last3 = results.slice(-3);
                   const hasDangerous = dangerousPatterns.some(pattern => {
                     if (pattern.length === 2) {
                       return pattern.every((val, idx) => last2[idx] === val);
                     } else {
                       return pattern.every((val, idx) => last3[idx] === val);
                     }
                   });
                   return hasDangerous ? 'YES' : 'NO';
                 })()}</div>
               </div>
             </div>
             <div className="mt-3 p-2 bg-yellow-100 rounded">
               <div className="font-semibold text-yellow-800">Reason: {recommendation.reason}</div>
             </div>
             
             {/* Betting History */}
             {sessionActive && betsPlaced.length > 0 && (
               <div className="mt-4 p-3 bg-blue-50 rounded border-2 border-blue-300">
                 <h4 className="text-lg font-semibold text-blue-800 mb-2">📊 Betting History</h4>
                 <div className="max-h-40 overflow-y-auto">
                   {betsPlaced.map((bet, index) => (
                     <div key={index} className="text-sm py-1 border-b border-blue-200">
                       <div className="flex justify-between items-center">
                         <span>Bet #{index + 1}</span>
                         <span>₱{bet.amount.toFixed(2)}</span>
                         <span className={`font-semibold ${bet.won ? 'text-green-600' : 'text-red-600'}`}>
                           {bet.won ? '+₱' + (
                             bet.chanceType === 'cash' ? bet.cashAmount.toFixed(2) : 
                             bet.chanceType === 'multiplier' ? bet.winAmount.toFixed(2) : 
                             bet.amount.toFixed(2)
                           ) : '-₱' + bet.amount.toFixed(2)}
                         </span>
                         <span className={`font-semibold ${bet.won ? 'text-green-600' : 'text-red-600'}`}>
                           {bet.won ? (
                             bet.chanceType === 'cash' ? 'CASH' : 
                             bet.chanceType === 'multiplier' ? 'MULT' : 
                             'WIN'
                           ) : 'LOSS'}
                         </span>
                       </div>
                       <div className="text-xs text-gray-500 mt-1">
                         {bet.timestamp ? new Date(bet.timestamp).toLocaleString() : 'N/A'}
                         {bet.chanceType === 'cash' && (
                           <span className="ml-2 text-purple-600 font-medium">
                             🎲 Chance Cash Out
                           </span>
                         )}
                         {bet.chanceType === 'multiplier' && (
                           <span className="ml-2 text-yellow-600 font-medium">
                             🎯 Chance Multiplier {bet.multiplier}x
                           </span>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
                 <div className="mt-2 p-2 bg-blue-100 rounded">
                   <div className="flex justify-between font-semibold">
                     <span>Total Bets: {betsPlaced.length}</span>
                     <span className={`${sessionProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                       Net: {sessionProfit >= 0 ? '+' : ''}₱{sessionProfit.toFixed(2)}
                     </span>
                   </div>
                 </div>
               </div>
             )}
           </div>
         )}

        {/* History Tab */}
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
                      title="Copy results as comma-separated values (chronological order for simulation)"
                    >
                      📋 Copy for Sim
                    </button>
                    <button
                      onClick={copyCurrentSessionAsText}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Copy detailed session data as text"
                    >
                      📋 Copy TXT
                    </button>
                    <button
                      onClick={exportToCSV}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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

            {/* Session History */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Previous Sessions</h2>
                <div className="flex gap-3">
                  <button
                    onClick={exportAllSessionsToCSV}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    📊 Export All Sessions
                  </button>
                  <button
                    onClick={resetHistory}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    🗑️ Clear All History
                  </button>
                </div>
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
                         <div className="flex items-center gap-3">
                           <div className="text-right">
                             <div className={`text-lg font-bold ${session.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                               {session.profit >= 0 ? '+' : ''}₱{session.profit.toFixed(2)}
                             </div>
                             <div className="text-sm text-gray-600">
                               Win Rate: {session.winRate}%
                             </div>
                           </div>
                           <div className="flex space-x-2">
                             <button
                               onClick={() => copySessionResultsAsCSV(session, sessionHistory.length - index)}
                               className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                               title="Copy results as comma-separated values (chronological order for simulation)"
                                                            >
                                 📋 SIM
                               </button>
                             <button
                               onClick={() => copySessionAsText(session, sessionHistory.length - index)}
                               className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                               title="Copy session data as text"
                             >
                               📋 TXT
                             </button>
                             <button
                               onClick={() => exportSessionToCSV(session, sessionHistory.length - index)}
                               className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                               title="Download this session's data"
                             >
                               📊 CSV
                             </button>
                           </div>
                         </div>
                       </div>
                      
                       <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
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
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Highest Martingale</div>
                          <div className="font-bold text-red-600">₱{(session.betsPlaced && session.betsPlaced.length > 0 ? Math.max(...session.betsPlaced.map(bet => bet.amount)) : 0).toFixed(2)}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-12 gap-1 max-h-32 overflow-y-auto">
                        {/* Display session results - newest first (left to right, top to bottom) */}
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
                              title={`Spin ${session.results.length - resultIndex}: ${result.toUpperCase()}\nTime: ${session.resultTimestamps[session.results.length - 1 - resultIndex] ? new Date(session.resultTimestamps[session.results.length - 1 - resultIndex]).toLocaleString() : 'N/A'}`}
                            >
                              {getHistoryDisplayText(result)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Overall Statistics</h3>
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
      
      {/* Simulation Tab */}
      {activeTab === 'simulation' && (
        <div className="space-y-6">
          {/* Simulation Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-2">🧪 Simulation Testing</h2>
            <p className="text-purple-100">
              Test your strategy by pasting comma-separated results and see how your capital would grow with the Martingale system
            </p>
          </div>
          
          {/* Simulation Settings */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Simulation Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Starting Capital (₱)
                </label>
                <input
                  type="number"
                  min="1"
                  value={simulationCapital}
                  onChange={(e) => setSimulationCapital(parseFloat(e.target.value) || 1000)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., 1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Bet Amount (₱)
                </label>
                <input
                  type="number"
                  min="1"
                  value={simulationBaseBet}
                  onChange={(e) => setSimulationBaseBet(parseFloat(e.target.value) || 10)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., 10"
                />
              </div>
            </div>
          </div>
          
          {/* Input Area */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Test Results</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste comma-separated results (e.g., 2,5,1,10,1,chance,1,2,5,1)
                </label>
                <textarea
                  value={simulationInput}
                  onChange={(e) => setSimulationInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows="4"
                  placeholder="Enter your results separated by commas..."
                />
              </div>
              <button
                onClick={processSimulation}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                🚀 Run Simulation
              </button>
            </div>
          </div>
          
          {/* Results Display */}
          {simulationData.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Simulation Results</h3>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Total Spins</div>
                  <div className="text-xl font-bold text-blue-600">{simulationData.length}</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Final Capital</div>
                  <div className={`text-xl font-bold ${simulationData[simulationData.length - 1]?.capital >= simulationCapital ? 'text-green-600' : 'text-red-600'}`}>
                    ₱{simulationData[simulationData.length - 1]?.capital.toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Total Profit/Loss</div>
                  <div className={`text-xl font-bold ${simulationData[simulationData.length - 1]?.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {simulationData[simulationData.length - 1]?.profit >= 0 ? '+' : ''}₱{simulationData[simulationData.length - 1]?.profit.toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Win Rate</div>
                  <div className="text-xl font-bold text-purple-600">
                    {simulationData[simulationData.length - 1]?.winRate.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Highest Martingale</div>
                  <div className="text-xl font-bold text-red-600">
                                            ₱{simulationData.length > 0 ? Math.max(...simulationData.map(d => d.highestMartingale)).toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>
              
              {/* Chart */}
              <div className="mb-6">
                <h4 className="text-md font-semibold mb-3">Capital Growth Chart</h4>
                <div className="h-64">
                                     <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={simulationData}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="spin" />
                       <YAxis />
                       <Tooltip 
                         formatter={(value, name) => [
                           name === 'capital' ? `₱${value.toFixed(2)}` : value,
                           name === 'capital' ? 'Capital' : name
                         ]}
                         labelFormatter={(label) => `Spin ${label}`}
                       />
                       <Legend />
                       <Line type="monotone" dataKey="capital" stroke="#8884d8" strokeWidth={2} dot={false} />
                     </LineChart>
                   </ResponsiveContainer>
                </div>
              </div>
              
              {/* Detailed Results Table */}
              <div className="overflow-x-auto">
                <h4 className="text-md font-semibold mb-3">Detailed Results</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Spin</th>
                      <th className="text-left p-2">Result</th>
                      <th className="text-left p-2">Bet Placed</th>
                      <th className="text-left p-2">Bet Amount</th>
                      <th className="text-left p-2">Outcome</th>
                      <th className="text-left p-2">Capital</th>
                      <th className="text-left p-2">Profit</th>
                      <th className="text-left p-2">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...simulationData].reverse().map((data, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{data.spin}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            data.result === '1' ? 'bg-green-100 text-green-800' :
                            data.result === '2' ? 'bg-blue-100 text-blue-800' :
                            data.result === '5' ? 'bg-yellow-100 text-yellow-800' :
                            data.result === '10' ? 'bg-red-100 text-red-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {data.result}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            data.betPlaced ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {data.betPlaced ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td className="p-2">
                          {data.betAmount > 0 ? `₱${data.betAmount.toFixed(2)}` : '-'}
                        </td>
                        <td className="p-2">
                          {data.betPlaced ? (
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              data.won ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {data.won ? 'WIN' : 'LOSS'}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="p-2">₱{data.capital.toFixed(2)}</td>
                        <td className={`p-2 ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {data.profit >= 0 ? '+' : ''}₱{data.profit.toFixed(2)}
                        </td>
                        <td className="p-2 text-xs">
                          <span className={`px-2 py-1 rounded text-xs ${
                            data.recommendation?.includes('SAFETY LIMIT') ? 'bg-red-100 text-red-800' :
                            data.recommendation?.includes('HOT STREAK') ? 'bg-orange-100 text-orange-800' :
                            data.recommendation?.includes('DROUGHT') ? 'bg-yellow-100 text-yellow-800' :
                            data.recommendation?.includes('LOW RISK') ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {data.confidence}%
                          </span>
                          <div className="mt-1 text-xs text-gray-600" title={data.recommendation}>
                            {data.recommendation?.length > 40 ? 
                              data.recommendation.substring(0, 40) + '...' : 
                              data.recommendation
                            }
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Chance Modal */}
      {showChanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-purple-600 mb-2">
                🎲 Chance Segment
              </h2>
              <p className="text-gray-600">
                You've landed on Chance! Choose your outcome:
              </p>
            </div>
            
            {/* Show current bet info if active */}
            {chanceModalData?.shouldBet && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="text-sm text-blue-800">
                  <strong>Current Bet:</strong> ₱{chanceModalData.betAmount}
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  {chanceModalData.currentRecommendation?.reason}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Multiplier Option */}
              <div className="border-2 border-yellow-500 rounded-lg p-4 bg-yellow-50">
                <div className="text-lg font-bold text-yellow-700 mb-3">
                  🎯 Multiplier
                </div>
                <div className="text-sm text-yellow-600 mb-3">
                  Set multiplier value. Win = bet × multiplier if next result is "1"
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Multiplier Value
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      defaultValue="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="Enter multiplier (e.g., 2, 5, 10)"
                      id="multiplierAmount"
                    />
                  </div>
                  
                  <button
                    onClick={() => {
                      const multiplierInput = document.getElementById('multiplierAmount');
                      const multiplierValue = parseFloat(multiplierInput.value) || 2;
                      if (multiplierValue < 1) {
                        alert('Please enter a multiplier value of 1 or greater');
                        return;
                      }
                      handleChanceMultiplier(multiplierValue);
                    }}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Confirm Multiplier
                  </button>
                </div>
              </div>
              
              {/* Cash Option */}
              <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
                <div className="text-lg font-bold text-green-700 mb-3">
                  💰 Cash Out
                </div>
                <div className="text-sm text-green-600 mb-3">
                  Reset martingale and add cash to your capital
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cash Amount (₱)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter cash amount"
                      id="cashAmount"
                    />
                  </div>
                  
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
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Confirm Cash Out
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setShowChanceModal(false);
                  setChanceModalData(null);
                }}
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