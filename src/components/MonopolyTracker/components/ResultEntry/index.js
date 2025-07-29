import React from 'react';
import ResultButtons from './ResultButtons';
import UndoButton from './UndoButton';
import { filterOutChanceResults } from '../../utils/patterns';

/**
 * Complete ResultEntry component combining buttons and undo functionality
 * @param {Function} onResultClick - Function called when a result button is clicked
 * @param {Function} onUndo - Function called when undo button is clicked
 * @param {Object} sessionData - All session data and controls
 * @returns {JSX.Element} ResultEntry component
 */
const ResultEntry = ({ onResultClick, onUndo, sessionData }) => {
  const {
    consecutiveLosses,
    recommendation,
    sessionActive,
    currentBetAmount,
    currentCapital,
    sessionProfit,
    totalBets,
    successfulBets,
    results, // Add results for last 3 rolls display
    targetWinCount,
    currentWinCount,
    onStartSession,
    onEndSession,
    onClearSession
  } = sessionData;

  // Get last 3 non-chance results (latest to oldest for display)
  const getLast3Rolls = () => {
    if (!results || results.length === 0) return [];
    const filteredResults = filterOutChanceResults(results);
    const last3 = filteredResults.slice(-3);
    return last3.reverse(); // Reverse to show latest to oldest
  };

  const last3Rolls = getLast3Rolls();

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white rounded-lg shadow-xl border p-3 max-w-4xl mx-auto">
      <div className="grid grid-cols-3 gap-4">
        {/* Column 1 - Buttons & Session Controls */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-center">Quick Entry</h3>
          <ResultButtons onResultClick={onResultClick} />
          <UndoButton onUndo={onUndo} />
          
          {/* Session Controls */}
          <div className="flex gap-1">
            {!sessionActive ? (
              <button
                onClick={onStartSession}
                className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded transition-colors"
              >
                💰 Start
              </button>
            ) : (
              <>
                <button
                  onClick={onEndSession}
                  className="flex-1 h-8 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded transition-colors"
                >
                  ⏹️ End
                </button>
                <button
                  onClick={onClearSession}
                  className="flex-1 h-8 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-colors"
                >
                  🗑️ Clear
                </button>
              </>
            )}
          </div>
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
            <div className="bg-gray-50 p-1 rounded text-center col-span-2">
              <div className="text-gray-600">P/L</div>
              <div className={`font-bold ${sessionProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {sessionProfit >= 0 ? '+' : ''}₱{sessionProfit.toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Column 3 - Martingale Info & Basic Stats */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-center">Martingale Info</h3>
          
          {/* Status */}
          <div className={`p-1 rounded text-center border ${
            recommendation?.shouldBet ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
          }`}>
            <div className="text-xs text-gray-600">Status</div>
            <div className={`text-sm font-bold ${
              recommendation?.shouldBet ? 'text-green-600' : 'text-red-600'
            }`}>
              {recommendation?.shouldBet ? '✅ BET' : '❌ SKIP'}
            </div>
          </div>

          {/* Next Bet */}
          <div className="bg-blue-50 border border-blue-300 p-1 rounded text-center">
            <div className="text-xs text-gray-600">Next Bet</div>
            <div className="text-sm font-bold text-blue-600">
              ₱{currentBetAmount.toFixed(0)}
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
            <div className="bg-gray-50 border border-gray-300 p-1 rounded text-center">
              <div className="text-xs text-gray-600">Target Win</div>
              <div className={`text-sm font-bold ${
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