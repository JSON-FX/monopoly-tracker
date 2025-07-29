import React from 'react';
import ResultsGrid from './ResultsGrid';

/**
 * Complete RecentResults component with header and controls
 * @param {Array} results - Array of game results
 * @param {Array} resultTimestamps - Array of result timestamps
 * @param {Function} onCopy - Function called when copy button is clicked
 * @param {Function} onExport - Function called when export button is clicked
 * @returns {JSX.Element} RecentResults component
 */
const RecentResults = ({ results, resultTimestamps, onCopy, onExport }) => {
  const totalSpins = results ? results.length : 0;
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          Recent Results <span className="text-sm font-normal text-gray-500">(Latest → Oldest)</span>
          <span className="ml-2 bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
            {totalSpins} spins
          </span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onCopy}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            📋 Copy
          </button>
          <button
            onClick={onExport}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            📊 CSV
          </button>
        </div>
      </div>
      
      <ResultsGrid results={results} resultTimestamps={resultTimestamps} />
    </div>
  );
};

export default RecentResults; 