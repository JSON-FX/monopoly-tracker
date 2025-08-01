import React, { useState, useEffect } from 'react';
import UserManagementService from '../../services/UserManagementService';
import ConfirmDialog from '../Common/ConfirmDialog';
import Notification from '../Common/Notification';
import CreateUserModal from './CreateUserModal';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const userService = new UserManagementService();

  useEffect(() => {
    loadUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getAllUsers();
      if (response.success) {
        setUsers(response.users);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (user) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.firstName} ${user.lastName}? This will permanently remove their account and all associated session data. This action cannot be undone.`,
      onConfirm: () => confirmDeleteUser(user.id),
      onCancel: () => setConfirmDialog({ isOpen: false }),
      type: 'danger'
    });
  };

  const confirmDeleteUser = async (userId) => {
    try {
      const response = await userService.deleteUser(userId);
      if (response.success) {
        setNotification({
          type: 'success',
          message: response.message
        });
        loadUsers(); // Refresh the list
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message
      });
    }
    setConfirmDialog({ isOpen: false });
  };

  const handleToggleAdmin = async (user) => {
    try {
      const response = await userService.updateUserRole(user.id, !user.isAdmin);
      if (response.success) {
        setNotification({
          type: 'success',
          message: response.message
        });
        loadUsers(); // Refresh the list
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message
      });
    }
  };

  const handleDeactivateUser = async (user) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Deactivate User',
      message: `Are you sure you want to deactivate ${user.firstName} ${user.lastName}? They will no longer be able to log in to their account.`,
      onConfirm: () => confirmDeactivateUser(user.id),
      onCancel: () => setConfirmDialog({ isOpen: false }),
      confirmText: 'Deactivate',
      type: 'warning'
    });
  };

  const confirmDeactivateUser = async (userId) => {
    try {
      const response = await userService.deactivateUser(userId);
      if (response.success) {
        setNotification({
          type: 'success',
          message: response.message
        });
        loadUsers(); // Refresh the list
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message
      });
    }
    setConfirmDialog({ isOpen: false });
  };

  const handleCreateUser = async (userData) => {
    try {
      const response = await userService.createUser(userData);
      if (response.success) {
        setNotification({
          type: 'success',
          message: response.message
        });
        loadUsers(); // Refresh the list
        setShowCreateModal(false);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg text-gray-600">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="text-red-800">
            <strong>Error:</strong> {error}
          </div>
        </div>
        <button
          onClick={loadUsers}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage users and their permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          Create New User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.initials}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.initials}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isAdmin 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleToggleAdmin(user)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                      {user.isActive && (
                        <button
                          onClick={() => handleDeactivateUser(user)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Deactivate
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel}
        type={confirmDialog.type}
      />

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
        />
      )}

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default UserManagement;