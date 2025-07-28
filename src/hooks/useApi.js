import { useState, useCallback } from 'react';
import axios from 'axios';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
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

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const response = await axios.post(
              `${process.env.REACT_APP_API_URL || 'http://monopolytracker.local:5001/api'}/auth/refresh-token`,
              { refreshToken }
            );

            const { accessToken } = response.data.tokens;
            localStorage.setItem('accessToken', accessToken);

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
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