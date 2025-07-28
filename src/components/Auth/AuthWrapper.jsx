import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Auth Wrapper Component - Redirects authenticated users away from auth pages
 * Follows Single Responsibility Principle - only handles auth page redirection
 */
const AuthWrapper = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to main app if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Show auth pages for unauthenticated users
  return children;
};

export default AuthWrapper; 