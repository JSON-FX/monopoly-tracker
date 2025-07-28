import React, { useState } from 'react';

/**
 * Simplified Chance Modal component
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Function called when modal is closed
 * @param {Function} onMultiplier - Function called when multiplier is selected
 * @param {Function} onCash - Function called when cash is selected with amount
 * @returns {JSX.Element} ChanceModal component
 */
const ChanceModal = ({ isOpen, onClose, onMultiplier, onCash }) => {
  const [cashAmount, setCashAmount] = useState('');

  if (!isOpen) return null;

  const handleCashSubmit = () => {
    const amount = parseFloat(cashAmount) || 0;
    if (amount <= 0) {
      alert('Please enter a valid cash amount greater than 0');
      return;
    }
    onCash(amount);
    setCashAmount('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-purple-600 mb-2">
            🎲 Chance Segment
          </h2>
          <p className="text-gray-600">
            Choose your outcome:
          </p>
        </div>
        
        <div className="space-y-4">
          {/* Fixed 2x Multiplier Option */}
          <button
            onClick={onMultiplier}
            className="w-full border-2 border-yellow-500 rounded-lg p-4 bg-yellow-50 hover:bg-yellow-100 transition-colors"
          >
            <div className="text-lg font-bold text-yellow-700 mb-2">
              🎯 2x Multiplier
            </div>
            <div className="text-sm text-yellow-600">
              Win = bet × 2 if next result is "1"
            </div>
          </button>
          
          {/* Cash Option */}
          <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
            <div className="text-lg font-bold text-green-700 mb-3">
              💰 Cash Out
            </div>
            <div className="text-sm text-green-600 mb-3">
              Add cash to your capital and reset martingale
            </div>
            
            <div className="space-y-3">
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter cash amount (₱)"
              />
              
              <button
                onClick={handleCashSubmit}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Confirm Cash Out
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChanceModal; 