import React, { useState } from 'react';

/**
 * Component for Multiplier selection in Chance modal
 * Handles both single multipliers and multiplier stacking
 * 
 * @param {Function} onMultiplierSelect - Callback when multiplier is selected
 * @param {boolean} hasMultiplier - Whether there's already a pending multiplier
 * @param {number} pendingMultiplier - Current pending multiplier value
 * @param {number} originalBet - Original bet amount for calculation display
 * @returns {JSX.Element} MultiplierOption component
 */
const MultiplierOption = ({ 
  onMultiplierSelect, 
  hasMultiplier = false, 
  pendingMultiplier = 0, 
  originalBet = 0 
}) => {
  const [multiplierValue, setMultiplierValue] = useState('');

  const handleSubmit = () => {
    const multiplier = parseFloat(multiplierValue) || 0;
    if (multiplier <= 0) {
      alert('Please enter a valid multiplier greater than 0');
      return;
    }
    if (multiplier > 100) {
      alert('Multiplier seems too high. Please check the value.');
      return;
    }
    onMultiplierSelect(multiplier);
    setMultiplierValue('');
  };

  // Calculate final multiplier for stacking scenario
  const getFinalMultiplier = () => {
    const newMultiplier = parseFloat(multiplierValue) || 0;
    if (hasMultiplier && pendingMultiplier > 0) {
      return pendingMultiplier + newMultiplier; // ADD multipliers together
    }
    return newMultiplier;
  };

  // Quick select buttons for common multipliers
  const quickMultipliers = [2, 3, 5, 10];

  return (
    <div className="border-2 border-yellow-500 rounded-lg p-4 bg-yellow-50">
      <div className="text-lg font-bold text-yellow-700 mb-3">
        🎯 Multiplier
      </div>
      
      {hasMultiplier ? (
        <div className="text-sm text-yellow-600 mb-3">
          <div className="font-semibold">Stacking Multipliers!</div>
          <div>Current: {pendingMultiplier}x + New Multiplier = Final Multiplier</div>
          {multiplierValue && (
            <div className="mt-1 p-2 bg-yellow-100 rounded">
              <div>Final: {pendingMultiplier}x + {multiplierValue}x = <span className="font-bold">{getFinalMultiplier()}x</span></div>
              <div>Potential Win: ₱{originalBet} × {getFinalMultiplier()} = <span className="font-bold">₱{(originalBet * getFinalMultiplier()).toFixed(2)}</span></div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-yellow-600 mb-3">
          <div>Win = bet × multiplier if next result is "1"</div>
          <div>Loss = original bet if next result is NOT "1"</div>
          {multiplierValue && originalBet > 0 && (
            <div className="mt-1 p-2 bg-yellow-100 rounded">
              Potential Win: ₱{originalBet} × {multiplierValue} = <span className="font-bold">₱{(originalBet * parseFloat(multiplierValue || 0)).toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
      
      <div className="space-y-3">
        {/* Quick select buttons */}
        <div className="flex gap-2">
          {quickMultipliers.map(mult => (
            <button
              key={mult}
              onClick={() => setMultiplierValue(mult.toString())}
              className="px-3 py-1 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded-lg text-sm transition-colors"
            >
              {mult}x
            </button>
          ))}
        </div>
        
        {/* Custom input */}
        <input
          type="number"
          min="0"
          step="0.1"
          value={multiplierValue}
          onChange={(e) => setMultiplierValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          placeholder="Enter multiplier (e.g., 2.5)"
        />
        
        <button
          onClick={handleSubmit}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          {hasMultiplier ? `Stack to ${getFinalMultiplier()}x` : 'Set Multiplier'}
        </button>
      </div>
    </div>
  );
};

export default MultiplierOption; 