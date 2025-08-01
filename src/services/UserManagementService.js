class UserManagementService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
  }

  async getAllUsers() {
    const response = await fetch(`${this.baseURL}/users/admin/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return response.json();
  }

  async createUser(userData) {
    const response = await fetch(`${this.baseURL}/users/admin/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create user');
    }

    return response.json();
  }

  async deleteUser(userId) {
    const response = await fetch(`${this.baseURL}/users/admin/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete user');
    }

    return response.json();
  }

  async updateUserRole(userId, isAdmin) {
    const response = await fetch(`${this.baseURL}/users/admin/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({ isAdmin })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update user role');
    }

    return response.json();
  }

  async deactivateUser(userId) {
    const response = await fetch(`${this.baseURL}/users/admin/${userId}/deactivate`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to deactivate user');
    }

    return response.json();
  }
}

export default UserManagementService;