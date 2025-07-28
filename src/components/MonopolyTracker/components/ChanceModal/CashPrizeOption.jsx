import React, { useState } from 'react';

/**
 * Component for Cash Prize selection in Chance modal
 * Handles both simple cash prizes and multiplier + cash scenarios
 * 
 * @param {Function} onCashSelect - Callback when cash amount is selected
 * @param {boolean} hasMultiplier - Whether there's a pending multiplier
 * @param {number} pendingMultiplier - Current pending multiplier value
 * @param {number} originalBet - Original bet amount for calculation display
 * @returns {JSX.Element} CashPrizeOption component
 */
const CashPrizeOption = ({ 
  onCashSelect, 
  hasMultiplier = false, 
  pendingMultiplier = 0, 
  originalBet = 0 
}) => {
  const [cashAmount, setCashAmount] = useState('');

  const handleSubmit = () => {
    const amount = parseFloat(cashAmount) || 0;
    if (amount <= 0) {
      alert('Please enter a valid cash amount greater than 0');
      return;
    }
    onCashSelect(amount);
    setCashAmount('');
  };

  // Calculate preview amount for multiplier + cash scenario
  const getPreviewAmount = () => {
    const cash = parseFloat(cashAmount) || 0;
    if (hasMultiplier && pendingMultiplier > 0 && originalBet > 0) {
      const multiplierWin = originalBet * pendingMultiplier;
      return multiplierWin + cash;
    }
    return cash;
  };

  return (
    <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
      <div className="text-lg font-bold text-green-700 mb-3">
        💰 Cash Prize
      </div>
      
      {hasMultiplier ? (
        <div className="text-sm text-green-600 mb-3">
          <div className="font-semibold">Multiplier + Cash Combo!</div>
          <div>Formula: (₱{originalBet} × {pendingMultiplier}) + Cash = Total Win</div>
          {cashAmount && (
            <div className="mt-1 p-2 bg-green-100 rounded">
              Preview: (₱{originalBet} × {pendingMultiplier}) + ₱{cashAmount} = <span className="font-bold">₱{getPreviewAmount().toFixed(2)}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-green-600 mb-3">
          Enter the cash prize amount you received
        </div>
      )}
      
      <div className="space-y-3">
        <input
          type="number"
          min="0"
          step="0.01"
          value={cashAmount}
          onChange={(e) => setCashAmount(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Enter cash amount (₱)"
          autoFocus
        />
        
        <button
          onClick={handleSubmit}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          {hasMultiplier ? 'Claim Combo Win' : 'Claim Cash Prize'}
        </button>
      </div>
    </div>
  );
};

export default CashPrizeOption; 