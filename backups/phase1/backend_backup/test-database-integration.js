/**
 * Comprehensive Database Integration Test
 * Tests the complete flow of session management, results, and history deletion
 */

const mysql = require('mysql2/promise');
const Session = require('./src/models/Session');
const GameResult = require('./src/models/GameResult');
const ChanceEvent = require('./src/models/ChanceEvent');
const User = require('./src/models/User');

class DatabaseIntegrationTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      details: []
    };
  }

  async initializeDatabase() {
    // Create database connection
    this.connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'db_monopoly_tracker'
    });
  }

  async query(sql, params = []) {
    const [rows] = await this.connection.execute(sql, params);
    return rows;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    if (type === 'error') {
      this.testResults.failed++;
    } else if (type === 'success') {
      this.testResults.passed++;
    }
    
    this.testResults.details.push({ timestamp, message, type });
  }

  async createTestUser() {
    try {
      // Create a test user
      const testUser = await User.create({
        firstName: 'Test',
        middleName: 'Database',
        lastName: 'User',
        email: `test.db.${Date.now()}@example.com`,
        password: 'testpassword123'
      });

      this.log(`Test user created: ${testUser.email}`, 'success');
      return testUser;
    } catch (error) {
      this.log(`Failed to create test user: ${error.message}`, 'error');
      throw error;
    }
  }

  async testSessionCreation(userId) {
    try {
      this.log('Testing session creation...');
      
      const sessionData = {
        userId: userId,
        startingCapital: 1000.00,
        baseBet: 10.00,
        currentCapital: 1000.00
      };

      const session = await Session.create(sessionData);
      
      if (!session.id || session.user_id !== userId) {
        throw new Error('Session creation failed - invalid data returned');
      }

      // Verify session exists in database
      const foundSession = await Session.findById(session.id);
      if (!foundSession) {
        throw new Error('Session not found in database after creation');
      }

      this.log(`Session created successfully: ID ${session.id}`, 'success');
      return session;
    } catch (error) {
      this.log(`Session creation failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testSessionRetrieval(userId, sessionId) {
    try {
      this.log('Testing session retrieval...');
      
      // Test find by ID
      const sessionById = await Session.findById(sessionId);
      if (!sessionById || sessionById.id !== sessionId) {
        throw new Error('Session findById failed');
      }

      // Test find by user ID
      const userSessions = await Session.findByUserId(userId);
      if (!userSessions.length || !userSessions.find(s => s.id === sessionId)) {
        throw new Error('Session findByUserId failed');
      }

      // Test find active session
      const activeSession = await Session.findActiveByUserId(userId);
      if (!activeSession || activeSession.id !== sessionId) {
        throw new Error('Session findActiveByUserId failed');
      }

      this.log('Session retrieval tests passed', 'success');
      return true;
    } catch (error) {
      this.log(`Session retrieval failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testGameResults(sessionId, userId) {
    try {
      this.log('Testing game result creation...');
      
      const testResults = [
        { resultValue: '10', betAmount: 10.00, won: true, capitalAfter: 1010.00 },
        { resultValue: '1', betAmount: 10.00, won: false, capitalAfter: 1000.00 },
        { resultValue: '2', betAmount: 20.00, won: false, capitalAfter: 980.00 },
        { resultValue: 'CHANCE', betAmount: 40.00, won: true, capitalAfter: 1020.00 }
      ];

      const createdResults = [];
      
      for (const resultData of testResults) {
        const gameResult = await GameResult.create({
          sessionId: sessionId,
          userId: userId,
          ...resultData
        });
        
        if (!gameResult.id) {
          throw new Error('GameResult creation failed');
        }
        
        createdResults.push(gameResult);
        this.log(`Game result created: ${resultData.resultValue} -> ${gameResult.id}`, 'success');
      }

      // Test retrieval
      const sessionResults = await GameResult.findBySessionId(sessionId);
      if (sessionResults.length !== testResults.length) {
        throw new Error(`Expected ${testResults.length} results, got ${sessionResults.length}`);
      }

      const userResults = await GameResult.findByUserId(userId);
      if (userResults.length < testResults.length) {
        throw new Error('GameResult findByUserId returned insufficient results');
      }

      this.log('Game result tests passed', 'success');
      return createdResults;
    } catch (error) {
      this.log(`Game result tests failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testChanceEvents(sessionId, userId, gameResultId) {
    try {
      this.log('Testing chance event creation...');
      
      const chanceEventData = {
        sessionId: sessionId,
        userId: userId,
        gameResultId: gameResultId,
        eventType: 'CASH_PRIZE',
        cashAmount: 50.00,
        originalBetAmount: 40.00
      };

      const chanceEvent = await ChanceEvent.create(chanceEventData);
      
      if (!chanceEvent.id) {
        throw new Error('ChanceEvent creation failed');
      }

      // Test retrieval
      const sessionEvents = await ChanceEvent.findBySessionId(sessionId);
      if (!sessionEvents.length || !sessionEvents.find(e => e.id === chanceEvent.id)) {
        throw new Error('ChanceEvent not found in session');
      }

      this.log(`Chance event created: ${chanceEvent.event_type} -> ${chanceEvent.id}`, 'success');
      return chanceEvent;
    } catch (error) {
      this.log(`Chance event tests failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testSessionUpdate(sessionId) {
    try {
      this.log('Testing session update...');
      
      const session = await Session.findById(sessionId);
      const updateData = {
        currentCapital: 950.00,
        totalBets: 4,
        successfulBets: 2,
        winRate: 50.0,
        profit: -50.00
      };

      await session.update(updateData);

      // Verify update
      const updatedSession = await Session.findById(sessionId);
      if (updatedSession.current_capital !== 950.00 || updatedSession.total_bets !== 4) {
        throw new Error('Session update failed - data not updated');
      }

      this.log('Session update test passed', 'success');
      return true;
    } catch (error) {
      this.log(`Session update failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testSessionEnd(sessionId) {
    try {
      this.log('Testing session end...');
      
      const session = await Session.findById(sessionId);
      const endData = {
        finalCapital: 950.00,
        profit: -50.00,
        totalBets: 4,
        successfulBets: 2,
        winRate: 50.0,
        highestMartingale: 40.00
      };

      await session.end(endData);

      // Verify session is ended
      const endedSession = await Session.findById(sessionId);
      if (endedSession.is_active !== 0 || !endedSession.end_time) { // MySQL returns 0/1 for boolean
        throw new Error('Session end failed - session still active');
      }

      this.log('Session end test passed', 'success');
      return true;
    } catch (error) {
      this.log(`Session end failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testHistoryDeletion(userId, sessionId) {
    try {
      this.log('Testing individual session deletion...');
      
      // Delete specific session
      const success = await Session.deleteById(sessionId);
      if (!success) {
        throw new Error('Session deletion returned false');
      }

      // Verify session is deleted
      const deletedSession = await Session.findById(sessionId);
      if (deletedSession) {
        throw new Error('Session still exists after deletion');
      }

      // Verify related data is deleted
      const remainingResults = await GameResult.findBySessionId(sessionId);
      const remainingEvents = await ChanceEvent.findBySessionId(sessionId);
      
      if (remainingResults.length > 0 || remainingEvents.length > 0) {
        throw new Error('Related data not deleted with session');
      }

      this.log('Individual session deletion test passed', 'success');
      return true;
    } catch (error) {
      this.log(`Session deletion failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testBulkHistoryClear(userId) {
    try {
      this.log('Testing bulk history clear...');
      
      // Create another session to test bulk deletion
      const session = await Session.create({
        userId: userId,
        startingCapital: 500.00,
        baseBet: 5.00,
        currentCapital: 500.00
      });

      // Add some results
      await GameResult.create({
        sessionId: session.id,
        userId: userId,
        resultValue: '5',
        betAmount: 5.00,
        won: false,
        capitalAfter: 495.00
      });

      // Delete all user history using the direct query method
      await this.query('DELETE FROM chance_events WHERE user_id = ?', [userId]);
      await this.query('DELETE FROM game_results WHERE user_id = ?', [userId]);
      await this.query('DELETE FROM sessions WHERE user_id = ?', [userId]);

      // Verify everything is deleted
      const userSessions = await Session.findByUserId(userId);
      const userResults = await GameResult.findByUserId(userId);
      const userEvents = await ChanceEvent.findByUserId(userId);

      if (userSessions.length > 0 || userResults.length > 0 || userEvents.length > 0) {
        throw new Error('Bulk deletion incomplete');
      }

      this.log('Bulk history clear test passed', 'success');
      return true;
    } catch (error) {
      this.log(`Bulk history clear failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testDatabaseStructure() {
    try {
      this.log('Testing database structure...');
      
      // Test tables exist
      const tables = ['users', 'sessions', 'game_results', 'chance_events'];
      
      for (const table of tables) {
        const result = await this.query(`SHOW TABLES LIKE '${table}'`);
        if (!result.length) {
          throw new Error(`Table ${table} does not exist`);
        }
        this.log(`Table ${table} exists`, 'success');
      }

      // Test foreign key constraints
      const constraints = await this.query(`
        SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME 
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE REFERENCED_TABLE_SCHEMA = 'db_monopoly_tracker'
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `);

      if (constraints.length < 3) { // Should have at least 3 foreign keys
        throw new Error('Insufficient foreign key constraints');
      }

      this.log('Database structure test passed', 'success');
      return true;
    } catch (error) {
      this.log(`Database structure test failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async cleanup(userId) {
    try {
      this.log('Cleaning up test data...');
      
      // Delete all test data
      await this.query('DELETE FROM chance_events WHERE user_id = ?', [userId]);
      await this.query('DELETE FROM game_results WHERE user_id = ?', [userId]);
      await this.query('DELETE FROM sessions WHERE user_id = ?', [userId]);
      await this.query('DELETE FROM users WHERE id = ?', [userId]);
      
      this.log('Test data cleaned up', 'success');
    } catch (error) {
      this.log(`Cleanup failed: ${error.message}`, 'error');
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive Database Integration Test');
    this.log('================================================');

    let testUser = null;
    let session = null;
    let gameResults = [];
    let chanceEvent = null;

    try {
      // Initialize database connection
      await this.initializeDatabase();

      // Test 1: Database Structure
      await this.testDatabaseStructure();

      // Test 2: User Creation
      testUser = await this.createTestUser();

      // Test 3: Session Creation
      session = await this.testSessionCreation(testUser.id);

      // Test 4: Session Retrieval
      await this.testSessionRetrieval(testUser.id, session.id);

      // Test 5: Game Results
      gameResults = await this.testGameResults(session.id, testUser.id);

      // Test 6: Chance Events (using CHANCE result)
      const chanceResult = gameResults.find(r => r.result_value === 'CHANCE');
      if (chanceResult) {
        chanceEvent = await this.testChanceEvents(session.id, testUser.id, chanceResult.id);
      }

      // Test 7: Session Update
      await this.testSessionUpdate(session.id);

      // Test 8: Session End
      await this.testSessionEnd(session.id);

      // Test 9: Individual Session Deletion
      await this.testHistoryDeletion(testUser.id, session.id);

      // Test 10: Bulk History Clear
      await this.testBulkHistoryClear(testUser.id);

      this.log('================================================');
      this.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY!', 'success');
      
    } catch (error) {
      this.log('================================================');
      this.log(`💥 TEST SUITE FAILED: ${error.message}`, 'error');
    } finally {
      // Cleanup
      if (testUser) {
        await this.cleanup(testUser.id);
      }
      
      // Close database connection
      if (this.connection) {
        await this.connection.end();
      }
    }

    // Print summary
    this.log('================================================');
    this.log(`📊 TEST SUMMARY:`);
    this.log(`✅ Passed: ${this.testResults.passed}`);
    this.log(`❌ Failed: ${this.testResults.failed}`);
    this.log(`📋 Total: ${this.testResults.passed + this.testResults.failed}`);
    
    if (this.testResults.failed === 0) {
      this.log('🏆 ALL TESTS PASSED - DATABASE INTEGRATION WORKING PERFECTLY!', 'success');
    } else {
      this.log('⚠️  SOME TESTS FAILED - CHECK THE DETAILS ABOVE', 'error');
    }

    return this.testResults.failed === 0;
  }
}

// Run the tests
(async () => {
  const tester = new DatabaseIntegrationTest();
  const success = await tester.runAllTests();
  process.exit(success ? 0 : 1);
})(); 