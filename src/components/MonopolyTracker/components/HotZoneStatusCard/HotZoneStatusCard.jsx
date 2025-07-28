import React from 'react';

/**
 * Hot Zone Status Card Component
 * Displays current hot zone analysis and shift detection
 * Follows Single Responsibility Principle - only handles hot zone display
 */
const HotZoneStatusCard = ({
  isActive = false,
  status = 'Cold',
  dominantZone = 'A',
  score = 0,
  trendDirection = 'stable',
  totalSpins = 0,
  requiredSpins = 20,
  loading = false,
  error = null,
  onRetry = null
}) => {
  
  /**
   * Get status-specific styling and simple messages
   */
  const getStatusStyles = (status) => {
    switch (status) {
      case 'Hot':
        return {
          borderColor: 'border-red-500',
          bgColor: 'bg-red-50',
          textColor: 'text-red-600',
          icon: '🔥',
          message: 'Zone is HOT - Great for betting!',
          actionable: true
        };
      case 'Warming':
        return {
          borderColor: 'border-orange-500',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-600',
          icon: '📈',
          message: 'Zone is WARMING UP - Starting to get good!',
          actionable: true
        };
      case 'Cooling':
        return {
          borderColor: 'border-blue-500',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-600',
          icon: '📉',
          message: 'Zone is COOLING DOWN - Shifting away',
          actionable: false
        };
      case 'Cold':
      default:
        return {
          borderColor: 'border-gray-500',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-600',
          icon: '❄️',
          message: 'Zone is COLD - Wait for change',
          actionable: false
        };
    }
  };

  /**
   * Get trend direction styling with clear shift indicators
   */
  const getTrendStyles = (direction) => {
    switch (direction) {
      case 'up':
        return {
          icon: '⬆️',
          color: 'text-green-600',
          text: 'Getting Hotter'
        };
      case 'down':
        return {
          icon: '⬇️',
          color: 'text-red-600',
          text: 'Getting Colder'
        };
      case 'stable':
      default:
        return {
          icon: '➡️',
          color: 'text-gray-600',
          text: 'No Change'
        };
    }
  };

  const statusStyles = getStatusStyles(status);
  const trendStyles = getTrendStyles(trendDirection);

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-red-300 h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            🎯 Hot Zone Detection
          </h2>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              🔄 Retry
            </button>
          )}
        </div>
        
        <div className="text-center py-6">
          <div className="text-4xl mb-2">❌</div>
          <div className="text-red-600 font-semibold mb-1">Analysis Error</div>
          <div className="text-sm text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-300 h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            🎯 Hot Zone Detection
          </h2>
        </div>
        
        <div className="text-center py-6">
          <div className="text-4xl mb-2">⏳</div>
          <div className="text-blue-600 font-semibold mb-1">Analyzing...</div>
          <div className="text-sm text-gray-600">Processing spin data</div>
        </div>
      </div>
    );
  }

  // Inactive state (insufficient data)
  if (!isActive) {
    const spinsRemaining = requiredSpins - totalSpins;
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-300 opacity-75 h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-500">
            🎯 Hot Zone Detection
          </h2>
          <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            Inactive
          </div>
        </div>
        
        <div className="text-center py-6">
          <div className="text-4xl mb-3">📊</div>
          <div className="text-gray-600 font-semibold mb-3">Learning Zone Patterns</div>
          <div className="text-sm text-gray-500 mb-3">
            Add {spinsRemaining} more spin{spinsRemaining !== 1 ? 's' : ''} to start zone detection
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, (totalSpins / requiredSpins) * 100)}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-500">
            {totalSpins} of {requiredSpins} spins needed
          </div>
        </div>
      </div>
    );
  }

  // Active state with analysis
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 border-4 ${statusStyles.borderColor} ${statusStyles.bgColor} h-full`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          🎯 Hot Zone Detection
        </h2>
        <div className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
          Active
        </div>
      </div>
      
      {/* Main Status Display */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Current Zone Status */}
        <div className="text-center">
          <div className="text-4xl mb-2">{statusStyles.icon}</div>
          <div className={`text-xl font-bold ${statusStyles.textColor} mb-1`}>
            Zone {dominantZone}
          </div>
          <div className="text-sm text-gray-600">
            Current Focus
          </div>
        </div>

        {/* Shift Direction */}
        <div className="text-center">
          <div className="text-4xl mb-2">{trendStyles.icon}</div>
          <div className={`text-xl font-bold ${trendStyles.color} mb-1`}>
            {trendStyles.text}
          </div>
          <div className="text-sm text-gray-600">
            Shift Direction
          </div>
        </div>
      </div>

      {/* Simple Message */}
      <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-3 text-center">
        <div className="text-lg font-semibold text-gray-800 mb-2">
          {statusStyles.message}
        </div>
        <div className="text-sm text-gray-500">
          Based on {totalSpins} spins
        </div>
      </div>

      {/* Simple Recommendation */}
      {statusStyles.actionable && (
        <div className="text-center p-3 rounded-md bg-green-100 text-green-800 border border-green-300">
          <div className="text-sm font-semibold">
            🎯 Zone {dominantZone} - Safe for betting
          </div>
        </div>
      )}
    </div>
  );
};

export default HotZoneStatusCard; 