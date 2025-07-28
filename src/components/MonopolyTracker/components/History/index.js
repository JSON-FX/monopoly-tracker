import React, { useState } from 'react';
import SessionHistoryItem from './SessionHistoryItem';
import SessionDetailModal from './SessionDetailModal';

/**
 * History component - Shows list of completed sessions
 * Follows Single Responsibility Principle - only handles session history display
 */
const History = ({ sessionHistory, onClose }) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleSessionClick = (session) => {
    setSelectedSession(session);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSession(null);
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
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          ×
        </button>
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
            />
          ))}
      </div>

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