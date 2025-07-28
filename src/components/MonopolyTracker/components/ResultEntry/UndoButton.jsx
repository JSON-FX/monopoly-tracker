import React from 'react';
import { Undo2 } from 'lucide-react';

/**
 * Component for the undo button
 * @param {Function} onUndo - Function called when undo button is clicked
 * @returns {JSX.Element} UndoButton component
 */
const UndoButton = ({ onUndo }) => {
  return (
    <button
      onClick={onUndo}
      className="w-full h-8 bg-gray-700 hover:bg-gray-800 active:bg-gray-900 text-white font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
    >
      <Undo2 className="w-4 h-4" />
    </button>
  );
};

export default UndoButton; 