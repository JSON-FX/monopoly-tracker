const DatabaseConfig = require('../config/database');

class GameResult {
  constructor(data = {}) {
    this.id = data.id || null;
    this.session_id = data.session_id || data.sessionId || null;
    this.user_id = data.user_id || data.userId || null;
    this.result_value = data.result_value || data.resultValue || null;
    this.bet_amount = data.bet_amount || data.betAmount || null;
    this.won = data.won !== undefined ? data.won : null;
    this.capital_after = data.capital_after || data.capitalAfter || null;
    this.martingale_level = data.martingale_level || data.martingaleLevel || 0;
    this.is_multiplier = data.is_multiplier !== undefined ? data.is_multiplier : (data.isMultiplier !== undefined ? data.isMultiplier : false);
    this.timestamp = data.timestamp || null;
  }

  static async query(sql, params = []) {
    return await DatabaseConfig.query(sql, params);
  }

  static async create(resultData) {
    try {
      const {
        sessionId,
        userId,
        resultValue,
        betAmount,
        won,
        capitalAfter,
        martingaleLevel = 0,
        isMultiplier = false
      } = resultData;

      if (!sessionId || !userId || !resultValue) {
        throw new Error('Session ID, User ID, and result value are required');
      }

      const result = await GameResult.query(`
        INSERT INTO game_results (
          session_id, 
          user_id, 
          result_value, 
          bet_amount, 
          won, 
          capital_after, 
          martingale_level, 
          is_multiplier,
          timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [sessionId, userId, resultValue, betAmount, won, capitalAfter, martingaleLevel, isMultiplier]);

      const gameResultId = result.insertId;

      // Return the created game result
      const gameResult = await GameResult.findById(gameResultId);
      return gameResult;
    } catch (error) {
      console.error('GameResult create error:', error);
      throw new Error('Failed to create game result: ' + error.message);
    }
  }

  static async findById(gameResultId) {
    try {
      const result = await GameResult.query(
        'SELECT * FROM game_results WHERE id = ?',
        [gameResultId]
      );

      if (!result || result.length === 0) {
        return null;
      }

      return new GameResult(result[0]);
    } catch (error) {
      console.error('GameResult findById error:', error);
      throw new Error('Failed to find game result: ' + error.message);
    }
  }

  static async findBySessionId(sessionId) {
    try {
      const result = await GameResult.query(
        'SELECT * FROM game_results WHERE session_id = ? ORDER BY timestamp ASC',
        [sessionId]
      );

      return result.map(row => new GameResult(row));
    } catch (error) {
      console.error('GameResult findBySessionId error:', error);
      throw new Error('Failed to find game results: ' + error.message);
    }
  }

  static async findByUserId(userId, limit = 50) {
    try {
      const result = await GameResult.query(
        'SELECT * FROM game_results WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
        [userId, limit]
      );

      return result.map(row => new GameResult(row));
    } catch (error) {
      console.error('GameResult findByUserId error:', error);
      throw new Error('Failed to find game results: ' + error.message);
    }
  }

  static async deleteById(gameResultId) {
    try {
      // Delete chance events first if any
      await GameResult.query('DELETE FROM chance_events WHERE game_result_id = ?', [gameResultId]);
      
      // Delete the game result
      const result = await GameResult.query('DELETE FROM game_results WHERE id = ?', [gameResultId]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error('GameResult deleteById error:', error);
      throw new Error('Failed to delete game result: ' + error.message);
    }
  }

  static async deleteBySessionId(sessionId) {
    try {
      // Delete chance events first
      await GameResult.query('DELETE FROM chance_events WHERE session_id = ?', [sessionId]);
      
      // Delete game results
      const result = await GameResult.query('DELETE FROM game_results WHERE session_id = ?', [sessionId]);

      return result.affectedRows;
    } catch (error) {
      console.error('GameResult deleteBySessionId error:', error);
      throw new Error('Failed to delete game results: ' + error.message);
    }
  }

  static async deleteByUserId(userId) {
    try {
      // Delete chance events first
      await GameResult.query('DELETE FROM chance_events WHERE user_id = ?', [userId]);
      
      // Delete game results
      const result = await GameResult.query('DELETE FROM game_results WHERE user_id = ?', [userId]);

      return result.affectedRows;
    } catch (error) {
      console.error('GameResult deleteByUserId error:', error);
      throw new Error('Failed to delete game results: ' + error.message);
    }
  }

  toJSON() {
    return {
      id: this.id,
      sessionId: this.session_id,
      userId: this.user_id,
      resultValue: this.result_value,
      betAmount: this.bet_amount,
      won: this.won,
      capitalAfter: this.capital_after,
      martingaleLevel: this.martingale_level,
      isMultiplier: this.is_multiplier,
      timestamp: this.timestamp
    };
  }
}

module.exports = GameResult; 