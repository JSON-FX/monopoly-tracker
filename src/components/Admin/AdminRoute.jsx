import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">
          <strong>Access Denied:</strong> You must be logged in to access this page.
        </div>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="text-yellow-800">
          <strong>Access Restricted:</strong> This page is only available to administrators.
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;