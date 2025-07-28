import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './Navigation/Navigation';
import LiveTracker from './LiveTracker/LiveTracker';
import History from './MonopolyTracker/components/History';
import useSessionData from '../hooks/useSessionData';

/**
 * MonopolyTracker Layout Component
 * Provides navigation and routing between Live Tracker and History
 */
const MonopolyTracker = () => {
  const { loadSessionHistory } = useSessionData();
  const [sessionHistory, setSessionHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleLoadHistory = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const history = await loadSessionHistory();
      setSessionHistory(history || []);
    } catch (error) {
      setError(error.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [loadSessionHistory]);

  React.useEffect(() => {
    handleLoadHistory();
  }, [handleLoadHistory]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        <Navigation />
        <Routes>
          <Route path="/tracker" element={<LiveTracker />} />
          <Route path="/history" element={
            <History 
              sessionHistory={sessionHistory}
              onHistoryUpdate={handleLoadHistory}
              loading={loading}
              error={error}
            />
          } />
          <Route path="/" element={<Navigate to="/tracker" replace />} />
          <Route path="*" element={<Navigate to="/tracker" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default MonopolyTracker; 