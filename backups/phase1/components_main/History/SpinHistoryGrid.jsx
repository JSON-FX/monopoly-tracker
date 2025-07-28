import React from 'react';

/**
 * SpinHistoryGrid component - Displays spin results in a grid format
 * Follows Single Responsibility Principle - only handles spin results display
 */
const SpinHistoryGrid = ({ results }) => {
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
            title={`Spin ${index + 1}: ${result === 'chance' ? 'Chance Segment' : result.toUpperCase()}`}
          >
            {getDisplayText(result)}
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