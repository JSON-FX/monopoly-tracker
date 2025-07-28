import React from 'react';
import { calculateSessionDuration } from '../../utils/calculations';

/**
 * Get result styling to match RecentResults and SpinHistoryGrid
 */
const getResultStyle = (result) => {
  switch (result) {
    case '1':
      return 'bg-gray-200 text-gray-800 border-gray-600';
    case '2':
      return 'bg-green-100 text-green-800 border-green-600';
    case '5':
      return 'bg-red-100 text-red-800 border-red-600';
    case '10':
      return 'bg-blue-100 text-blue-800 border-blue-600';
    case 'chance':
      return 'bg-purple-100 text-purple-800 border-purple-600';
    case '2rolls':
      return 'bg-gray-200 text-gray-800 border-gray-600';
    case '4rolls':
      return 'bg-yellow-100 text-yellow-800 border-yellow-600';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-500';
  }
};

/**
 * Get display text for results
 */
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

/**
 * SessionHistoryItem component - Displays summary info for a single session
 * Follows Single Responsibility Principle - only handles session item display
 */
const SessionHistoryItem = ({ session, onClick }) => {
  const {
    startTime,
    endTime,
    startingCapital,
    finalCapital,
    profit,
    totalBets,
    winRate,
    highestMartingale,
    results
  } = session;

  const duration = calculateSessionDuration(startTime, endTime);
  const profitColor = profit >= 0 ? 'text-green-600' : 'text-red-600';
  const profitIcon = profit >= 0 ? '📈' : '📉';

  return (
    <div
      onClick={onClick}
      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
    >
      {/* Header Row */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{profitIcon}</span>
          <div>
            <div className="font-semibold text-gray-800">
              {new Date(startTime).toLocaleDateString()} {' '}
              {new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-sm text-gray-600">Duration: {duration}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-bold ${profitColor}`}>
            ₱{profit.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">
            {winRate}% Win Rate
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 text-sm">
        <div className="text-center p-2 bg-blue-50 rounded">
          <div className="font-semibold text-blue-800">{totalBets}</div>
          <div className="text-blue-600">Spins</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded">
          <div className="font-semibold text-purple-800">₱{startingCapital}</div>
          <div className="text-purple-600">Started</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="font-semibold text-gray-800">₱{finalCapital.toFixed(2)}</div>
          <div className="text-gray-600">Ended</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded">
          <div className="font-semibold text-orange-800">₱{highestMartingale}</div>
          <div className="text-orange-600">Max Bet</div>
        </div>
      </div>

      {/* Quick Results Preview */}
      <div className="mt-3 flex items-center gap-1">
        <span className="text-xs text-gray-500">Results: </span>
        <div className="flex gap-1 overflow-hidden">
          {results.slice(0, 10).map((result, index) => (
            <span
              key={index}
              className={`text-xs px-1.5 py-0.5 rounded font-semibold border ${getResultStyle(result)}`}
            >
              {getDisplayText(result)}
            </span>
          ))}
          {results.length > 10 && (
            <span className="text-xs text-gray-400">+{results.length - 10}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionHistoryItem; 