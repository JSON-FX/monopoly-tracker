const DatabaseConfig = require('../config/database');

class Session {
  constructor(data = {}) {
    this.id = data.id || null;
    this.user_id = data.user_id || data.userId || null;
    this.start_time = data.start_time || data.startTime || null;
    this.end_time = data.end_time || data.endTime || null;
    this.starting_capital = data.starting_capital || data.startingCapital || 0;
    this.current_capital = data.current_capital || data.currentCapital || 0;
    this.final_capital = data.final_capital || data.finalCapital || 0;
    this.base_bet = data.base_bet || data.baseBet || 0;
    this.profit = data.profit || 0;
    this.total_bets = data.total_bets || data.totalBets || 0;
    this.successful_bets = data.successful_bets || data.successfulBets || 0;
    this.win_rate = data.win_rate || data.winRate || 0;
    this.highest_martingale = data.highest_martingale || data.highestMartingale || 0;
    this.is_active = data.is_active !== undefined ? data.is_active : (data.isActive !== undefined ? data.isActive : true);
    this.created_at = data.created_at || data.createdAt || null;
    this.updated_at = data.updated_at || data.updatedAt || null;
  }

  static async query(sql, params = []) {
    return await DatabaseConfig.query(sql, params);
  }

  static async create(sessionData) {
    try {
      const {
        userId,
        startingCapital,
        currentCapital,
        baseBet
      } = sessionData;

      if (!userId || !startingCapital || !baseBet) {
        throw new Error('User ID, starting capital, and base bet are required');
      }

      // End any existing active sessions for this user
      await Session.query(
        'UPDATE sessions SET is_active = 0, end_time = CURRENT_TIMESTAMP WHERE user_id = ? AND is_active = 1',
        [userId]
      );

      // Create new session
      const result = await Session.query(`
        INSERT INTO sessions (
          user_id, 
          start_time, 
          starting_capital, 
          current_capital,
          final_capital,
          base_bet, 
          is_active
        ) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?, 1)
      `, [userId, startingCapital, currentCapital || startingCapital, currentCapital || startingCapital, baseBet]);

      const sessionId = result.insertId;

      // Return the created session
      const session = await Session.findById(sessionId);
      return session;
    } catch (error) {
      console.error('Session create error:', error);
      throw new Error('Failed to create session: ' + error.message);
    }
  }

  static async findById(sessionId) {
    try {
      const result = await Session.query(
        'SELECT * FROM sessions WHERE id = ?',
        [sessionId]
      );

      if (!result || result.length === 0) {
        return null;
      }

      return new Session(result[0]);
    } catch (error) {
      console.error('Session findById error:', error);
      throw new Error('Failed to find session: ' + error.message);
    }
  }

  static async findByUserId(userId, includeActive = true) {
    try {
      let query = 'SELECT * FROM sessions WHERE user_id = ?';
      const params = [userId];

      if (!includeActive) {
        query += ' AND is_active = 0';
      }

      query += ' ORDER BY start_time DESC';

      const result = await Session.query(query, params);
      return result.map(row => new Session(row));
    } catch (error) {
      console.error('Session findByUserId error:', error);
      throw new Error('Failed to find sessions: ' + error.message);
    }
  }

  static async findActiveByUserId(userId) {
    try {
      const result = await Session.query(
        'SELECT * FROM sessions WHERE user_id = ? AND is_active = 1 ORDER BY start_time DESC LIMIT 1',
        [userId]
      );

      if (!result || result.length === 0) {
        return null;
      }

      return new Session(result[0]);
    } catch (error) {
      console.error('Session findActiveByUserId error:', error);
      throw new Error('Failed to find active session: ' + error.message);
    }
  }

  async update(updateData) {
    try {
      if (!this.id) {
        throw new Error('Cannot update session without ID');
      }

      const updates = [];
      const values = [];

      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        const dbKey = this.convertToDbColumn(key);
        if (dbKey && updateData[key] !== undefined) {
          updates.push(`${dbKey} = ?`);
          values.push(updateData[key]);
        }
      });

      if (updates.length === 0) {
        throw new Error('No valid update data provided');
      }

      // Add updated_at timestamp
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(this.id);

      const query = `UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`;
      await Session.query(query, values);

      // Update local instance
      Object.assign(this, updateData);
      
      return this;
    } catch (error) {
      console.error('Session update error:', error);
      throw new Error('Failed to update session: ' + error.message);
    }
  }

  async end(endData = {}) {
    try {
      if (!this.id) {
        throw new Error('Cannot end session without ID');
      }

      const {
        finalCapital = this.current_capital,
        profit = finalCapital - this.starting_capital,
        totalBets = this.total_bets,
        successfulBets = this.successful_bets,
        winRate = totalBets > 0 ? (successfulBets / totalBets * 100) : 0,
        highestMartingale = this.highest_martingale
      } = endData;

      await Session.query(`
        UPDATE sessions SET 
          end_time = CURRENT_TIMESTAMP,
          final_capital = ?,
          profit = ?,
          total_bets = ?,
          successful_bets = ?,
          win_rate = ?,
          highest_martingale = ?,
          is_active = 0,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [finalCapital, profit, totalBets, successfulBets, winRate, highestMartingale, this.id]);

      // Update local instance
      this.end_time = new Date().toISOString();
      this.final_capital = finalCapital;
      this.profit = profit;
      this.total_bets = totalBets;
      this.successful_bets = successfulBets;
      this.win_rate = winRate;
      this.highest_martingale = highestMartingale;
      this.is_active = false;

      return this;
    } catch (error) {
      console.error('Session end error:', error);
      throw new Error('Failed to end session: ' + error.message);
    }
  }

  static async deleteById(sessionId) {
    try {
      // Delete in correct order due to foreign key constraints
      await Session.query('DELETE FROM chance_events WHERE session_id = ?', [sessionId]);
      await Session.query('DELETE FROM game_results WHERE session_id = ?', [sessionId]);
      const result = await Session.query('DELETE FROM sessions WHERE id = ?', [sessionId]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Session deleteById error:', error);
      throw new Error('Failed to delete session: ' + error.message);
    }
  }

  convertToDbColumn(key) {
    const mapping = {
      userId: 'user_id',
      startTime: 'start_time',
      endTime: 'end_time',
      startingCapital: 'starting_capital',
      currentCapital: 'current_capital',
      finalCapital: 'final_capital',
      baseBet: 'base_bet',
      totalBets: 'total_bets',
      successfulBets: 'successful_bets',
      winRate: 'win_rate',
      highestMartingale: 'highest_martingale',
      isActive: 'is_active',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };

    return mapping[key] || key;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.user_id,
      startTime: this.start_time,
      endTime: this.end_time,
      startingCapital: this.starting_capital,
      currentCapital: this.current_capital,
      finalCapital: this.final_capital,
      baseBet: this.base_bet,
      profit: this.profit,
      totalBets: this.total_bets,
      successfulBets: this.successful_bets,
      winRate: this.win_rate,
      highestMartingale: this.highest_martingale,
      isActive: this.is_active,
      createdAt: this.created_at,
      updatedAt: this.updated_at
    };
  }
}

module.exports = Session; 