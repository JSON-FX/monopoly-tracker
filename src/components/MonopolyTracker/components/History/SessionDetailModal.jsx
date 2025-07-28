import React, { useState } from 'react';
import SpinHistoryGrid from './SpinHistoryGrid';
import DeleteSessionButton from './DeleteSessionButton';
import { exportUtils } from './exportUtils';
import { calculateSessionDuration } from '../../utils/calculations';

const SessionDetailModal = ({ session, onClose, onDelete }) => {
  const [activeView, setActiveView] = useState('overview');

  if (!session) return null;

  const {
    id,
    startTime,
    endTime,
    startingCapital,
    finalCapital,
    profit,
    totalBets,
    successfulBets,
    winRate,
    highestMartingale,
    baseBet,
    results = [],
    resultTimestamps = []
  } = session;

  const duration = calculateSessionDuration(startTime, endTime);
  const actualProfit = profit || (finalCapital - startingCapital);
  const actualWinRate = winRate || (totalBets > 0 ? (successfulBets / totalBets * 100).toFixed(1) : 0);

  const handleExportSession = () => {
    try {
      exportUtils.exportSingleSession(session);
      window.showNotification && window.showNotification(
        'Session exported successfully', 
        'success'
      );
    } catch (error) {
      console.error('Export error:', error);
      window.showNotification && window.showNotification(
        'Failed to export session', 
        'error'
      );
    }
  };

  const handleDeleteSession = (deletedSessionId) => {
    onDelete(deletedSessionId);
    onClose(); // Close modal after deletion
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Session Details</h2>
              <p className="text-sm text-gray-600">
                {new Date(startTime).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Export Button */}
            <button
              onClick={handleExportSession}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              title="Export this session to CSV"
            >
              <span>📤</span>
              <span className="hidden sm:inline">Export</span>
            </button>
            
            {/* Delete Button */}
            <DeleteSessionButton
              sessionId={id}
              sessionData={session}
              onDelete={handleDeleteSession}
            />
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          {[
            { id: 'overview', label: '📊 Overview', desc: 'Session summary' },
            { id: 'results', label: '🎲 Results', desc: 'Spin by spin details' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex-1 p-4 text-left transition-colors ${
                activeView === tab.id
                  ? 'border-b-2 border-blue-500 bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50 text-gray-600'
              }`}
            >
              <div className="font-semibold">{tab.label}</div>
              <div className="text-xs opacity-75">{tab.desc}</div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeView === 'overview' && (
            <div className="p-6 space-y-6">
              {/* Session Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Duration */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium">Duration</div>
                  <div className="text-xl font-bold text-blue-800">{duration}</div>
                </div>

                {/* Total Spins */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-sm text-purple-600 font-medium">Total Spins</div>
                  <div className="text-xl font-bold text-purple-800">{results.length}</div>
                </div>

                {/* Win Rate */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm text-green-600 font-medium">Win Rate</div>
                  <div className="text-xl font-bold text-green-800">{actualWinRate}%</div>
                </div>

                {/* Highest Bet */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-sm text-orange-600 font-medium">Highest Bet</div>
                  <div className="text-xl font-bold text-orange-800">
                    ₱{(highestMartingale || baseBet).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Financial Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-600">Starting Capital</div>
                    <div className="text-2xl font-bold text-gray-800">₱{startingCapital.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Final Capital</div>
                    <div className="text-2xl font-bold text-gray-800">₱{finalCapital.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Session P/L</div>
                    <div className={`text-2xl font-bold ${
                      actualProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {actualProfit >= 0 ? '+' : ''}₱{actualProfit.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Betting Summary */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🎲 Betting Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Base Bet</div>
                    <div className="text-xl font-bold text-gray-800">₱{baseBet.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Bets</div>
                    <div className="text-xl font-bold text-gray-800">{totalBets || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Successful Bets</div>
                    <div className="text-xl font-bold text-green-600">{successfulBets || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Failed Bets</div>
                    <div className="text-xl font-bold text-red-600">
                      {(totalBets || 0) - (successfulBets || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'results' && (
            <div className="p-6">
              {results && results.length > 0 ? (
                <SpinHistoryGrid 
                  results={results}
                  timestamps={resultTimestamps}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🎲</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Results Found</h3>
                  <p className="text-gray-500">
                    This session doesn't have any recorded spin results.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionDetailModal; 