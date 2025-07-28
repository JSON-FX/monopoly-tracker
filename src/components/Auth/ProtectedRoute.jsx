import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Protected Route Component - Protects routes that require authentication
 * Follows Single Responsibility Principle - only handles route protection
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Debug logging
  console.log('ProtectedRoute - Auth State:', { isAuthenticated, loading, user });

  // Show loading while checking authentication
  if (loading) {
    console.log('ProtectedRoute - Showing loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('ProtectedRoute - Not authenticated, redirecting to login...');
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Render protected content
  console.log('ProtectedRoute - Authenticated, rendering children...');
  return children;
};

export default ProtectedRoute; 