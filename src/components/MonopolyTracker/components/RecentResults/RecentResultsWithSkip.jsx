import React from 'react';
import ResultsGridWithSkip from './ResultsGridWithSkip';

/**
 * Complete RecentResults component with header and controls that supports skip indicators
 * @param {Array} results - Array of game results
 * @param {Array} resultTimestamps - Array of result timestamps
 * @param {Array} resultSkipInfo - Array of skip information for each result
 * @param {Function} onCopy - Function called when copy button is clicked
 * @param {Function} onExport - Function called when export button is clicked
 * @returns {JSX.Element} RecentResults component
 */
const RecentResultsWithSkip = ({ results, resultTimestamps, resultSkipInfo = [], conditionStrategy, onCopy, onExport }) => {
  const totalSpins = results ? results.length : 0;
  const skippedCount = resultSkipInfo.filter(info => info?.isSkipped).length;
  const actualBetsCount = totalSpins - skippedCount;
  
  // Simple copy function that copies just the results - ULTRA SAFE VERSION
  const handleCopyWithSkip = () => {
    // Immediate safety check
    if (!results || results.length === 0) {
      if (onCopy && typeof onCopy === 'function') {
        onCopy();
      }
      return;
    }

    try {
      // Copy just the results without skip information - format: latest to oldest
      // Results array has oldest first, need to reverse for latest to oldest
      const copyText = [...results].reverse().join(', ');
      
      // Ultra-defensive clipboard check
      const hasClipboardAPI = (
        typeof window !== 'undefined' &&
        typeof navigator !== 'undefined' &&
        navigator &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      );
      
      if (hasClipboardAPI) {
        // Use modern clipboard API
        navigator.clipboard.writeText(copyText)
          .then(() => {
            console.log('Results copied to clipboard');
            alert(`✅ Copied ${results.length} results to clipboard!`);
          })
          .catch((clipboardError) => {
            console.warn('Modern clipboard API failed:', clipboardError);
            executeManualCopy(copyText);
          });
      } else {
        // Direct fallback
        executeManualCopy(copyText);
      }
      
    } catch (mainError) {
      console.error('Copy function failed entirely:', mainError);
      // Final safety net - call original function
      if (onCopy && typeof onCopy === 'function') {
        onCopy();
      }
    }
  };

  // Separate function for manual copy to avoid repetition
  const executeManualCopy = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      textArea.setAttribute('readonly', '');
      textArea.setAttribute('aria-hidden', 'true');
      textArea.tabIndex = -1;
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // For mobile devices
      if (textArea.setSelectionRange) {
        textArea.setSelectionRange(0, 99999);
      }
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log('Results copied to clipboard (manual method)');
        alert(`✅ Copied ${results.length} results to clipboard (manual method)!`);
      } else {
        throw new Error('execCommand failed');
      }
    } catch (manualError) {
      console.error('Manual copy failed:', manualError);
      // Final fallback - use original copy function
      if (onCopy && typeof onCopy === 'function') {
        onCopy();
      }
    }
  };

  // Enhanced export function that includes skip information
  const handleExportWithSkip = () => {
    if (!results || results.length === 0) {
      onExport();
      return;
    }

    // Create CSV data with skip information
    const csvHeaders = ['Index', 'Result', 'Timestamp', 'Is_Skipped', 'Skip_Reason'];
    const csvRows = results.map((result, index) => {
      const timestamp = resultTimestamps[index] || '';
      const skipInfo = resultSkipInfo[index];
      const isSkipped = skipInfo?.isSkipped ? 'Yes' : 'No';
      const skipReason = skipInfo?.skipReason || '';
      
      return [
        index + 1,
        result,
        timestamp,
        isSkipped,
        skipReason
      ];
    });

    // Convert to CSV string
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => 
        // Escape commas and quotes in fields
        `"${String(field).replace(/"/g, '""')}"`
      ).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `monopoly-results-with-skip-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Fallback to original export function
      onExport();
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          Recent Results <span className="text-sm font-normal text-gray-500">(Latest → Oldest)</span>
          <span className="ml-2 bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
            {totalSpins} spins
          </span>
          {skippedCount > 0 && (
            <span className="ml-2 bg-orange-100 text-orange-800 text-sm font-medium px-2 py-1 rounded">
              {skippedCount} skipped
            </span>
          )}
          {actualBetsCount !== totalSpins && (
            <span className="ml-2 bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">
              {actualBetsCount} bets
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleCopyWithSkip}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            title="Copy results (latest to oldest)"
          >
            📋 Copy
          </button>
          <button
            onClick={handleExportWithSkip}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            title="Export CSV with skip information"
          >
            📊 CSV
          </button>
        </div>
      </div>
      
      <ResultsGridWithSkip 
        results={results} 
        resultTimestamps={resultTimestamps}
        resultSkipInfo={resultSkipInfo}
        conditionStrategy={conditionStrategy}
      />
    </div>
  );
};

export default RecentResultsWithSkip; 