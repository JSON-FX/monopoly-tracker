import React from 'react';
import SpinHistoryGrid from './SpinHistoryGrid';
import { exportSessionToCSV, copySessionRawData } from './exportUtils';

/**
 * Safe number formatting to prevent toFixed errors
 */
const safeToFixed = (value, decimals = 2) => {
  const num = Number(value);
  return isNaN(num) ? '0.00' : num.toFixed(decimals);
};

/**
 * SessionDetailModal component - Shows detailed view of a single session
 * Follows Single Responsibility Principle - only handles detailed session display
 */
const SessionDetailModal = ({ session, onClose }) => {
  if (!session) return null;

  const {
    startTime,
    endTime,
    startingCapital,
    finalCapital,
    profit,
    totalBets,
    successfulBets,
    winRate,
    highestMartingale,
    duration,
    results,
    chanceEvents,
    resultTimestamps
  } = session;

  // Safe conversion for database values with null/undefined checks
  const safeStartingCapital = Number(startingCapital) || 0;
  const safeFinalCapital = Number(finalCapital) || 0;
  const safeProfit = Number(profit) || 0;
  const safeHighestMartingale = Number(highestMartingale) || 0;
  const safeResults = results || [];
  const safeChanceEvents = chanceEvents || [];
  const safeResultTimestamps = resultTimestamps || [];
  const safeTotalBets = totalBets || 0;
  const safeSuccessfulBets = successfulBets || 0;
  const safeWinRate = winRate || 0;
  const safeDuration = duration || 'Unknown';

  const profitColor = safeProfit >= 0 ? 'text-green-600' : 'text-red-600';
  const profitBgColor = safeProfit >= 0 ? 'bg-green-50' : 'bg-red-50';

  const handleExportCSV = () => {
    exportSessionToCSV(session);
  };

  const handleCopyRaw = () => {
    copySessionRawData(session);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">📊 Session Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Session Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Time & Duration */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">⏰ Session Time</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Started:</span>{' '}
                  <span className="font-medium">
                    {new Date(startTime).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Ended:</span>{' '}
                  <span className="font-medium">
                    {new Date(endTime).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Duration:</span>{' '}
                  <span className="font-medium">{safeDuration}</span>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className={`rounded-lg p-4 ${profitBgColor}`}>
              <h3 className="font-semibold text-gray-800 mb-3">💰 Financial Summary</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Starting Capital:</span>{' '}
                  <span className="font-medium">₱{safeToFixed(safeStartingCapital)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Final Capital:</span>{' '}
                  <span className="font-medium">₱{safeToFixed(safeFinalCapital)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Profit/Loss:</span>{' '}
                  <span className={`font-bold ${profitColor}`}>
                    ₱{safeToFixed(safeProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-800">{safeTotalBets}</div>
              <div className="text-sm text-blue-600">Total Spins</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-800">{safeSuccessfulBets}</div>
              <div className="text-sm text-green-600">Wins</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-800">{safeWinRate}%</div>
              <div className="text-sm text-purple-600">Win Rate</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-800">₱{safeHighestMartingale}</div>
              <div className="text-sm text-orange-600">Highest Bet</div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              📊 Export CSV
            </button>
            <button
              onClick={handleCopyRaw}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📋 Copy Raw Data
            </button>
          </div>

          {/* Spin History */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">🎰 Spin History</h3>
            <SpinHistoryGrid 
              results={safeResults} 
              chanceEvents={safeChanceEvents}
              resultTimestamps={safeResultTimestamps}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailModal; 