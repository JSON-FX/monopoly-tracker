import React from 'react';

/**
 * Skip Bet Toggle Component
 * Provides a clear visual toggle for enabling/disabling betting with status indicators
 * Follows Single Responsibility Principle - only handles skip bet UI
 */
const SkipBetToggle = ({
  skipBetMode = false,
  skipBetReason = 'Manual',
  autoSkipEnabled = true,
  onToggle,
  onToggleAuto,
  disabled = false,
  showReason = true,
  showAutoToggle = true,
  size = 'medium'
}) => {
  
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'p-3',
          button: 'px-4 py-2 text-sm',
          text: 'text-sm',
          icon: 'text-lg'
        };
      case 'large':
        return {
          container: 'p-6',
          button: 'px-6 py-3 text-lg',
          text: 'text-base',
          icon: 'text-2xl'
        };
      default: // medium
        return {
          container: 'p-4',
          button: 'px-5 py-2.5',
          text: 'text-sm',
          icon: 'text-xl'
        };
    }
  };

  const getToggleStyles = () => {
    if (disabled) {
      return {
        container: 'bg-gray-100 border-gray-300 opacity-50',
        button: 'bg-gray-400 text-gray-600 cursor-not-allowed',
        text: 'text-gray-500'
      };
    }

    if (skipBetMode) {
      return {
        container: 'bg-red-50 border-red-300',
        button: 'bg-red-600 hover:bg-red-700 text-white shadow-lg',
        text: 'text-red-700'
      };
    }

    return {
      container: 'bg-green-50 border-green-300',
      button: 'bg-green-600 hover:bg-green-700 text-white shadow-lg',
      text: 'text-green-700'
    };
  };

  const getStatusIcon = () => {
    if (disabled) return '⏸️';
    if (skipBetMode) return '🛑';
    return '✅';
  };

  const getStatusText = () => {
    if (disabled) return 'DISABLED';
    if (skipBetMode) return 'BETTING PAUSED';
    return 'BETTING ACTIVE';
  };

  const getReasonDisplay = () => {
    if (!skipBetMode || !showReason) return null;
    
    const reasonString = typeof skipBetReason === 'string' ? skipBetReason : 'Manual';
    const isAutoReason = reasonString.includes('Hot Zone');
    return (
      <div className="flex items-center gap-2 mt-2">
        {isAutoReason ? (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            🤖 Auto
          </span>
        ) : (
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
            👤 Manual
          </span>
        )}
        <span className={`text-xs ${toggleStyles.text}`}>
          {reasonString}
        </span>
      </div>
    );
  };

  const sizeClasses = getSizeClasses();
  const toggleStyles = getToggleStyles();

  return (
    <div className={`bg-white rounded-lg border-2 ${toggleStyles.container} ${sizeClasses.container} transition-all duration-200`}>
      {/* Main Toggle Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={sizeClasses.icon}>
            {getStatusIcon()}
          </span>
          <div>
            <h3 className={`font-semibold ${toggleStyles.text} ${sizeClasses.text}`}>
              Skip Bet Mode
            </h3>
            <p className={`font-bold ${toggleStyles.text}`}>
              {getStatusText()}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => onToggle()}
          disabled={disabled}
          className={`
            ${sizeClasses.button} 
            ${toggleStyles.button}
            font-semibold rounded-lg 
            transition-all duration-200 
            transform hover:scale-105 
            active:scale-95
            focus:outline-none focus:ring-4 focus:ring-opacity-50
            ${skipBetMode ? 'focus:ring-red-300' : 'focus:ring-green-300'}
          `}
        >
          {skipBetMode ? '▶️ Resume Betting' : '⏸️ Skip Bets'}
        </button>
      </div>

      {/* Reason Display */}
      {getReasonDisplay()}

      {/* Auto-Skip Toggle */}
      {showAutoToggle && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">🤖</span>
              <span className={`${sizeClasses.text} ${toggleStyles.text}`}>
                Auto Skip (Hot Zone)
              </span>
            </div>
            
            <button
              onClick={() => onToggleAuto()}
              disabled={disabled}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${autoSkipEnabled ? 'bg-blue-600' : 'bg-gray-300'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
                  ${autoSkipEnabled ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
          
          <p className={`text-xs ${toggleStyles.text} mt-1 opacity-75`}>
            {autoSkipEnabled 
              ? 'Will auto-enable skip bet when zones are cold/cooling'
              : 'Manual control only - no automatic suggestions'
            }
          </p>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className={`text-xs ${toggleStyles.text} opacity-75`}>
          {skipBetMode 
            ? '🛑 Spin results are recorded but no P/L calculations or martingale progression'
            : '✅ Normal betting mode - all results affect P/L and martingale progression'
          }
        </p>
      </div>
    </div>
  );
};

export default SkipBetToggle; 