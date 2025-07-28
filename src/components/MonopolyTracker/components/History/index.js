import React, { useState, useMemo } from 'react';
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
  
  // Search and pagination state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
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
    // Reset to first page after deletion
    setCurrentPage(1);
  };

  // Filter and paginate sessions
  const filteredAndPaginatedSessions = useMemo(() => {
    if (!sessionHistory || sessionHistory.length === 0) {
      return { sessions: [], totalPages: 0, totalItems: 0 };
    }

    // Apply date filters
    let filtered = sessionHistory.slice(); // Show oldest first (no reverse)
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(session => {
        if (!session.startTime) return false;
        const sessionDate = new Date(session.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate >= fromDate;
      });
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(session => {
        if (!session.startTime) return false;
        const sessionDate = new Date(session.startTime);
        return sessionDate <= toDate;
      });
    }

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedSessions = filtered.slice(startIndex, endIndex);

    return {
      sessions: paginatedSessions,
      totalPages,
      totalItems
    };
  }, [sessionHistory, dateFrom, dateTo, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  const handleDateFromChange = (value) => {
    setDateFrom(value);
    setCurrentPage(1);
  };

  const handleDateToChange = (value) => {
    setDateTo(value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
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

      {/* Search and Filter Controls */}
      <div className="p-4 border-b bg-gray-50 space-y-3">
        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleClearFilters}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Clear Filters
          </button>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {filteredAndPaginatedSessions.totalItems > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredAndPaginatedSessions.totalItems)} of {filteredAndPaginatedSessions.totalItems} sessions
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {filteredAndPaginatedSessions.sessions.length > 0 ? (
          filteredAndPaginatedSessions.sessions.map((session) => (
            <SessionHistoryItem
              key={session.id}
              session={session}
              onClick={() => handleSessionClick(session)}
              onDelete={handleDeleteSession}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <p>No sessions found</p>
            <p className="text-sm">Try adjusting your search filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredAndPaginatedSessions.totalPages > 1 && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            {(() => {
              const pages = [];
              const totalPages = filteredAndPaginatedSessions.totalPages;
              const maxVisible = 5;
              let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
              let endPage = Math.min(totalPages, startPage + maxVisible - 1);
              
              if (endPage - startPage + 1 < maxVisible) {
                startPage = Math.max(1, endPage - maxVisible + 1);
              }
              
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`px-3 py-1 text-sm border rounded-lg ${
                      currentPage === i
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {i}
                  </button>
                );
              }
              return pages;
            })()}
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === filteredAndPaginatedSessions.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(filteredAndPaginatedSessions.totalPages)}
              disabled={currentPage === filteredAndPaginatedSessions.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}

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