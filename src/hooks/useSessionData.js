import { useState, useCallback } from 'react';
import { useApi } from './useApi';

/**
 * Hook for managing session data with database persistence
 * Replaces localStorage with database operations
 */
export const useSessionData = () => {
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Create a new session in the database
   */
  const createSession = useCallback(async (sessionData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall('/sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to create session');
      }

      return response.session;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  /**
   * Get active session from database
   */
  const getActiveSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall('/sessions/active');

      if (!response.success) {
        throw new Error(response.message || 'Failed to get active session');
      }

      return response.session;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  /**
   * Get all user sessions from database
   */
  const getUserSessions = useCallback(async (includeResults = false, limit = 10) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        includeResults: includeResults.toString(),
        limit: limit.toString()
      });

      const response = await apiCall(`/sessions?${params}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to get sessions');
      }

      return response.sessions;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  /**
   * Update session in database
   */
  const updateSession = useCallback(async (sessionId, updateData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall(`/sessions/${sessionId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to update session');
      }

      return response.session;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  /**
   * End session in database
   */
  const endSession = useCallback(async (sessionId, endData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall(`/sessions/${sessionId}/end`, {
        method: 'PUT',
        body: JSON.stringify(endData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to end session');
      }

      return response.session;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  /**
   * Add result to session in database
   */
  const addResult = useCallback(async (sessionId, resultData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall(`/sessions/${sessionId}/results`, {
        method: 'POST',
        body: JSON.stringify(resultData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to add result');
      }

      return {
        gameResult: response.gameResult,
        chanceEvent: response.chanceEvent
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  /**
   * Delete last result (undo) from database
   */
  const undoLastResult = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall(`/sessions/${sessionId}/results/last`, {
        method: 'DELETE'
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to undo last result');
      }

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  /**
   * Load session history from database (for History component)
   */
  const loadSessionHistory = useCallback(async () => {
    try {
      const sessions = await getUserSessions(true, 50); // Include results, get last 50
      
      // Filter and format sessions for History component
      const completedSessions = sessions
        .filter(session => !session.isActive) // Only completed sessions
        .map(session => {
          // Calculate duration if missing
          const duration = session.duration || calculateSessionDuration(session.startTime, session.endTime);
          
          // Ensure all required fields are present
          return {
            ...session,
            duration,
            results: session.results || [], // Ensure results is always an array
            profit: session.profit || (session.finalCapital - session.startingCapital),
            totalBets: session.totalBets || session.results?.length || 0,
            winRate: session.winRate || 0,
            successfulBets: session.successfulBets || 0,
            highestMartingale: session.highestMartingale || session.baseBet || 0
          };
        });
      
      return completedSessions;
    } catch (err) {
      console.error('Failed to load session history:', err);
      return [];
    }
  }, [getUserSessions]);

  // Helper function to calculate session duration
  const calculateSessionDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'Unknown';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  /**
   * Clear all user history (already implemented in useApi via users routes)
   */
  const clearAllHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall('/users/history', {
        method: 'DELETE'
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to clear history');
      }

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  /**
   * Delete specific session (already implemented in useApi via users routes)
   */
  const deleteSession = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall(`/users/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete session');
      }

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  return {
    // State
    loading,
    error,
    
    // Session management
    createSession,
    getActiveSession,
    getUserSessions,
    updateSession,
    endSession,
    
    // Result management
    addResult,
    undoLastResult,
    
    // History management
    loadSessionHistory,
    clearAllHistory,
    deleteSession
  };
};

export default useSessionData; 