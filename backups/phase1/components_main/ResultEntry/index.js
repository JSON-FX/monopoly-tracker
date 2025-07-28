import React from 'react';
import ResultButtons from './ResultButtons';
import UndoButton from './UndoButton';

/**
 * Complete ResultEntry component combining buttons and undo functionality
 * @param {Function} onResultClick - Function called when a result button is clicked
 * @param {Function} onUndo - Function called when undo button is clicked
 * @returns {JSX.Element} ResultEntry component
 */
const ResultEntry = ({ onResultClick, onUndo }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Quick Result Entry</h2>
      
      <div className="space-y-4">
        <ResultButtons onResultClick={onResultClick} />
        <UndoButton onUndo={onUndo} />
      </div>
    </div>
  );
};

export default ResultEntry; 