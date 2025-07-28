import React from 'react';

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
 * SpinHistoryGrid component - Displays spin results in a grid format
 * Follows Single Responsibility Principle - only handles spin results display
 */
const SpinHistoryGrid = ({ results, chanceEvents, resultTimestamps }) => {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">🎲</div>
        <p>No spins recorded</p>
      </div>
    );
  }

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
        return 'bg-gray-100 text-gray-700 border-2 border-gray-500';
    }
  };

  const getDisplayText = (result, index) => {
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

  const getChanceEventTooltip = (result, index) => {
    if (result !== 'chance') {
      return `Spin ${index + 1}: ${result === 'chance' ? 'Chance Segment' : result.toUpperCase()}`;
    }
    
    const chanceEvent = getChanceEventForResult(chanceEvents, results, resultTimestamps, index);
    if (chanceEvent) {
      if (chanceEvent.event_type === 'CASH_PRIZE') {
        return `Spin ${index + 1}: Chance - Cash Prize: ₱${chanceEvent.cash_amount || 0}`;
      } else if (chanceEvent.event_type === 'MULTIPLIER') {
        return `Spin ${index + 1}: Chance - Multiplier: ${chanceEvent.multiplier_value || 1}x (Original bet: ₱${chanceEvent.original_bet_amount || 0})`;
      }
    }
    
    return `Spin ${index + 1}: Chance Segment`;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {/* Stats Summary */}
      <div className="mb-4 text-sm text-gray-600">
        <span className="font-medium">Total Spins: {results.length}</span>
        {' • '}
        <span>
          Chance: {results.filter(r => r === 'chance').length}
          ({((results.filter(r => r === 'chance').length / results.length) * 100).toFixed(1)}%)
        </span>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-2">
        {results.map((result, index) => (
          <div
            key={index}
            className={`px-3 py-2 rounded-lg text-center font-semibold ${getResultStyle(result)} transition-transform hover:scale-105`}
            title={getChanceEventTooltip(result, index)}
          >
            {getDisplayText(result, index)}
          </div>
        ))}
      </div>

      {/* Results Breakdown */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
        {['1', '2', '5', '10', 'chance', '2rolls', '4rolls'].map(segment => {
          const count = results.filter(r => r === segment).length;
          const percentage = results.length > 0 ? ((count / results.length) * 100).toFixed(1) : '0.0';
          
          if (count === 0) return null; // Only show segments that have results
          
          return (
            <div key={segment} className={`p-2 rounded ${getResultStyle(segment)} text-center`}>
              <div className="font-bold">{count}</div>
              <div className="text-xs opacity-80">
                {getDisplayText(segment)} ({percentage}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpinHistoryGrid; 