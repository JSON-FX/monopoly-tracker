/**
 * Export utilities for session data
 * Follows Single Responsibility Principle - only handles data export functionality
 */

/**
 * Utility function to get chance event details for a specific result index
 * @param {Array} chanceEvents - Array of chance events from session data
 * @param {Array} results - Array of all results
 * @param {Array} resultTimestamps - Array of result timestamps
 * @param {number} resultIndex - Index of the result we want chance details for
 * @returns {Object|null} Chance event details or null if not found
 */
const getChanceEventForResult = (chanceEvents, results, resultTimestamps, resultIndex) => {
  if (!chanceEvents || !results || !resultTimestamps || results[resultIndex] !== 'chance') {
    return null;
  }

  // Get the timestamp of the result we're looking for
  const resultTimestamp = resultTimestamps[resultIndex];
  if (!resultTimestamp) return null;

  // Find the chance event that matches this timestamp (within a reasonable window)
  const matchingEvent = chanceEvents.find(event => {
    if (!event.timestamp) return false;
    
    const eventTime = new Date(event.timestamp).getTime();
    const resultTime = new Date(resultTimestamp).getTime();
    
    // Allow up to 5 seconds difference to account for processing delays
    return Math.abs(eventTime - resultTime) <= 5000;
  });

  return matchingEvent || null;
};

/**
 * Get enhanced display text for results including chance event details
 * @param {string} result - The result value
 * @param {Array} chanceEvents - Array of chance events
 * @param {Array} results - Array of all results
 * @param {Array} resultTimestamps - Array of result timestamps
 * @param {number} index - Index of the result
 * @returns {string} Enhanced result display text
 */
const getEnhancedResultText = (result, chanceEvents, results, resultTimestamps, index) => {
  if (result !== 'chance') {
    return result;
  }

  const chanceEvent = getChanceEventForResult(chanceEvents, results, resultTimestamps, index);
  if (chanceEvent) {
    if (chanceEvent.event_type === 'CASH_PRIZE') {
      return `chance-cash-₱${chanceEvent.cash_amount || 0}`;
    } else if (chanceEvent.event_type === 'MULTIPLIER') {
      return `chance-multiplier-${chanceEvent.multiplier_value || 1}x`;
    }
  }
  
  return 'chance';
};

/**
 * Export session data to CSV file
 * @param {Object} session - Session object to export
 */
export const exportSessionToCSV = (session) => {
  try {
    if (!session) {
      showNotification('No session data to export', 'error');
      return;
    }

    const {
      startTime,
      endTime,
      startingCapital,
      finalCapital,
      profit,
      totalBets,
      successfulBets,
      winRate,
      highestMartingale,
      duration,
      results,
      chanceEvents,
      resultTimestamps
    } = session;

    // Safe conversion for all values
    const safeStartingCapital = Number(startingCapital) || 0;
    const safeFinalCapital = Number(finalCapital) || 0;
    const safeProfit = Number(profit) || 0;
    const safeHighestMartingale = Number(highestMartingale) || 0;
    const safeResults = results || [];
    const safeChanceEvents = chanceEvents || [];
    const safeResultTimestamps = resultTimestamps || [];
    const safeTotalBets = totalBets || 0;
    const safeSuccessfulBets = successfulBets || 0;
    const safeWinRate = winRate || 0;
    const safeDuration = duration || 'Unknown';

    // Create CSV header
    const csvHeaders = [
      'Session ID',
      'Start Time',
      'End Time',
      'Duration',
      'Starting Capital',
      'Final Capital',
      'Profit/Loss',
      'Total Spins',
      'Successful Bets',
      'Win Rate (%)',
      'Highest Martingale',
      'Spin Results',
      'Chance Events Count'
    ];

    // Enhanced spin results with chance event details
    const enhancedResults = safeResults.map((result, index) => 
      getEnhancedResultText(result, safeChanceEvents, safeResults, safeResultTimestamps, index)
    );

    // Create CSV row
    const csvRow = [
      session.id || 'Unknown',
      startTime ? new Date(startTime).toLocaleString() : 'Unknown',
      endTime ? new Date(endTime).toLocaleString() : 'Unknown',
      safeDuration,
      safeStartingCapital.toFixed(2),
      safeFinalCapital.toFixed(2),
      safeProfit.toFixed(2),
      safeTotalBets,
      safeSuccessfulBets,
      safeWinRate,
      safeHighestMartingale.toFixed(2),
      enhancedResults.join(';'), // Use semicolon to separate spin results
      safeChanceEvents.length
    ];

    // Create detailed spin data with chance event information
    const spinHeaders = ['Spin Number', 'Result', 'Chance Event Type', 'Chance Value', 'Timestamp'];
    const spinData = safeResults.map((result, index) => {
      const chanceEvent = result === 'chance' ? 
        getChanceEventForResult(safeChanceEvents, safeResults, safeResultTimestamps, index) : null;
      
      return [
        index + 1,
        result || 'unknown',
        chanceEvent ? chanceEvent.event_type : '',
        chanceEvent ? 
          (chanceEvent.event_type === 'CASH_PRIZE' ? 
            `₱${chanceEvent.cash_amount || 0}` : 
            `${chanceEvent.multiplier_value || 1}x (bet: ₱${chanceEvent.original_bet_amount || 0})`) : '',
        safeResultTimestamps[index] ? new Date(safeResultTimestamps[index]).toLocaleString() : `Spin ${index + 1}`
      ];
    });

    // Combine all data
    const csvContent = [
      // Session summary
      csvHeaders.join(','),
      csvRow.map(field => `"${field}"`).join(','),
      '', // Empty row for separation
      // Detailed spin data
      spinHeaders.join(','),
      ...spinData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const fileName = `monopoly-session-${new Date(startTime).toISOString().split('T')[0]}-${session.id}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show success message
    showNotification('CSV file downloaded successfully!', 'success');
  } catch (error) {
    console.error('Error exporting CSV:', error);
    showNotification('Failed to export CSV file', 'error');
  }
};

/**
 * Fallback method to copy text to clipboard using legacy approach
 * @param {string} text - Text to copy
 * @returns {boolean} Success status
 */
const fallbackCopyToClipboard = (text) => {
  try {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make it invisible
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    
    // Add to DOM
    document.body.appendChild(textArea);
    
    // Select and copy
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    
    // Clean up
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Fallback copy failed:', error);
    return false;
  }
};

/**
 * Copy session data as raw text to clipboard
 * @param {Object} session - Session object to copy
 */
export const copySessionRawData = async (session) => {
  try {
    if (!session) {
      showNotification('No session data to copy', 'error');
      return;
    }

    const {
      startTime,
      endTime,
      startingCapital,
      finalCapital,
      profit,
      totalBets,
      successfulBets,
      winRate,
      highestMartingale,
      duration,
      results,
      chanceEvents,
      resultTimestamps
    } = session;

    // Safe conversion for all values
    const safeStartingCapital = Number(startingCapital) || 0;
    const safeFinalCapital = Number(finalCapital) || 0;
    const safeProfit = Number(profit) || 0;
    const safeHighestMartingale = Number(highestMartingale) || 0;
    const safeResults = results || [];
    const safeChanceEvents = chanceEvents || [];
    const safeResultTimestamps = resultTimestamps || [];
    const safeTotalBets = totalBets || 0;
    const safeSuccessfulBets = successfulBets || 0;
    const safeWinRate = winRate || 0;
    const safeDuration = duration || 'Unknown';

    // Enhanced spin results with chance event details
    const enhancedSpinResults = safeResults.map((result, index) => {
      if (result !== 'chance') {
        return `${index + 1}. ${result || 'unknown'}`;
      }
      
      const chanceEvent = getChanceEventForResult(safeChanceEvents, safeResults, safeResultTimestamps, index);
      if (chanceEvent) {
        if (chanceEvent.event_type === 'CASH_PRIZE') {
          return `${index + 1}. chance - Cash Prize: ₱${chanceEvent.cash_amount || 0}`;
        } else if (chanceEvent.event_type === 'MULTIPLIER') {
          return `${index + 1}. chance - Multiplier: ${chanceEvent.multiplier_value || 1}x (Original bet: ₱${chanceEvent.original_bet_amount || 0})`;
        }
      }
      
      return `${index + 1}. chance`;
    });

    // Format raw data
    const rawData = `
MONOPOLY LIVE SESSION DATA
========================

Session ID: ${session.id || 'Unknown'}
Start Time: ${startTime ? new Date(startTime).toLocaleString() : 'Unknown'}
End Time: ${endTime ? new Date(endTime).toLocaleString() : 'Unknown'}
Duration: ${safeDuration}

FINANCIAL SUMMARY
================
Starting Capital: ₱${safeStartingCapital.toFixed(2)}
Final Capital: ₱${safeFinalCapital.toFixed(2)}
Profit/Loss: ₱${safeProfit.toFixed(2)}

BETTING STATISTICS
=================
Total Spins: ${safeTotalBets}
Successful Bets: ${safeSuccessfulBets}
Win Rate: ${safeWinRate}%
Highest Martingale: ₱${safeHighestMartingale.toFixed(2)}

CHANCE EVENTS
============
Total Chance Events: ${safeChanceEvents.length}
${safeChanceEvents.length > 0 ? generateChanceEventsBreakdown(safeChanceEvents) : 'No chance events recorded'}

SPIN RESULTS (with Chance Details)
=================================
${enhancedSpinResults.join('\n')}

RESULTS BREAKDOWN
================
${generateResultsBreakdown(safeResults)}

Raw Results Array: [${safeResults.join(', ')}]
    `.trim();

    // Try modern clipboard API first
    let copySuccessful = false;
    
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(rawData);
        copySuccessful = true;
      } catch (clipboardError) {
        console.warn('Modern clipboard API failed, trying fallback:', clipboardError);
        copySuccessful = false;
      }
    }
    
    // If modern API failed or not available, use fallback
    if (!copySuccessful) {
      copySuccessful = fallbackCopyToClipboard(rawData);
    }
    
    if (copySuccessful) {
      showNotification('Session data copied to clipboard!', 'success');
    } else {
      // If both methods fail, show the data in a modal or alert
      console.log('Clipboard copy failed, showing data:', rawData);
      showNotification('Could not copy to clipboard. Data logged to console.', 'error');
      
      // As a last resort, try to show data in an alert or create a modal
      if (window.confirm('Could not copy to clipboard. Would you like to see the data in a new window?')) {
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`<pre style="font-family: monospace; padding: 20px; white-space: pre-wrap;">${rawData}</pre>`);
          newWindow.document.title = 'Session Data';
        }
      }
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    showNotification('Failed to copy data to clipboard', 'error');
  }
};

/**
 * Generate chance events breakdown for raw data
 * @param {Array} chanceEvents - Array of chance events
 * @returns {string} Formatted breakdown string
 */
const generateChanceEventsBreakdown = (chanceEvents) => {
  const cashPrizes = chanceEvents.filter(e => e.event_type === 'CASH_PRIZE');
  const multipliers = chanceEvents.filter(e => e.event_type === 'MULTIPLIER');
  
  const totalCashWon = cashPrizes.reduce((sum, e) => sum + (Number(e.cash_amount) || 0), 0);
  const averageMultiplier = multipliers.length > 0 ? 
    (multipliers.reduce((sum, e) => sum + (Number(e.multiplier_value) || 0), 0) / multipliers.length).toFixed(2) : '0';

  return `Cash Prizes: ${cashPrizes.length} (Total: ₱${totalCashWon.toFixed(2)})
Multipliers: ${multipliers.length} (Average: ${averageMultiplier}x)`;
};

/**
 * Generate results breakdown for raw data
 * @param {Array} results - Array of spin results
 * @returns {string} Formatted breakdown string
 */
const generateResultsBreakdown = (results) => {
  const safeResults = results || [];
  const segments = ['10', '5', '4', '2', 'chance'];
  const breakdown = segments.map(segment => {
    const count = safeResults.filter(r => r === segment).length;
    const percentage = safeResults.length > 0 ? ((count / safeResults.length) * 100).toFixed(1) : '0.0';
    return `${segment === 'chance' ? 'Chance' : segment}: ${count} (${percentage}%)`;
  });
  
  return breakdown.join('\n');
};

/**
 * Show notification to user
 * @param {string} message - Message to show
 * @param {string} type - Type of notification (success, error)
 */
const showNotification = (message, type = 'info') => {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-[9999] transition-all ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  }`;
  notification.textContent = message;
  
  // Add to DOM
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
};

/**
 * Export all sessions to a single CSV file
 * @param {Array} sessionHistory - Array of all sessions
 */
export const exportAllSessionsToCSV = (sessionHistory) => {
  try {
    if (!sessionHistory || sessionHistory.length === 0) {
      showNotification('No sessions to export', 'error');
      return;
    }

    // Create combined CSV with all sessions
    const csvHeaders = [
      'Session ID',
      'Start Time',
      'End Time',
      'Duration',
      'Starting Capital',
      'Final Capital',
      'Profit/Loss',
      'Total Spins',
      'Successful Bets',
      'Win Rate (%)',
      'Highest Martingale',
      'Total Results Count'
    ];

    const csvRows = sessionHistory.map(session => {
      const safeSession = session || {};
      const safeStartingCapital = Number(safeSession.startingCapital) || 0;
      const safeFinalCapital = Number(safeSession.finalCapital) || 0;
      const safeProfit = Number(safeSession.profit) || 0;
      const safeHighestMartingale = Number(safeSession.highestMartingale) || 0;
      const safeResults = safeSession.results || [];
      
      return [
        safeSession.id || 'Unknown',
        safeSession.startTime ? new Date(safeSession.startTime).toLocaleString() : 'Unknown',
        safeSession.endTime ? new Date(safeSession.endTime).toLocaleString() : 'Unknown',
        safeSession.duration || 'Unknown',
        safeStartingCapital.toFixed(2),
        safeFinalCapital.toFixed(2),
        safeProfit.toFixed(2),
        safeSession.totalBets || 0,
        safeSession.successfulBets || 0,
        safeSession.winRate || 0,
        safeHighestMartingale.toFixed(2),
        safeResults.length
      ];
    });

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const fileName = `monopoly-all-sessions-${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(`Exported ${sessionHistory.length} sessions to CSV!`, 'success');
  } catch (error) {
    console.error('Error exporting all sessions:', error);
    showNotification('Failed to export sessions', 'error');
  }
}; 