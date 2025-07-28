const DatabaseConfig = require('../config/database');

class SessionService {
  constructor() {
    this.db = new DatabaseConfig();
  }

  /**
   * Delete all user history (sessions, results, chance events)
   * @param {number} userId - User ID
   */
  async deleteUserHistory(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      // Delete in correct order due to foreign key constraints
      
      // 1. Delete chance events first (references game_results)
      await this.db.query(
        'DELETE FROM chance_events WHERE user_id = ?',
        [userId]
      );

      // 2. Delete game results (references sessions)
      await this.db.query(
        'DELETE FROM game_results WHERE user_id = ?',
        [userId]
      );

      // 3. Delete sessions last
      const result = await this.db.query(
        'DELETE FROM sessions WHERE user_id = ?',
        [userId]
      );

      return {
        success: true,
        deletedSessions: result.affectedRows || 0,
        message: 'All user history deleted successfully'
      };
    } catch (error) {
      console.error('Delete user history error:', error);
      throw new Error('Failed to delete user history: ' + error.message);
    }
  }

  /**
   * Delete a specific session
   * @param {number} userId - User ID
   * @param {number} sessionId - Session ID to delete
   */
  async deleteSession(userId, sessionId) {
    if (!userId || !sessionId) {
      throw new Error('User ID and Session ID are required');
    }

    try {
      // First, verify the session belongs to the user
      const session = await this.db.query(
        'SELECT id, user_id FROM sessions WHERE id = ? AND user_id = ?',
        [sessionId, userId]
      );

      if (!session || session.length === 0) {
        throw new Error('Session not found or access denied');
      }

      // Delete in correct order due to foreign key constraints
      
      // 1. Delete chance events for this session
      await this.db.query(
        'DELETE FROM chance_events WHERE session_id = ? AND user_id = ?',
        [sessionId, userId]
      );

      // 2. Delete game results for this session
      await this.db.query(
        'DELETE FROM game_results WHERE session_id = ? AND user_id = ?',
        [sessionId, userId]
      );

      // 3. Delete the session
      const result = await this.db.query(
        'DELETE FROM sessions WHERE id = ? AND user_id = ?',
        [sessionId, userId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Session not found or already deleted');
      }

      return {
        success: true,
        deletedSessionId: sessionId,
        message: 'Session deleted successfully'
      };
    } catch (error) {
      console.error('Delete session error:', error);
      throw new Error(error.message || 'Failed to delete session');
    }
  }

  /**
   * Get user statistics
   * @param {number} userId - User ID
   */
  async getUserStatistics(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      // Get session statistics
      const sessionStats = await this.db.query(`
        SELECT 
          COUNT(*) as total_sessions,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as completed_sessions,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_sessions,
          AVG(final_capital - starting_capital) as avg_profit,
          SUM(final_capital - starting_capital) as total_profit,
          MAX(final_capital - starting_capital) as best_session,
          MIN(final_capital - starting_capital) as worst_session
        FROM sessions 
        WHERE user_id = ?
      `, [userId]);

      // Get game results statistics
      const resultsStats = await this.db.query(`
        SELECT 
          COUNT(*) as total_spins,
          SUM(CASE WHEN won = 1 THEN 1 ELSE 0 END) as total_wins,
          AVG(CASE WHEN won = 1 THEN 1 ELSE 0 END) * 100 as win_percentage,
          COUNT(DISTINCT result_value) as unique_results
        FROM game_results 
        WHERE user_id = ?
      `, [userId]);

      // Get chance events statistics
      const chanceStats = await this.db.query(`
        SELECT 
          COUNT(*) as total_chance_events,
          SUM(CASE WHEN event_type = 'CASH_PRIZE' THEN 1 ELSE 0 END) as cash_prizes,
          SUM(CASE WHEN event_type = 'MULTIPLIER' THEN 1 ELSE 0 END) as multipliers,
          AVG(cash_amount) as avg_cash_prize
        FROM chance_events 
        WHERE user_id = ?
      `, [userId]);

      return {
        sessions: sessionStats[0] || {},
        results: resultsStats[0] || {},
        chance: chanceStats[0] || {}
      };
    } catch (error) {
      console.error('Get user statistics error:', error);
      throw new Error('Failed to get user statistics: ' + error.message);
    }
  }

  /**
   * Get user sessions
   * @param {number} userId - User ID
   * @param {number} limit - Number of sessions to return (default: 10)
   */
  async getUserSessions(userId, limit = 10) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const sessions = await this.db.query(`
        SELECT 
          id,
          start_time,
          end_time,
          starting_capital,
          final_capital,
          base_bet,
          profit,
          total_bets,
          successful_bets,
          win_rate,
          highest_martingale,
          is_active,
          created_at
        FROM sessions 
        WHERE user_id = ?
        ORDER BY start_time DESC
        LIMIT ?
      `, [userId, limit]);

      return sessions;
    } catch (error) {
      console.error('Get user sessions error:', error);
      throw new Error('Failed to get user sessions: ' + error.message);
    }
  }

  /**
   * Create a new session
   * @param {number} userId - User ID
   * @param {Object} sessionData - Session data
   */
  async createSession(userId, sessionData) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const {
      startingCapital,
      baseBet,
      currentCapital = startingCapital
    } = sessionData;

    if (!startingCapital || !baseBet) {
      throw new Error('Starting capital and base bet are required');
    }

    try {
      // End any existing active sessions for this user
      await this.db.query(
        'UPDATE sessions SET is_active = 0, end_time = CURRENT_TIMESTAMP WHERE user_id = ? AND is_active = 1',
        [userId]
      );

      // Create new session
      const result = await this.db.query(`
        INSERT INTO sessions (
          user_id, 
          start_time, 
          starting_capital, 
          current_capital,
          base_bet, 
          is_active
        ) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, 1)
      `, [userId, startingCapital, currentCapital, baseBet]);

      const sessionId = result.insertId;

      // Return the created session
      const session = await this.db.query(
        'SELECT * FROM sessions WHERE id = ?',
        [sessionId]
      );

      return session[0];
    } catch (error) {
      console.error('Create session error:', error);
      throw new Error('Failed to create session: ' + error.message);
    }
  }
}

module.exports = SessionService; 