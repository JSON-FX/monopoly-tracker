/**
 * Export utilities for session data
 */

/**
 * Export a single session to CSV
 * @param {Object} session - Session data
 */
const exportSingleSession = (session) => {
  const {
    startTime,
    endTime,
    startingCapital,
    finalCapital,
    profit,
    totalBets,
    successfulBets,
    winRate,
    baseBet,
    results = [],
    resultTimestamps = []
  } = session;

  // Create CSV content
  const sessionInfo = [
    ['Session Start', startTime ? new Date(startTime).toLocaleString() : 'N/A'],
    ['Session End', endTime ? new Date(endTime).toLocaleString() : 'Active Session'],
    ['Starting Capital', `₱${startingCapital.toFixed(2)}`],
    ['Final Capital', `₱${finalCapital.toFixed(2)}`],
    ['Session P/L', `₱${(profit || (finalCapital - startingCapital)).toFixed(2)}`],
    ['Base Bet', `₱${baseBet.toFixed(2)}`],
    ['Total Bets', totalBets || 0],
    ['Successful Bets', successfulBets || 0],
    ['Win Rate', `${winRate || 0}%`],
    [''],
    ['Spin #', 'Result', 'Timestamp']
  ];
  
  // Add individual results
  const resultsData = results.map((result, index) => {
    const timestamp = resultTimestamps[index] || new Date().toISOString();
    return [
      index + 1,
      result.toUpperCase(),
      new Date(timestamp).toLocaleString()
    ];
  });
  
  const csvContent = [...sessionInfo, ...resultsData]
    .map(row => row.join(','))
    .join('\n');
  
  // Download CSV file
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `monopoly-session-${new Date(startTime).toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Export all sessions to CSV
 * @param {Array} sessions - Array of session data
 */
const exportAllSessions = (sessions) => {
  if (!sessions || sessions.length === 0) {
    throw new Error('No sessions to export');
  }

  // Create CSV content for all sessions
  const headers = [
    'Session #',
    'Start Date',
    'End Date',
    'Duration',
    'Starting Capital',
    'Final Capital',
    'Profit/Loss',
    'Base Bet',
    'Total Spins',
    'Win Rate',
    'Total Bets',
    'Successful Bets'
  ];

  const sessionsData = sessions.map((session, index) => {
    const {
      startTime,
      endTime,
      startingCapital,
      finalCapital,
      profit,
      totalBets,
      successfulBets,
      winRate,
      baseBet,
      results = []
    } = session;

    const startDate = new Date(startTime).toLocaleDateString();
    const endDate = endTime ? new Date(endTime).toLocaleDateString() : 'Active';
    const duration = calculateDuration(startTime, endTime);
    const actualProfit = profit || (finalCapital - startingCapital);

    return [
      index + 1,
      startDate,
      endDate,
      duration,
      `₱${startingCapital.toFixed(2)}`,
      `₱${finalCapital.toFixed(2)}`,
      `₱${actualProfit.toFixed(2)}`,
      `₱${baseBet.toFixed(2)}`,
      results.length,
      `${winRate || 0}%`,
      totalBets || 0,
      successfulBets || 0
    ];
  });

  const csvContent = [headers, ...sessionsData]
    .map(row => row.join(','))
    .join('\n');

  // Download CSV file
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `monopoly-sessions-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Calculate session duration
 * @param {string} startTime - ISO start time
 * @param {string} endTime - ISO end time (optional)
 * @returns {string} Duration string
 */
const calculateDuration = (startTime, endTime) => {
  if (!startTime) return 'Unknown';
  
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const durationMs = end - start;
  
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Copy session data to clipboard as JSON
 * @param {Object} session - Session data
 */
const copySessionToClipboard = async (session) => {
  try {
    const sessionData = JSON.stringify(session, null, 2);
    await navigator.clipboard.writeText(sessionData);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// Export all functions as named exports
export const exportUtils = {
  exportSingleSession,
  exportAllSessions,
  copySessionToClipboard,
  calculateDuration
};

// Default export for backward compatibility
export default exportUtils; 