import React from 'react';

/**
 * Component for displaying result entry buttons
 * @param {Function} onResultClick - Function called when a result button is clicked
 * @returns {JSX.Element} ResultButtons component
 */
const ResultButtons = ({ onResultClick }) => {
  return (
    <div className="space-y-2">
      {/* First Row - Main Numbers */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => onResultClick('1')}
          className="h-8 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
        >
          1
        </button>
        <button
          onClick={() => onResultClick('2')}
          className="h-8 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
        >
          2
        </button>
        <button
          onClick={() => onResultClick('5')}
          className="h-8 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
        >
          5
        </button>
        <button
          onClick={() => onResultClick('10')}
          className="h-8 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
        >
          10
        </button>
      </div>
      
      {/* Second Row - Special Results */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onResultClick('chance')}
          className="h-8 bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white text-xs font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
        >
          CHANCE
        </button>
        <button
          onClick={() => onResultClick('2rolls')}
          className="h-8 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white text-xs font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-1"
        >
          <span>2</span>
          <span>🎲</span>
        </button>
        <button
          onClick={() => onResultClick('4rolls')}
          className="h-8 bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white text-xs font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-1"
        >
          <span>4</span>
          <span>🎲</span>
        </button>
      </div>
    </div>
  );
};

export default ResultButtons; 