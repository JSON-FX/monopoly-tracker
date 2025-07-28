import React, { useState } from 'react';
import { useApi } from '../../../../hooks/useApi';
import ConfirmDialog from '../../../Common/ConfirmDialog';

const ClearAllHistoryButton = ({ onClearAll }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { apiCall } = useApi();

  const handleClearAll = async () => {
    setIsLoading(true);
    try {
      const response = await apiCall('/users/history', {
        method: 'DELETE'
      });

      if (response.success) {
        onClearAll();
        window.showNotification && window.showNotification(
          'All history cleared successfully', 
          'success'
        );
      } else {
        throw new Error(response.message || 'Failed to clear history');
      }
    } catch (error) {
      console.error('Clear history error:', error);
      window.showNotification && window.showNotification(
        error.message || 'Failed to clear history', 
        'error'
      );
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isLoading}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200
          ${isLoading 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-lg transform hover:scale-105'
          }
        `}
        title="Clear all session history permanently"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"></div>
            <span>Clearing...</span>
          </>
        ) : (
          <>
            <span className="text-lg">🗑️</span>
            <span>Clear All History</span>
          </>
        )}
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Clear All History"
        message="Are you sure you want to delete all your session history? This action cannot be undone and will permanently remove all sessions, results, and statistics."
        confirmText="Yes, Clear All"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleClearAll}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};

export default ClearAllHistoryButton; 