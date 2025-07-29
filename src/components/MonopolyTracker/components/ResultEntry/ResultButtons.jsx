import React from 'react';

/**
 * Component for displaying result entry buttons
 * @param {Function} onResultClick - Function called when a result button is clicked
 * @param {boolean} disabled - Whether all buttons should be disabled
 * @returns {JSX.Element} ResultButtons component
 */
const ResultButtons = ({ onResultClick, disabled = false }) => {
  return (
    <div className="space-y-2">
      {/* First Row - Main Numbers */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={disabled ? undefined : () => onResultClick('1')}
          disabled={disabled}
          className={`h-8 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-md ${
            disabled 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50' 
              : 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800 hover:shadow-lg'
          }`}
        >
          1
        </button>
        <button
          onClick={disabled ? undefined : () => onResultClick('2')}
          disabled={disabled}
          className={`h-8 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-md ${
            disabled 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50' 
              : 'bg-green-600 hover:bg-green-700 active:bg-green-800 hover:shadow-lg'
          }`}
        >
          2
        </button>
        <button
          onClick={disabled ? undefined : () => onResultClick('5')}
          disabled={disabled}
          className={`h-8 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-md ${
            disabled 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50' 
              : 'bg-red-600 hover:bg-red-700 active:bg-red-800 hover:shadow-lg'
          }`}
        >
          5
        </button>
        <button
          onClick={disabled ? undefined : () => onResultClick('10')}
          disabled={disabled}
          className={`h-8 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-md ${
            disabled 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50' 
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:shadow-lg'
          }`}
        >
          10
        </button>
      </div>
      
      {/* Second Row - Special Results */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={disabled ? undefined : () => onResultClick('chance')}
          disabled={disabled}
          className={`h-8 text-xs font-bold rounded-lg transition-all duration-200 shadow-md ${
            disabled 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50' 
              : 'bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white hover:shadow-lg'
          }`}
        >
          CHANCE
        </button>
        <button
          onClick={disabled ? undefined : () => onResultClick('2rolls')}
          disabled={disabled}
          className={`h-8 text-xs font-bold rounded-lg transition-all duration-200 shadow-md flex items-center justify-center gap-1 ${
            disabled 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50' 
              : 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white hover:shadow-lg'
          }`}
        >
          <span>2</span>
          <span>🎲</span>
        </button>
        <button
          onClick={disabled ? undefined : () => onResultClick('4rolls')}
          disabled={disabled}
          className={`h-8 text-xs font-bold rounded-lg transition-all duration-200 shadow-md flex items-center justify-center gap-1 ${
            disabled 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50' 
              : 'bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white hover:shadow-lg'
          }`}
        >
          <span>4</span>
          <span>🎲</span>
        </button>
      </div>
    </div>
  );
};

export default ResultButtons; 