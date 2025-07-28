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
      session.id,
      new Date(startTime).toLocaleString(),
      new Date(endTime).toLocaleString(),
      duration,
      startingCapital.toFixed(2),
      finalCapital.toFixed(2),
      profit.toFixed(2),
      totalBets,
      successfulBets,
      winRate,
      highestMartingale.toFixed(2),
      results.join(';') // Use semicolon to separate spin results
    ];

    // Create detailed spin data
    const spinHeaders = ['Spin Number', 'Result', 'Timestamp'];
    const spinData = results.map((result, index) => [
      index + 1,
      result,
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

    // Format raw data
    const rawData = `
MONOPOLY LIVE SESSION DATA
========================

Session ID: ${session.id}
Start Time: ${new Date(startTime).toLocaleString()}
End Time: ${new Date(endTime).toLocaleString()}
Duration: ${duration}

FINANCIAL SUMMARY
================
Starting Capital: ₱${startingCapital.toFixed(2)}
Final Capital: ₱${finalCapital.toFixed(2)}
Profit/Loss: ₱${profit.toFixed(2)}

BETTING STATISTICS
=================
Total Spins: ${totalBets}
Successful Bets: ${successfulBets}
Win Rate: ${winRate}%
Highest Martingale: ₱${highestMartingale.toFixed(2)}

SPIN RESULTS
===========
${results.map((result, index) => `${index + 1}. ${result}`).join('\n')}

RESULTS BREAKDOWN
================
${generateResultsBreakdown(results)}

Raw Results Array: [${results.join(', ')}]
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
  const segments = ['10', '5', '4', '2', 'chance'];
  const breakdown = segments.map(segment => {
    const count = results.filter(r => r === segment).length;
    const percentage = results.length > 0 ? ((count / results.length) * 100).toFixed(1) : '0.0';
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

    const csvRows = sessionHistory.map(session => [
      session.id,
      new Date(session.startTime).toLocaleString(),
      new Date(session.endTime).toLocaleString(),
      session.duration,
      session.startingCapital.toFixed(2),
      session.finalCapital.toFixed(2),
      session.profit.toFixed(2),
      session.totalBets,
      session.successfulBets,
      session.winRate,
      session.highestMartingale.toFixed(2),
      session.results.length
    ]);

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