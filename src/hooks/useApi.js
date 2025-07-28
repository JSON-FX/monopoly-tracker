import { useState, useCallback } from 'react';
import axios from 'axios';

// Dynamic API URL detection based on current domain
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const currentDomain = window.location.hostname;
    if (currentDomain === 'monopolytracker.local') {
      return 'http://monopolytracker.local:5001/api';
    }
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
};

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: getApiUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * API Hook - Handles HTTP requests with authentication
 * Follows Single Responsibility Principle - only manages API communication
 */
export const useApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add request interceptor for authentication
  apiClient.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor for token refresh
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Check if this is actually an authentication error (401/403) or just a network issue
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            console.log('API - Attempting token refresh...');
            const response = await axios.post(
              `${getApiUrl()}/auth/refresh-token`,
              { refreshToken }
            );

            const { accessToken } = response.data.tokens;
            localStorage.setItem('accessToken', accessToken);
            console.log('API - Token refreshed successfully');

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          console.error('API - Token refresh failed:', refreshError);
          // Only redirect to login if token refresh actually failed
          if (refreshError.response?.status === 401 || refreshError.response?.status === 403) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }

      // For network errors, don't redirect to login immediately
      if (!error.response) {
        console.error('API - Network error:', error.message);
        return Promise.reject(new Error('Network Error: ' + error.message));
      }

      return Promise.reject(error);
    }
  );

  /**
   * Generic API call
   */
  const apiCall = useCallback(async (endpoint, options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient({
        url: endpoint,
        method: options.method || 'GET',
        data: options.body ? JSON.parse(options.body) : undefined, // Parse the stringified body back to object
        headers: options.headers,
        params: options.params,
        ...options
      });

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * GET request
   */
  const get = useCallback((endpoint, params = {}) => {
    return apiCall(endpoint, { method: 'GET', params });
  }, [apiCall]);

  /**
   * POST request
   */
  const post = useCallback((endpoint, data = {}) => {
    return apiCall(endpoint, { method: 'POST', data });
  }, [apiCall]);

  /**
   * PUT request
   */
  const put = useCallback((endpoint, data = {}) => {
    return apiCall(endpoint, { method: 'PUT', data });
  }, [apiCall]);

  /**
   * DELETE request
   */
  const del = useCallback((endpoint) => {
    return apiCall(endpoint, { method: 'DELETE' });
  }, [apiCall]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    apiCall,
    get,
    post,
    put,
    delete: del,
    isLoading,
    error,
    clearError
  };
}; 