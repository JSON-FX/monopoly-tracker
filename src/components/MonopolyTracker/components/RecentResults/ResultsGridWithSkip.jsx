import React from 'react';

/**
 * Component for displaying recent results in a grid with skip indicators
 * @param {Array} results - Array of game results
 * @param {Array} resultTimestamps - Array of result timestamps
 * @param {Array} resultSkipInfo - Array of skip information for each result
 * @returns {JSX.Element} ResultsGrid component
 */
const ResultsGridWithSkip = ({ results, resultTimestamps, resultSkipInfo }) => {
  const getResultStyle = (result, isSkipped) => {
    if (isSkipped) {
      // Skipped results get a distinctive style
      return 'bg-orange-100 text-orange-800 border-2 border-orange-600 opacity-75';
    }

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

  const getDisplayText = (result, isSkipped) => {
    if (isSkipped) {
      // Show the result with a skip indicator
      const baseText = getBaseDisplayText(result);
      return `${baseText}✕`;
    }
    return getBaseDisplayText(result);
  };

  const getBaseDisplayText = (result) => {
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

  const getTooltipText = (result, index, isSkipped, skipReason) => {
    const baseTooltip = `Result: ${result.toUpperCase()}\nTime: ${resultTimestamps[index] ? new Date(resultTimestamps[index]).toLocaleString() : 'N/A'}`;
    
    if (isSkipped) {
      return `${baseTooltip}\n🛑 SKIPPED: ${skipReason || 'Unknown reason'}\nNo P/L impact or martingale progression`;
    }
    
    return baseTooltip;
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🎲</div>
        <div className="text-gray-500">No results yet - start your fresh session!</div>
      </div>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto">
      <div className="grid grid-cols-10 gap-2 pr-2">
        {/* Display all session results - newest first (left to right, top to bottom) */}
        {[...results].reverse().map((result, displayIndex) => {
          const actualIndex = results.length - 1 - displayIndex;
          const skipInfo = resultSkipInfo[actualIndex];
          const isSkipped = skipInfo?.isSkipped || false;
          const skipReason = skipInfo?.skipReason;
          
          return (
            <div
              key={displayIndex}
              className={`px-3 py-2 rounded-lg text-center font-semibold relative ${getResultStyle(result, isSkipped)}`}
              title={getTooltipText(result, actualIndex, isSkipped, skipReason)}
            >
              {getDisplayText(result, isSkipped)}
              
              {/* Skip indicator overlay */}
              {isSkipped && (
                <div className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  ✕
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      {resultSkipInfo.some(info => info?.isSkipped) && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-sm text-orange-800 font-semibold mb-1">Legend:</div>
          <div className="text-xs text-orange-700">
            ✕ = Skipped bet (result recorded but no P/L impact or martingale progression)
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsGridWithSkip; 