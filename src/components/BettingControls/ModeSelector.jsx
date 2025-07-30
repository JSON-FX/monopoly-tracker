import React from 'react';

const ModeSelector = ({ mode, onModeChange, disabled = false }) => {
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
    </div>
  );
};

export default ModeSelector;
