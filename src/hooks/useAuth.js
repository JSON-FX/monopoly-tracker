import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useApi } from './useApi';

// Create authentication context
const AuthContext = createContext(null);

/**
 * Authentication Hook - Manages user authentication state
 * Follows Single Responsibility Principle - only handles authentication logic
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { post, get } = useApi();

  console.log('AuthProvider - Current State:', { user, isAuthenticated, loading });

  /**
   * Check if user is authenticated on app load
   */
  const checkAuthStatus = useCallback(async () => {
    console.log('AuthProvider - Checking auth status...');
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.log('AuthProvider - No token found, setting loading to false');
      setLoading(false);
      return;
    }

    try {
      console.log('AuthProvider - Token found, verifying with backend...');
      const response = await get('/auth/me');
      const userData = response.data.user;
      
      console.log('AuthProvider - User verified:', userData);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('AuthProvider - Auth verification failed:', error);
      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      console.log('AuthProvider - Setting loading to false');
      setLoading(false);
    }
  }, [get]);

  // Check authentication on mount
  useEffect(() => {
    console.log('AuthProvider - useEffect running, calling checkAuthStatus');
    checkAuthStatus();
  }, []);

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @returns {Promise} Login result
   */
  const login = useCallback(async (credentials) => {
    try {
      const response = await post('/auth/login', credentials);
      const { user: userData, accessToken, refreshToken } = response.data;

      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Update state
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  }, [post]);

  /**
   * Register new user
   * @param {Object} userData - Registration data
   * @returns {Promise} Registration result
   */
  const register = useCallback(async (userData) => {
    try {
      const response = await post('/auth/register', userData);
      const { user: newUser, accessToken, refreshToken } = response.data;

      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Update state
      setUser(newUser);
      setIsAuthenticated(true);
      setLoading(false);

      return { success: true, user: newUser };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    }
  }, [post]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint
      await post('/auth/logout');
    } catch (error) {
      // Even if logout endpoint fails, clear local state
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [post]);

  /**
   * Update user profile
   * @param {Object} updates - Profile updates
   * @returns {Promise} Update result
   */
  const updateProfile = useCallback(async (updates) => {
    try {
      const response = await post('/auth/update-profile', updates);
      const updatedUser = response.data.user;
      
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Profile update failed' 
      };
    }
  }, [post]);

  /**
   * Get user's full name
   */
  const getFullName = useCallback(() => {
    if (!user) return '';
    
    return [user.firstName, user.middleName, user.lastName]
      .filter(Boolean)
      .join(' ');
  }, [user]);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateProfile,
    getFullName,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 