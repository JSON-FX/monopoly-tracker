import React, { useState } from 'react';
import SessionHistoryItem from './SessionHistoryItem';
import SessionDetailModal from './SessionDetailModal';
import { useSessionData } from '../../../../hooks/useSessionData';

/**
 * Simple notification helper
 */
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-[9999] transition-all ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  }`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
};

/**
 * History component - Shows list of completed sessions
 * Follows Single Responsibility Principle - only handles session history display
 */
const History = ({ sessionHistory, onClose, onHistoryUpdate }) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { clearAllHistory } = useSessionData();

  const handleSessionClick = (session) => {
    setSelectedSession(session);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSession(null);
  };

  const handleClearAllHistory = async () => {
    try {
      await clearAllHistory();
      setShowClearConfirm(false);
      onHistoryUpdate && onHistoryUpdate(); // Refresh the history
      showNotification('All history cleared successfully', 'success');
    } catch (error) {
      console.error('Clear all history error:', error);
      showNotification('Failed to clear history', 'error');
    }
  };

  const handleDeleteSession = (sessionId) => {
    // Remove the session from the list immediately (optimistic update)
    onHistoryUpdate && onHistoryUpdate();
  };

  if (!sessionHistory || sessionHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">📊 Session History</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📝</div>
          <p>No sessions recorded yet</p>
          <p className="text-sm">Start playing to see your session history!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-xl font-bold text-gray-800">📊 Session History</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
            title="Clear all session history"
          >
            🗑️ Clear All
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {sessionHistory
          .slice()
          .reverse() // Show newest first
          .map((session) => (
            <SessionHistoryItem
              key={session.id}
              session={session}
              onClick={() => handleSessionClick(session)}
              onDelete={handleDeleteSession}
            />
          ))}
      </div>

      {/* Clear All Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Clear All History</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete all session history? This action cannot be undone and will permanently remove all sessions, results, and statistics.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClearAllHistory}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Clear All
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Detail Modal */}
      {isDetailModalOpen && selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={handleCloseDetailModal}
        />
      )}
    </div>
  );
};

export default History; 