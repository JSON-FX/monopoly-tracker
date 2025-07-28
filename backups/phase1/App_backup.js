import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { NotificationProvider } from './components/Common/Notification';
import MonopolyTracker from './components/MonopolyTracker';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AuthWrapper from './components/Auth/AuthWrapper';
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
              <Route path="/" element={
                <ProtectedRoute>
                  <MonopolyTracker />
                </ProtectedRoute>
              } />
              
              {/* Catch all route - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App; 