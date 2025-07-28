import React from 'react';

/**
 * Component for the undo button
 * @param {Function} onUndo - Function called when undo button is clicked
 * @returns {JSX.Element} UndoButton component
 */
const UndoButton = ({ onUndo }) => {
  return (
    <button
      onClick={onUndo}
      className="w-full h-12 bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
    >
      <span className="text-lg">↶</span>
      <span>UNDO LAST RESULT</span>
    </button>
  );
};

export default UndoButton; 