import React from 'react';
import ResultButtons from './ResultButtons';
import UndoButton from './UndoButton';

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
    totalResults,
    currentBetAmount,
    currentCapital,
    sessionProfit,
    totalBets,
    successfulBets,
    onStartSession,
    onEndSession,
    onClearSession
  } = sessionData;

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

        {/* Column 2 - Stats */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-center">Session Stats</h3>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="bg-gray-50 p-1 rounded text-center">
              <div className="text-gray-600">Results</div>
              <div className="font-bold text-blue-600">{totalResults}</div>
            </div>
            <div className="bg-gray-50 p-1 rounded text-center">
              <div className="text-gray-600">Losses</div>
              <div className={`font-bold ${
                consecutiveLosses >= 3 ? 'text-red-600' :
                consecutiveLosses >= 2 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {consecutiveLosses}/7
              </div>
            </div>
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

        {/* Column 3 - Status, Next Bet, Martingale */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-center">Betting Info</h3>
          
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

          {/* Martingale Level */}
          <div className="bg-gray-50 border border-gray-300 p-1 rounded text-center">
            <div className="text-xs text-gray-600">Martingale</div>
            <div className="text-sm font-bold text-gray-600">
              {consecutiveLosses === 0 ? 'Base' : `${Math.pow(2, consecutiveLosses)}x`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultEntry; 