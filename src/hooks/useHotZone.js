import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';

/**
 * Hook for managing hot zone detection and analysis
 * Follows Interface Segregation Principle - provides specific hot zone functionality
 */
export const useHotZone = () => {
  const { post, get } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [zoneConfig, setZoneConfig] = useState(null);

  /**
   * Analyze spin history and get hot zone shift status
   * @param {Array} spinHistory - Array of spin results
   * @returns {Object} Analysis result
   */
  const analyzeShiftStatus = useCallback(async (spinHistory) => {
    if (!spinHistory || !Array.isArray(spinHistory)) {
      setError('Invalid spin history provided');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await post('/zones/shift-status', { spinHistory });

      if (!response.success) {
        throw new Error(response.error || 'Failed to analyze hot zone shifts');
      }

      // Update analysis data state
      setAnalysisData(response);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to analyze hot zone shifts';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [post]);

  /**
   * Get zone configuration information
   * @returns {Object} Zone configuration data
   */
  const getZoneConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await get('/zones/info');

      if (!response.success) {
        throw new Error(response.error || 'Failed to get zone configuration');
      }

      setZoneConfig(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to get zone configuration';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [get]);

  /**
   * Get test analysis (for development)
   * @returns {Object} Test analysis result
   */
  const getTestAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await get('/zones/test');

      if (!response.success) {
        throw new Error(response.error || 'Failed to get test analysis');
      }

      setAnalysisData(response);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to get test analysis';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [get]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear analysis data
   */
  const clearAnalysis = useCallback(() => {
    setAnalysisData(null);
  }, []);

  /**
   * Check if analysis is active (has enough data)
   */
  const isAnalysisActive = analysisData?.active || false;

  /**
   * Get current hot zone status
   */
  const getCurrentStatus = () => {
    if (!analysisData?.active) return null;
    return {
      status: analysisData.data?.status,
      dominantZone: analysisData.data?.dominantZone,
      score: analysisData.data?.score,
      trendDirection: analysisData.data?.trendDirection,
      totalSpins: analysisData.data?.totalSpins
    };
  };

  /**
   * Get minimum spins required for analysis
   */
  const getMinSpinsRequired = () => {
    return analysisData?.requiredSpins || zoneConfig?.minSpinsRequired || 20;
  };

  /**
   * Auto-fetch zone configuration on mount
   */
  useEffect(() => {
    getZoneConfig().catch(err => {
      console.warn('Failed to fetch zone configuration:', err.message);
    });
  }, [getZoneConfig]);

  return {
    // Core functions
    analyzeShiftStatus,
    getZoneConfig,
    getTestAnalysis,
    
    // State management
    clearError,
    clearAnalysis,
    
    // State
    loading,
    error,
    analysisData,
    zoneConfig,
    
    // Computed values
    isAnalysisActive,
    getCurrentStatus,
    getMinSpinsRequired
  };
}; 