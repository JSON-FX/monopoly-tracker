import React, { useState } from 'react';

/**
 * Enhanced Betting Recommendation component with bet/skip functionality
 * @param {Object} recommendation - Betting recommendation object
 * @param {Function} onBetDecision - Function called when user makes a bet/skip decision
 * @param {boolean} hasActiveSession - Whether there's an active session
 * @param {boolean} isPendingMultiplier - Whether there's a pending multiplier from chance
 * @param {number} pendingMultiplier - Value of pending multiplier
 * @returns {JSX.Element} BettingRecommendation component
 */
const BettingRecommendation = ({ 
  recommendation, 
  onBetDecision, 
  hasActiveSession,
  isPendingMultiplier = false,
  pendingMultiplier = 0
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!hasActiveSession || !recommendation) {
    return null;
  }

  const handleBetDecision = async (decision) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onBetDecision(decision, recommendation.amount);
    } finally {
      setIsProcessing(false);
    }
  };

  const getRecommendationColor = () => {
    if (recommendation.bettingMode === 'SAFETY_LIMIT') return 'red';
    if (recommendation.shouldBet) return 'green';
    return 'yellow';
  };

  const colorClasses = {
    red: 'bg-red-50 border-red-200',
    green: 'bg-green-50 border-green-200', 
    yellow: 'bg-yellow-50 border-yellow-200'
  };

  const textColorClasses = {
    red: 'text-red-800',
    green: 'text-green-800',
    yellow: 'text-yellow-800'
  };

  const color = getRecommendationColor();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">🎲 Betting Recommendation</h3>
      
      {/* Pending Multiplier Warning */}
      {isPendingMultiplier && (
        <div className="mb-4 p-3 bg-purple-100 border border-purple-200 rounded-lg">
          <div className="text-purple-800 font-medium">
            ⚡ {pendingMultiplier}x Multiplier Pending
          </div>
          <div className="text-sm text-purple-600 mt-1">
            Next "1" result will be multiplied by {pendingMultiplier}x
          </div>
        </div>
      )}

      {/* Recommendation Display */}
      <div className={`p-4 rounded-lg border-2 ${colorClasses[color]} mb-4`}>
        <div className={`${textColorClasses[color]}`}>
          <div className="font-bold text-lg">{recommendation.action}</div>
          <div className="text-sm mt-1">{recommendation.reason}</div>
          <div className="text-sm mt-2 font-semibold">
            Recommended bet: ₱{recommendation.amount?.toFixed(2)}
            {recommendation.consecutiveLosses > 0 && (
              <span className="text-xs ml-2 px-2 py-1 bg-red-100 text-red-700 rounded">
                Martingale x{Math.pow(2, recommendation.consecutiveLosses)}
              </span>
            )}
          </div>
          <div className="text-xs mt-1 opacity-75">
            Confidence: {recommendation.confidence}% | Risk: {recommendation.streakRisk}
          </div>
        </div>
      </div>

      {/* Betting Decision Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleBetDecision('bet')}
          disabled={isProcessing}
          className={`px-4 py-3 rounded-lg font-semibold transition-all ${
            recommendation.shouldBet
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isProcessing ? '...' : `🎯 BET ₱${recommendation.amount?.toFixed(2)}`}
        </button>
        
        <button
          onClick={() => handleBetDecision('skip')}
          disabled={isProcessing}
          className={`px-4 py-3 rounded-lg font-semibold transition-all ${
            !recommendation.shouldBet
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-300 text-gray-600'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isProcessing ? '...' : '⏸️ SKIP'}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500">Streak</div>
            <div className="font-semibold text-gray-700">
              {recommendation.consecutiveLosses} losses
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Expected Value</div>
            <div className="font-semibold text-gray-700">
              {recommendation.expectedValue}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Pattern</div>
            <div className="font-semibold text-gray-700">
              {recommendation.bettingMode.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BettingRecommendation; 