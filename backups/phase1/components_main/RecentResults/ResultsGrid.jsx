import React from 'react';

/**
 * Component for displaying recent results in a grid
 * @param {Array} results - Array of game results
 * @param {Array} resultTimestamps - Array of result timestamps
 * @returns {JSX.Element} ResultsGrid component
 */
const ResultsGrid = ({ results, resultTimestamps }) => {
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

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🎲</div>
        <div className="text-gray-500">No results yet - start your fresh session!</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-10 gap-2">
      {/* Display current session results - newest first (left to right, top to bottom) */}
      {[...results].reverse().slice(0, 20).map((result, index) => (
        <div
          key={index}
          className={`px-3 py-2 rounded-lg text-center font-semibold ${getResultStyle(result)}`}
          title={`Result: ${result.toUpperCase()}\nTime: ${resultTimestamps[results.length - 1 - index] ? new Date(resultTimestamps[results.length - 1 - index]).toLocaleString() : 'N/A'}`}
        >
          {getDisplayText(result)}
        </div>
      ))}
    </div>
  );
};

export default ResultsGrid; 