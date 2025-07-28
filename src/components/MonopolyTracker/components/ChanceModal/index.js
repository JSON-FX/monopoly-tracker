import React from 'react';
import CashPrizeOption from './CashPrizeOption';
import MultiplierOption from './MultiplierOption';

/**
 * Enhanced Chance Modal component with proper stacking logic
 * Implements the complete Chance segment specification
 * 
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Function called when modal is closed
 * @param {Function} onMultiplier - Function called when multiplier is selected
 * @param {Function} onCash - Function called when cash is selected with amount
 * @param {boolean} hasMultiplier - Whether there's a pending multiplier
 * @param {number} pendingMultiplier - Current pending multiplier value
 * @param {number} originalBet - Original bet amount for calculations
 * @returns {JSX.Element} ChanceModal component
 */
const ChanceModal = ({ 
  isOpen, 
  onClose, 
  onMultiplierSelect, 
  onCashSelect,
  hasMultiplier = false,
  pendingMultiplier = 0,
  originalBet = 0
}) => {
  if (!isOpen) return null;

  const getModalTitle = () => {
    if (hasMultiplier) {
      return `🎲 Chance Segment (${pendingMultiplier}x Pending)`;
    }
    return '🎲 Chance Segment';
  };

  const getModalDescription = () => {
    if (hasMultiplier) {
      return `You have a ${pendingMultiplier}x multiplier pending. Choose how to handle this new Chance:`;
    }
    return 'Choose your Chance outcome:';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-purple-600 mb-2">
            {getModalTitle()}
          </h2>
          <p className="text-gray-600">
            {getModalDescription()}
          </p>
          {hasMultiplier && (
            <div className="mt-2 p-2 bg-purple-100 rounded-lg">
              <div className="text-sm text-purple-700">
                Original bet: ₱{originalBet} | Pending: {pendingMultiplier}x
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          {/* Multiplier Option */}
          <MultiplierOption
            onMultiplierSelect={onMultiplierSelect}
            hasMultiplier={hasMultiplier}
            pendingMultiplier={pendingMultiplier}
            originalBet={originalBet}
          />
          
          {/* Cash Prize Option */}
          <CashPrizeOption
            onCashSelect={onCashSelect}
            hasMultiplier={hasMultiplier}
            pendingMultiplier={pendingMultiplier}
            originalBet={originalBet}
          />
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            Cancel (Skip Chance)
          </button>
        </div>
        
        {/* Legend/Help */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          <div className="font-semibold mb-1">Quick Reference:</div>
          <div>• Multiplier: Wait for next spin, win = bet × multiplier if "1"</div>
          <div>• Cash: Immediate win</div>
          {hasMultiplier && (
            <div>• Stacking: Multipliers add together, Cash = (bet × multiplier) + cash</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChanceModal; 