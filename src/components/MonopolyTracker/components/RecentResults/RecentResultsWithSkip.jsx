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
const RecentResultsWithSkip = ({ results, resultTimestamps, resultSkipInfo = [], onCopy, onExport }) => {
  const totalSpins = results ? results.length : 0;
  const skippedCount = resultSkipInfo.filter(info => info?.isSkipped).length;
  const actualBetsCount = totalSpins - skippedCount;
  
  // Enhanced copy function that includes skip information
  const handleCopyWithSkip = () => {
    if (!results || results.length === 0) {
      onCopy();
      return;
    }

    // Create enhanced copy text with skip indicators
    const enhancedResults = results.map((result, index) => {
      const skipInfo = resultSkipInfo[index];
      if (skipInfo?.isSkipped) {
        return `${result}✕(${skipInfo.skipReason || 'Skipped'})`;
      }
      return result;
    });

    // Use existing copy function but with enhanced data
    const originalResults = [...results];
    // Temporarily replace results for copy
    const copyText = enhancedResults.join(',');
    navigator.clipboard.writeText(copyText).then(() => {
      console.log('Enhanced results copied to clipboard');
    }).catch(() => {
      // Fallback to original copy function
      onCopy();
    });
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
            title="Copy results with skip indicators"
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
      />
    </div>
  );
};

export default RecentResultsWithSkip; 