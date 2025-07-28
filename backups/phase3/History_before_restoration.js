import React, { useState, useCallback } from 'react';
import SessionDetailModal from './SessionDetailModal';
import SessionHistoryItem from './SessionHistoryItem';
import ClearAllHistoryButton from './ClearAllHistoryButton';
import DeleteSessionButton from './DeleteSessionButton';
import { exportUtils } from './exportUtils';

const History = ({ 
  sessionHistory, 
  onClose,
  onSessionHistoryUpdate // New prop to update session history in parent
}) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [localSessionHistory, setLocalSessionHistory] = useState(sessionHistory);

  // Update local state when prop changes
  React.useEffect(() => {
    setLocalSessionHistory(sessionHistory);
  }, [sessionHistory]);

  const handleSessionClick = useCallback((session) => {
    setSelectedSession(session);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedSession(null);
  }, []);

  const handleClearAll = useCallback(() => {
    // Clear local state
    setLocalSessionHistory([]);
    
    // Notify parent component
    if (onSessionHistoryUpdate) {
      onSessionHistoryUpdate([]);
    }
    
    setSelectedSession(null);
  }, [onSessionHistoryUpdate]);

  const handleDeleteSession = useCallback((deletedSessionId) => {
    // Remove from local state
    const updatedHistory = localSessionHistory.filter(
      session => session.id !== deletedSessionId
    );
    setLocalSessionHistory(updatedHistory);
    
    // Notify parent component
    if (onSessionHistoryUpdate) {
      onSessionHistoryUpdate(updatedHistory);
    }
    
    // Close modal if deleted session was selected
    if (selectedSession && selectedSession.id === deletedSessionId) {
      setSelectedSession(null);
    }
  }, [localSessionHistory, selectedSession, onSessionHistoryUpdate]);

  const handleExportAll = useCallback(() => {
    if (localSessionHistory.length === 0) {
      window.showNotification && window.showNotification(
        'No session history to export', 
        'warning'
      );
      return;
    }

    try {
      exportUtils.exportAllSessions(localSessionHistory);
      window.showNotification && window.showNotification(
        'Session history exported successfully', 
        'success'
      );
    } catch (error) {
      console.error('Export error:', error);
      window.showNotification && window.showNotification(
        'Failed to export session history', 
        'error'
      );
    }
  }, [localSessionHistory]);

  const hasHistory = localSessionHistory && localSessionHistory.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">📊</span>
          <h2 className="text-xl font-bold text-gray-800">Session History</h2>
          {hasHistory && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
              {localSessionHistory.length} session{localSessionHistory.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Export All Button */}
          {hasHistory && (
            <button
              onClick={handleExportAll}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-200 hover:shadow-lg transform hover:scale-105"
              title="Export all sessions to CSV"
            >
              <span className="text-lg">📤</span>
              <span>Export All</span>
            </button>
          )}
          
          {/* Clear All History Button */}
          {hasHistory && (
            <ClearAllHistoryButton onClearAll={handleClearAll} />
          )}
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
            title="Close history"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!hasHistory ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Session History</h3>
            <p className="text-gray-500 mb-6">
              Your completed gaming sessions will appear here. Start a session to begin tracking your progress!
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start New Session
            </button>
          </div>
        ) : (
          /* Sessions List */
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {localSessionHistory.map((session) => (
              <div 
                key={session.id} 
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                {/* Session Item */}
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleSessionClick(session)}
                >
                  <SessionHistoryItem
                    session={session}
                    onClick={() => handleSessionClick(session)}
                  />
                </div>
                
                {/* Delete Button */}
                <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DeleteSessionButton
                    sessionId={session.id}
                    sessionData={session}
                    onDelete={handleDeleteSession}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={handleCloseModal}
          onDelete={handleDeleteSession}
        />
      )}
    </div>
  );
};

export default History; 