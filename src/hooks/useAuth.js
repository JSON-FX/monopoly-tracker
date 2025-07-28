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
      const userData = response.user;
      
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
  }, [checkAuthStatus]);

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @returns {Promise} Login result
   */
  const login = useCallback(async (loginCredentials) => {
    try {
      console.log('AuthProvider - Logging in user');
      setLoading(true);
      
      const apiResponse = await post('/auth/login', loginCredentials);
      console.log('AuthProvider - Login response:', apiResponse);
      
      // Backend returns: { success, message, user, tokens }
      if (apiResponse && apiResponse.success && apiResponse.user && apiResponse.tokens) {
        const { user: loginUser, tokens } = apiResponse;
        
        // Store tokens
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        
        console.log('AuthProvider - Login successful, setting user:', loginUser);
        setUser(loginUser);
        setIsAuthenticated(true);
        
        return { success: true, user: loginUser };
      } else {
        console.error('AuthProvider - Login failed: Invalid response structure');
        return { success: false, error: 'Login failed. Please check your credentials.' };
      }
    } catch (error) {
      console.error('AuthProvider - Login error:', error);
      
      // Better error handling for common scenarios
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message === 'Network Error') {
        errorMessage = 'Unable to connect to server. Please check your connection and try again.';
      } else if (error.message && error.message.includes('401')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message && error.message.includes('404')) {
        errorMessage = 'Account not found. Please check your email or register for a new account.';
      } else if (error.message && error.message.includes('429')) {
        errorMessage = 'Too many login attempts. Please wait a few minutes and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [post]);

  /**
   * Register new user
   * @param {Object} userData - Registration data
   * @returns {Promise} Registration result
   */
  const register = useCallback(async (registerData) => {
    try {
      console.log('AuthProvider - Registering user:', registerData);
      setLoading(true);
      
      const apiResponse = await post('/auth/register', registerData);
      console.log('AuthProvider - Registration response:', apiResponse);
      
      // Backend returns: { success, message, user, tokens }
      if (apiResponse && apiResponse.success && apiResponse.user && apiResponse.tokens) {
        const { user: newUser, tokens } = apiResponse;
        
        // Store tokens
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        
        console.log('AuthProvider - Registration successful, setting user:', newUser);
        setUser(newUser);
        setIsAuthenticated(true);
        
        return { success: true, user: newUser };
      } else {
        console.error('AuthProvider - Registration failed: Invalid response structure');
        return { success: false, error: 'Registration failed. Please try again.' };
      }
    } catch (error) {
      console.error('AuthProvider - Registration error:', error);
      
      // Better error handling for common scenarios
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message === 'Network Error') {
        errorMessage = 'Unable to connect to server. Please check your connection and try again.';
      } else if (error.message && error.message.includes('409')) {
        errorMessage = 'Email address is already registered. Please use a different email or try logging in.';
      } else if (error.message && error.message.includes('400')) {
        errorMessage = 'Invalid registration data. Please check your information and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
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
      
      // Show logout notification
      window.showNotification && window.showNotification(
        '👋 You have been logged out successfully', 
        'info', 
        3000
      );
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