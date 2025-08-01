import React, { useState } from 'react';
import AdminRoute from './AdminRoute';
import UserManagement from './UserManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', name: 'User Management', icon: '👥' },
    // Future tabs can be added here
    // { id: 'settings', name: 'System Settings', icon: '⚙️' },
    // { id: 'analytics', name: 'Analytics', icon: '📊' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage users and system settings</p>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </AdminRoute>
  );
};

export default AdminDashboard;