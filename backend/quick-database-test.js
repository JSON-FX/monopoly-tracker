/**
 * Quick Database Test
 * Simple test to verify database operations work
 */

const User = require('./src/models/User');
const Session = require('./src/models/Session');
const GameResult = require('./src/models/GameResult');

(async () => {
  console.log('🚀 Quick Database Test Starting...');
  
  try {
    // Test 1: Create a test user
    console.log('\n1️⃣ Testing User Creation...');
    const testUser = await User.create({
      firstName: 'Quick',
      middleName: 'Test',
      lastName: 'User',
      email: `quicktest.${Date.now()}@example.com`,
      password: 'testpassword123'
    });
    console.log('✅ User created:', testUser.email, 'ID:', testUser.id);

    // Test 2: Create a session
    console.log('\n2️⃣ Testing Session Creation...');
    const session = await Session.create({
      userId: testUser.id,
      startingCapital: 1000.00,
      baseBet: 10.00,
      currentCapital: 1000.00
    });
    console.log('✅ Session created:', session.id, 'for user', testUser.id);

    // Test 3: Add game results
    console.log('\n3️⃣ Testing Game Result Creation...');
    const result1 = await GameResult.create({
      sessionId: session.id,
      userId: testUser.id,
      resultValue: '10',
      betAmount: 10.00,
      won: true,
      capitalAfter: 1010.00
    });
    console.log('✅ Game result created:', result1.id, 'Result:', result1.result_value);

    const result2 = await GameResult.create({
      sessionId: session.id,
      userId: testUser.id,
      resultValue: '1',
      betAmount: 10.00,
      won: false,
      capitalAfter: 1000.00
    });
    console.log('✅ Game result created:', result2.id, 'Result:', result2.result_value);

    // Test 4: Update session
    console.log('\n4️⃣ Testing Session Update...');
    await session.update({
      currentCapital: 1000.00,
      totalBets: 2,
      successfulBets: 1,
      winRate: 50.0
    });
    console.log('✅ Session updated');

    // Test 5: End session
    console.log('\n5️⃣ Testing Session End...');
    await session.end({
      finalCapital: 1000.00,
      profit: 0.00,
      totalBets: 2,
      successfulBets: 1,
      winRate: 50.0,
      highestMartingale: 10.00
    });
    console.log('✅ Session ended');

    // Test 6: Retrieve data
    console.log('\n6️⃣ Testing Data Retrieval...');
    const userSessions = await Session.findByUserId(testUser.id);
    console.log('✅ Found', userSessions.length, 'sessions for user');

    const sessionResults = await GameResult.findBySessionId(session.id);
    console.log('✅ Found', sessionResults.length, 'results for session');

    // Test 7: Test history deletion
    console.log('\n7️⃣ Testing Session Deletion...');
    const deleted = await Session.deleteById(session.id);
    console.log('✅ Session deleted:', deleted);

    // Verify deletion
    const deletedSession = await Session.findById(session.id);
    const remainingResults = await GameResult.findBySessionId(session.id);
    console.log('✅ Session exists after deletion:', !!deletedSession);
    console.log('✅ Results remaining after deletion:', remainingResults.length);

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    const userModel = await User.findById(testUser.id);
    if (userModel) {
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'db_monopoly_tracker'
      });
      
      await connection.execute('DELETE FROM users WHERE id = ?', [testUser.id]);
      await connection.end();
      console.log('✅ Test user cleaned up');
    }

    console.log('\n🎉 All tests passed! Database integration is working correctly.');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
})(); 