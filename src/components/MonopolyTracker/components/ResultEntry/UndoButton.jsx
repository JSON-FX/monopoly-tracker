import React from 'react';
import { Undo2 } from 'lucide-react';

/**
 * Component for the undo button
 * @param {Function} onUndo - Function called when undo button is clicked
 * @param {boolean} disabled - Whether the button should be disabled
 * @returns {JSX.Element} UndoButton component
 */
const UndoButton = ({ onUndo, disabled = false }) => {
  return (
    <button
      onClick={disabled ? undefined : onUndo}
      disabled={disabled}
      className={`w-full h-8 font-bold rounded-lg transition-all duration-200 shadow-md flex items-center justify-center ${
        disabled 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50' 
          : 'bg-gray-700 hover:bg-gray-800 active:bg-gray-900 text-white hover:shadow-lg'
      }`}
    >
      <Undo2 className="w-4 h-4" />
    </button>
  );
};

export default UndoButton; 