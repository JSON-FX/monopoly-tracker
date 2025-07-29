import React, { useState } from 'react';
import { calculateSessionDuration } from '../../utils/calculations';
import { useSessionData } from '../../../../hooks/useSessionData';

/**
 * Utility function to get chance event details for a specific result index
 * @param {Array} chanceEvents - Array of chance events from session data
 * @param {Array} results - Array of all results
 * @param {Array} resultTimestamps - Array of result timestamps
 * @param {number} resultIndex - Index of the result we want chance details for
 * @returns {Object|null} Chance event details or null if not found
 */
const getChanceEventForResult = (chanceEvents, results, resultTimestamps, resultIndex) => {
  if (!chanceEvents || !results || !resultTimestamps || results[resultIndex] !== 'chance') {
    return null;
  }

  // Get the timestamp of the result we're looking for
  const resultTimestamp = resultTimestamps[resultIndex];
  if (!resultTimestamp) return null;

  // Find the chance event that matches this timestamp (within a reasonable window)
  const matchingEvent = chanceEvents.find(event => {
    if (!event.timestamp) return false;
    
    const eventTime = new Date(event.timestamp).getTime();
    const resultTime = new Date(resultTimestamp).getTime();
    
    // Allow up to 5 seconds difference to account for processing delays
    return Math.abs(eventTime - resultTime) <= 5000;
  });

  return matchingEvent || null;
};

/**
 * Simple notification helper
 */
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-[9999] transition-all ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  }`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
};

/**
 * Safe number formatting to prevent toFixed errors
 */
const safeToFixed = (value, decimals = 2) => {
  const num = Number(value);
  return isNaN(num) ? '0.00' : num.toFixed(decimals);
};

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
const getDisplayText = (result, chanceEvents, results, resultTimestamps, index) => {
  switch (result) {
    case 'chance':
      const chanceEvent = getChanceEventForResult(chanceEvents, results, resultTimestamps, index);
      if (chanceEvent) {
        if (chanceEvent.event_type === 'CASH_PRIZE') {
          return `C-$${chanceEvent.cash_amount || 0}`;
        } else if (chanceEvent.event_type === 'MULTIPLIER') {
          return `C-${chanceEvent.multiplier_value || 1}x`;
        }
      }
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
const SessionHistoryItem = ({ session, onClick, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { deleteSession } = useSessionData();

  // Add safety check for session itself
  if (!session) {
    return null;
  }

  const {
    startTime,
    endTime,
    startingCapital,
    finalCapital,
    profit,
    totalBets,
    winRate,
    highestMartingale,
    results,
    chanceEvents,
    resultTimestamps
  } = session;

  const duration = calculateSessionDuration(startTime, endTime);
  
  // Safe conversion for database values with comprehensive checks
  const safeProfit = Number(profit) || 0;
  const safeFinalCapital = Number(finalCapital) || 0;
  const safeStartingCapital = Number(startingCapital) || 0;
  const safeHighestMartingale = Number(highestMartingale) || 0;
  const safeTotalBets = totalBets || 0;
  const safeWinRate = winRate || 0;
  const safeResults = results || [];
  const safeChanceEvents = chanceEvents || [];
  const safeResultTimestamps = resultTimestamps || [];
  
  const profitColor = safeProfit >= 0 ? 'text-green-600' : 'text-red-600';
  const profitIcon = safeProfit >= 0 ? '📈' : '📉';

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent triggering onClick
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async (e) => {
    e.stopPropagation();
    try {
      await deleteSession(session.id);
      setShowDeleteConfirm(false);
      onDelete && onDelete(session.id);
      showNotification('Session deleted successfully', 'success');
    } catch (error) {
      console.error('Delete session error:', error);
      showNotification('Failed to delete session', 'error');
    }
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const formatSessionInfo = () => {
    const startDate = startTime ? new Date(startTime).toLocaleDateString() : 'Unknown';
    const profitText = safeProfit >= 0 ? `+₱${safeToFixed(safeProfit)}` : `-₱${safeToFixed(Math.abs(safeProfit))}`;
    return `${startDate} session (${profitText})`;
  };

  return (
    <>
      <div
        onClick={onClick}
        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors relative group"
      >
        {/* Delete Button (appears on hover) */}
        <button
          onClick={handleDeleteClick}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center justify-center"
          title={`Delete ${formatSessionInfo()}`}
        >
          ×
        </button>

        {/* Header Row */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{profitIcon}</span>
            <div>
              <div className="font-semibold text-gray-800">
                {startTime ? new Date(startTime).toLocaleDateString() : 'Unknown'} {' '}
                {startTime ? new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </div>
              <div className="text-sm text-gray-600">Duration: {duration || 'Unknown'}</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-bold ${profitColor}`}>
              ₱{safeToFixed(safeProfit)}
            </div>
            <div className="text-sm text-gray-600">
              {safeWinRate}% Win Rate
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="font-semibold text-blue-800">{safeResults.length}</div>
            <div className="text-blue-600">Spins</div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded">
            <div className="font-semibold text-purple-800">₱{safeStartingCapital}</div>
            <div className="text-purple-600">Started</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-semibold text-gray-800">₱{safeToFixed(safeFinalCapital)}</div>
            <div className="text-gray-600">Ended</div>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded">
            <div className="font-semibold text-orange-800">₱{safeHighestMartingale}</div>
            <div className="text-orange-600">Max Bet</div>
          </div>
        </div>

        {/* Quick Results Preview */}
        <div className="mt-3 flex items-center gap-1">
          <span className="text-xs text-gray-500">Results: </span>
          <div className="flex gap-1 overflow-hidden">
            {safeResults.slice(0, 10).map((result, index) => (
              <span
                key={index}
                className={`text-xs px-1.5 py-0.5 rounded font-semibold border ${getResultStyle(result)}`}
              >
                {getDisplayText(result, safeChanceEvents, safeResults, safeResultTimestamps, index)}
              </span>
            ))}
            {safeResults.length > 10 && (
              <span className="text-xs text-gray-400">+{safeResults.length - 10}</span>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Delete Session</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {formatSessionInfo()}? This action cannot be undone and will permanently remove all associated results and data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Delete
              </button>
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionHistoryItem; 