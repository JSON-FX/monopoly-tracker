import React from 'react';

/**
 * Component for displaying result entry buttons
 * @param {Function} onResultClick - Function called when a result button is clicked
 * @returns {JSX.Element} ResultButtons component
 */
const ResultButtons = ({ onResultClick }) => {
  return (
    <div className="space-y-4">
      {/* Main Result Buttons */}
      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={() => onResultClick('1')}
          className="h-16 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white text-xl font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
        >
          <div>1</div>
          <div className="text-xs font-normal">40.74%</div>
        </button>
        <button
          onClick={() => onResultClick('2')}
          className="h-16 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xl font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
        >
          <div>2</div>
          <div className="text-xs font-normal">27.78%</div>
        </button>
        <button
          onClick={() => onResultClick('5')}
          className="h-16 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xl font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
        >
          <div>5</div>
          <div className="text-xs font-normal">12.96%</div>
        </button>
        <button
          onClick={() => onResultClick('10')}
          className="h-16 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xl font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
        >
          <div>10</div>
          <div className="text-xs font-normal">7.41%</div>
        </button>
      </div>
      
      {/* Bonus/Special Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onResultClick('chance')}
          className="h-12 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
        >
          <div>CHANCE</div>
          <div className="text-xs font-normal">3.70%</div>
        </button>
        <button
          onClick={() => onResultClick('2rolls')}
          className="h-12 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
        >
          <div>2 ROLLS</div>
          <div className="text-xs font-normal">5.56%</div>
        </button>
        <button
          onClick={() => onResultClick('4rolls')}
          className="h-12 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
        >
          <div>4 ROLLS</div>
          <div className="text-xs font-normal">1.85%</div>
        </button>
      </div>
    </div>
  );
};

export default ResultButtons; 