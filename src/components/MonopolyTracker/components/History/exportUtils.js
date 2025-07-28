/**
 * Export utilities for session data
 * Follows Single Responsibility Principle - only handles data export functionality
 */

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
      results
    } = session;

    // Safe conversion for all values
    const safeStartingCapital = Number(startingCapital) || 0;
    const safeFinalCapital = Number(finalCapital) || 0;
    const safeProfit = Number(profit) || 0;
    const safeHighestMartingale = Number(highestMartingale) || 0;
    const safeResults = results || [];
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
      'Spin Results'
    ];

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
      safeResults.join(';') // Use semicolon to separate spin results
    ];

    // Create detailed spin data
    const spinHeaders = ['Spin Number', 'Result', 'Timestamp'];
    const spinData = safeResults.map((result, index) => [
      index + 1,
      result || 'unknown',
      `Spin ${index + 1}` // Could be enhanced with actual timestamps if available
    ]);

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
      results
    } = session;

    // Safe conversion for all values
    const safeStartingCapital = Number(startingCapital) || 0;
    const safeFinalCapital = Number(finalCapital) || 0;
    const safeProfit = Number(profit) || 0;
    const safeHighestMartingale = Number(highestMartingale) || 0;
    const safeResults = results || [];
    const safeTotalBets = totalBets || 0;
    const safeSuccessfulBets = successfulBets || 0;
    const safeWinRate = winRate || 0;
    const safeDuration = duration || 'Unknown';

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

SPIN RESULTS
===========
${safeResults.map((result, index) => `${index + 1}. ${result || 'unknown'}`).join('\n')}

RESULTS BREAKDOWN
================
${generateResultsBreakdown(safeResults)}

Raw Results Array: [${safeResults.join(', ')}]
    `.trim();

    // Copy to clipboard
    await navigator.clipboard.writeText(rawData);
    showNotification('Session data copied to clipboard!', 'success');
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    showNotification('Failed to copy data to clipboard', 'error');
  }
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