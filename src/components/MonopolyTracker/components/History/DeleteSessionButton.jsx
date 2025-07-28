import React, { useState } from 'react';
import { useApi } from '../../../../hooks/useApi';
import ConfirmDialog from '../../../Common/ConfirmDialog';

const DeleteSessionButton = ({ sessionId, sessionData, onDelete }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { apiCall } = useApi();

  const formatSessionInfo = () => {
    if (!sessionData) return 'this session';
    
    const startDate = new Date(sessionData.startTime).toLocaleDateString();
    const profit = sessionData.profit || (sessionData.finalCapital - sessionData.startingCapital);
    const profitText = profit >= 0 ? `+₱${profit.toFixed(2)}` : `-₱${Math.abs(profit).toFixed(2)}`;
    
    return `${startDate} session (${profitText})`;
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await apiCall(`/users/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        onDelete(sessionId);
        window.showNotification && window.showNotification(
          'Session deleted successfully', 
          'success'
        );
      } else {
        throw new Error(response.message || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Delete session error:', error);
      window.showNotification && window.showNotification(
        error.message || 'Failed to delete session', 
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
          flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200
          ${isLoading 
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
            : 'bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 hover:shadow-md transform hover:scale-110'
          }
        `}
        title={`Delete ${formatSessionInfo()}`}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
        ) : (
          <span className="text-sm">🗑️</span>
        )}
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete Session"
        message={`Are you sure you want to delete ${formatSessionInfo()}? This action cannot be undone and will permanently remove all associated results and data.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};

export default DeleteSessionButton; 