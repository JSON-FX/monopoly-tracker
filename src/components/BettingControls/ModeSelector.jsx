import React from 'react';

const ModeSelector = ({ mode, onModeChange, strategy, onStrategyChange, disabled = false }) => {
  const modes = [
    {
      id: 'martingale',
      name: 'Martingale Mode',
      description: 'Dynamic betting with higher risk and reward.',
      icon: '📈',
    },
    {
      id: 'flat',
      name: 'Flat-Betting Mode',
      description: 'Consistent, low-risk betting strategy.',
      icon: '📊',
    },
  ];

  const strategies = [
    {
      id: 'l3_only',
      name: 'L3 Only',
      description: 'Bet when 1+ "1"s appear in last 3 rolls'
    },
    {
      id: 'hz_l3',
      name: 'HZ + L3',
      description: 'Bet when Hot Zone active AND 1+ "1"s in last 3 rolls'
    }
  ];

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-800 mb-3">Select Mode</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modes.map((modeOption) => (
          <div
            key={modeOption.id}
            onClick={() => !disabled && onModeChange(modeOption.id)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              mode === modeOption.id
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}>
            <div className="flex items-center">
              <span className="text-2xl mr-4">{modeOption.icon}</span>
              <div>
                <h4 className="font-semibold text-gray-800">{modeOption.name}</h4>
                <p className="text-xs text-gray-600">{modeOption.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Strategy Selection for Martingale Mode */}
      {mode === 'martingale' && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-800 mb-3">Select Strategy</h4>
          <div className="space-y-2">
            {strategies.map((strategyOption) => (
              <div
                key={strategyOption.id}
                onClick={() => !disabled && onStrategyChange && onStrategyChange(strategyOption.id)}
                className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                  strategy === strategyOption.id
                    ? 'border-blue-400 bg-blue-100 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{strategyOption.name}</div>
                    <div className="text-xs text-gray-600">{strategyOption.description}</div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    strategy === strategyOption.id
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {strategy === strategyOption.id && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModeSelector;
