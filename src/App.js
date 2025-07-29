import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { NotificationProvider } from './components/Common/Notification';
import { FloatingCardProvider } from './contexts/FloatingCardContext';
import Navigation from './components/Navigation/Navigation';
import LiveTracker from './components/LiveTracker/LiveTracker';
import History from './components/MonopolyTracker/components/History';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AuthWrapper from './components/Auth/AuthWrapper';
import useSessionData from './hooks/useSessionData';

import './index.css';

/**
 * Main App Component - Handles routing and authentication
 * Includes authentication provider and route protection
 */
function App() {
  console.log('App component rendering...');
  
  return (
    <AuthProvider>
      <NotificationProvider>
        <FloatingCardProvider>
          <Router>
            <div className="App">
              <Routes>
              {/* Public routes - redirect to main app if already authenticated */}
              <Route path="/login" element={
                <AuthWrapper>
                  <LoginForm />
                </AuthWrapper>
              } />
              <Route path="/register" element={
                <AuthWrapper>
                  <RegisterForm />
                </AuthWrapper>
              } />
              
              {/* Protected routes - require authentication */}
              <Route path="/tracker" element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50">
                    <div className="max-w-7xl mx-auto p-4">
                      <Navigation />
                      <LiveTracker />
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <HistoryWrapper />
                </ProtectedRoute>
              } />
              
              {/* Default route - redirect to tracker */}
              <Route path="/" element={<Navigate to="/tracker" replace />} />
              
              {/* Catch all route - redirect to tracker */}
              <Route path="*" element={<Navigate to="/tracker" replace />} />
              </Routes>
            </div>
          </Router>
        </FloatingCardProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

/**
 * Wrapper component for History page to provide necessary context
 */
function HistoryWrapper() {
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
        <History 
          sessionHistory={sessionHistory}
          onHistoryUpdate={handleLoadHistory}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}

export default App; 