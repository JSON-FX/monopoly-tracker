import React from 'react';
import ResultButtons from './ResultButtons';
import UndoButton from './UndoButton';
import SessionControls from '../SessionControls';

import { filterOutChanceResults } from '../../utils/patterns';

/**
 * Complete ResultEntry component combining buttons and undo functionality
 * @param {Function} onResultClick - Function called when a result button is clicked
 * @param {Function} onUndo - Function called when undo button is clicked
 * @param {Object} sessionData - All session data and controls
 * @returns {JSX.Element} ResultEntry component
 */
const ResultEntry = ({ onResultClick, onUndo, sessionData, hideControlsWhenInactive = false }) => {
  const {
    consecutiveLosses,
    sessionActive,
    currentBetAmount,
    currentCapital,
    sessionProfit,
    totalBets,
    successfulBets,
    results, // Add results for last 3 rolls display
    targetWinCount,
    currentWinCount,
    targetProfitAmount,
    sessionDuration,
    onStartSession,
    onEndSession,
    onClearSession,
    hotZone,
    bettingStatus,
    conditionStrategy
  } = sessionData;

  // Get last 3 non-chance results (latest to oldest for display)
  const getLast3Rolls = () => {
    if (!results || results.length === 0) return [];
    const filteredResults = filterOutChanceResults(results);
    const last3 = filteredResults.slice(-3);
    return last3.reverse(); // Reverse to show latest to oldest
  };

  // Check if target profit has been achieved
  const isTargetAchieved = sessionActive && targetProfitAmount > 0 && sessionProfit >= targetProfitAmount;

  const last3Rolls = getLast3Rolls();



  // Use betting status from LiveTracker (dual-condition logic)
  // No local logic needed - all handled in parent component

    // If hiding controls when inactive and session is active, show minimal session controls only
  if (hideControlsWhenInactive && sessionActive) {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border p-3" style={{ zIndex: 10000 }}>
        <div className="px-2 py-1">
          <h3 className="text-xs font-semibold text-center mb-2">Session Controls</h3>
          <SessionControls
            sessionActive={sessionActive}
            isTargetAchieved={isTargetAchieved}
            onStartSession={onStartSession}
            onEndSession={onEndSession}
            onClearSession={onClearSession}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-xl border p-3 max-w-4xl mx-auto" style={{ zIndex: 10000 }}>
      <div className="grid grid-cols-3 gap-4">
        {/* Column 1 - Buttons & Session Controls */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-center">Quick Entry</h3>
          

          
          <ResultButtons onResultClick={onResultClick} disabled={isTargetAchieved || !sessionActive} />
          <UndoButton onUndo={onUndo} disabled={isTargetAchieved || !sessionActive} />
          
          {/* Session Controls */}
          <SessionControls
            sessionActive={sessionActive}
            isTargetAchieved={isTargetAchieved}
            onStartSession={onStartSession}
            onEndSession={onEndSession}
            onClearSession={onClearSession}
          />
          

        </div>

        {/* Column 2 - Last 3 Rolls & Session Stats */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-center">Last 3 Rolls</h3>
          
          {/* Last 3 Rolls Display */}
          <div className="bg-purple-50 border border-purple-300 p-2 rounded">
            <div className="text-xs text-gray-600 text-center mb-1">Latest → Oldest</div>
            <div className="flex justify-center gap-1">
              {last3Rolls.length > 0 ? (
                last3Rolls.map((result, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded bg-white border flex items-center justify-center text-xs font-bold"
                  >
                    {result.toUpperCase()}
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500">No rolls yet</div>
              )}
            </div>
            <div className="text-xs text-center mt-1 text-gray-500">
              ({last3Rolls.length}/3 non-chance)
            </div>
          </div>

          {/* Session Summary Stats */}
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="bg-gray-50 p-1 rounded text-center">
              <div className="text-gray-600">Capital</div>
              <div className={`font-bold ${currentCapital >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₱{currentCapital.toFixed(0)}
              </div>
            </div>
            <div className="bg-gray-50 p-1 rounded text-center">
              <div className="text-gray-600">Win Rate</div>
              <div className="font-bold text-purple-600">
                {totalBets > 0 ? ((successfulBets / totalBets) * 100).toFixed(1) : 0}%
              </div>
            </div>
            <div className={`p-1 rounded text-center col-span-2 ${
              isTargetAchieved ? 'jackpot-glow' : 'bg-gray-50'
            }`}>
              <div className={isTargetAchieved ? 'jackpot-text' : 'text-gray-600'}>
                {isTargetAchieved ? '🎉 TARGET ACHIEVED! 🎉' : 'P/L'}
              </div>
              <div className={`font-bold ${
                isTargetAchieved 
                  ? 'jackpot-text text-2xl' 
                  : sessionProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {sessionProfit >= 0 ? '+' : ''}₱{sessionProfit.toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Column 3 - Betting Status */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-center">Betting Status</h3>
          
          {/* Combined Betting Status */}
          <div className={`p-1 rounded text-center border ${
            bettingStatus.shouldBet 
              ? 'bg-green-50 border-green-300' 
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="text-xs text-gray-600">Zone {hotZone?.dominantZone || 'A'}</div>
            <div className={`text-xs font-bold flex items-center justify-center gap-1 ${
              bettingStatus.shouldBet ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{bettingStatus.shouldBet ? '✅' : '🛑'}</span>
              <span>{bettingStatus.shouldBet ? 'BET ENABLED' : 'BET SKIPPED'}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1 leading-tight">
              {conditionStrategy === 'hz_l3' && `HZ: ${bettingStatus?.hotZoneCondition || 'N/A'} | `}
              L3: {bettingStatus?.last3Condition || 'N/A'}
            </div>
          </div>

          {/* Next Bet and Duration on same row */}
          <div className="grid grid-cols-2 gap-1">
            <div className="bg-blue-50 border border-blue-300 p-1 rounded text-center">
              <div className="text-xs text-gray-600">Next Bet</div>
              <div className="text-sm font-bold text-blue-600">
                ₱{currentBetAmount.toFixed(0)}
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-300 p-1 rounded text-center">
              <div className="text-xs text-gray-600">Duration</div>
              <div className="text-sm font-bold text-purple-600">
                {sessionActive ? sessionDuration : '0s'}
              </div>
            </div>
          </div>

          {/* Martingale Level, Losses, and Target Win in same row */}
          <div className="grid grid-cols-3 gap-1">
            <div className="bg-gray-50 border border-gray-300 p-1 rounded text-center">
              <div className="text-xs text-gray-600">Martingale</div>
              <div className="text-sm font-bold text-gray-600">
                {consecutiveLosses === 0 ? 'Base' : `${Math.pow(2, consecutiveLosses)}x`}
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-300 p-1 rounded text-center">
              <div className="text-xs text-gray-600">Losses</div>
              <div className={`text-sm font-bold ${
                consecutiveLosses >= 3 ? 'text-red-600' :
                consecutiveLosses >= 2 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {consecutiveLosses}/7
              </div>
            </div>
            <div className={`border p-1 rounded text-center ${
              isTargetAchieved 
                ? 'jackpot-glow border-yellow-500' 
                : 'bg-gray-50 border-gray-300'
            }`}>
              <div className={`text-xs ${
                isTargetAchieved ? 'jackpot-text' : 'text-gray-600'
              }`}>
                {isTargetAchieved ? '🎯 COMPLETE!' : 'Target Win'}
              </div>
              <div className={`text-sm font-bold ${
                isTargetAchieved ? 'jackpot-text' :
                targetWinCount > 0 ? (
                  currentWinCount >= targetWinCount ? 'text-green-600' : 'text-blue-600'
                ) : 'text-gray-400'
              }`}>
                {targetWinCount > 0 ? `${currentWinCount}/${targetWinCount}` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultEntry; 