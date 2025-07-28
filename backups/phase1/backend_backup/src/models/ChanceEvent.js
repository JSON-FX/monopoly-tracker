const DatabaseConfig = require('../config/database');

class ChanceEvent {
  constructor(data = {}) {
    this.id = data.id || null;
    this.session_id = data.session_id || data.sessionId || null;
    this.user_id = data.user_id || data.userId || null;
    this.game_result_id = data.game_result_id || data.gameResultId || null;
    this.event_type = data.event_type || data.eventType || null;
    this.cash_amount = data.cash_amount || data.cashAmount || null;
    this.multiplier_value = data.multiplier_value || data.multiplierValue || null;
    this.original_bet_amount = data.original_bet_amount || data.originalBetAmount || null;
    this.timestamp = data.timestamp || null;
  }

  static async create(chanceData) {
    
    try {
      const {
        sessionId,
        userId,
        gameResultId,
        eventType,
        cashAmount,
        multiplierValue,
        originalBetAmount
      } = chanceData;

      if (!sessionId || !userId || !gameResultId || !eventType) {
        throw new Error('Session ID, User ID, Game Result ID, and Event Type are required');
      }

      // Validate event type
      if (!['CASH_PRIZE', 'MULTIPLIER'].includes(eventType)) {
        throw new Error('Event type must be CASH_PRIZE or MULTIPLIER');
      }

      const result = await DatabaseConfig.query(`
        INSERT INTO chance_events (
          session_id, 
          user_id, 
          game_result_id, 
          event_type, 
          cash_amount, 
          multiplier_value, 
          original_bet_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [sessionId, userId, gameResultId, eventType, cashAmount, multiplierValue, originalBetAmount]);

      const chanceEventId = result.insertId;

      // Get the created chance event
      const result2 = await DatabaseConfig.query(
        'SELECT * FROM chance_events WHERE id = ?',
        [chanceEventId]
      );

      return new ChanceEvent(result2[0]);
    } catch (error) {
      console.error('ChanceEvent create error:', error);
      throw new Error('Failed to create chance event: ' + error.message);
    }
  }

  static async findById(chanceEventId) {
    try {
      const result = await DatabaseConfig.query(
        'SELECT * FROM chance_events WHERE id = ?',
        [chanceEventId]
      );

      if (!result || result.length === 0) {
        return null;
      }

      return new ChanceEvent(result[0]);
    } catch (error) {
      console.error('ChanceEvent findById error:', error);
      throw new Error('Failed to find chance event: ' + error.message);
    }
  }

  static async findBySessionId(sessionId) {
    try {
      const result = await DatabaseConfig.query(
        'SELECT * FROM chance_events WHERE session_id = ? ORDER BY timestamp ASC',
        [sessionId]
      );

      return result.map(row => new ChanceEvent(row));
    } catch (error) {
      console.error('ChanceEvent findBySessionId error:', error);
      throw new Error('Failed to find chance events: ' + error.message);
    }
  }

  static async findByUserId(userId) {
    try {
      const result = await DatabaseConfig.query(
        'SELECT * FROM chance_events WHERE user_id = ? ORDER BY timestamp DESC',
        [userId]
      );

      return result.map(row => new ChanceEvent(row));
    } catch (error) {
      console.error('ChanceEvent findByUserId error:', error);
      throw new Error('Failed to find chance events: ' + error.message);
    }
  }

  static async deleteById(chanceEventId) {
    try {
      const result = await DatabaseConfig.query('DELETE FROM chance_events WHERE id = ?', [chanceEventId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('ChanceEvent deleteById error:', error);
      throw new Error('Failed to delete chance event: ' + error.message);
    }
  }

  static async deleteBySessionId(sessionId) {
    try {
      const result = await DatabaseConfig.query('DELETE FROM chance_events WHERE session_id = ?', [sessionId]);
      return result.affectedRows;
    } catch (error) {
      console.error('ChanceEvent deleteBySessionId error:', error);
      throw new Error('Failed to delete chance events: ' + error.message);
    }
  }

  static async deleteByUserId(userId) {
    try {
      const result = await DatabaseConfig.query('DELETE FROM chance_events WHERE user_id = ?', [userId]);
      return result.affectedRows;
    } catch (error) {
      console.error('ChanceEvent deleteByUserId error:', error);
      throw new Error('Failed to delete chance events: ' + error.message);
    }
  }

  convertToDbColumn(key) {
    const mapping = {
      sessionId: 'session_id',
      userId: 'user_id',
      gameResultId: 'game_result_id',
      eventType: 'event_type',
      cashAmount: 'cash_amount',
      multiplierValue: 'multiplier_value',
      originalBetAmount: 'original_bet_amount'
    };

    return mapping[key] || key;
  }

  toJSON() {
    return {
      id: this.id,
      sessionId: this.session_id,
      userId: this.user_id,
      gameResultId: this.game_result_id,
      eventType: this.event_type,
      cashAmount: this.cash_amount,
      multiplierValue: this.multiplier_value,
      originalBetAmount: this.original_bet_amount,
      timestamp: this.timestamp
    };
  }
}

module.exports = ChanceEvent; 