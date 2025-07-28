const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

async function debugLogin() {
  console.log('🔍 Debugging login process...\n');
  
  const testEmail = 'json.alanano@gmail.com';
  const testPassword = '52C!3fa7';
  
  try {
    // Step 1: Check if user exists
    console.log('Step 1: Looking up user by email...');
    const user = await User.findByEmail(testEmail);
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      hasPasswordHash: !!user.passwordHash,
      passwordHashLength: user.passwordHash?.length || 0,
      passwordHashPrefix: user.passwordHash?.substring(0, 20) + '...' || null
    });
    
    // Step 2: Test password comparison
    console.log('\nStep 2: Testing password comparison...');
    console.log('Test password:', testPassword);
    
    if (!user.passwordHash) {
      console.log('❌ No password hash found in user object');
      return;
    }
    
    const isValidPassword = await bcrypt.compare(testPassword, user.passwordHash);
    console.log('Password comparison result:', isValidPassword);
    
    if (isValidPassword) {
      console.log('✅ Password is correct - login should work');
    } else {
      console.log('❌ Password is incorrect');
      
      // Test with different variations
      console.log('\nTesting password variations...');
      const variations = [
        testPassword.toLowerCase(),
        testPassword.toUpperCase(),
        testPassword.trim(),
        '52c!3fa7',
        '52C!3FA7'
      ];
      
      for (const variation of variations) {
        const result = await bcrypt.compare(variation, user.passwordHash);
        console.log(`  '${variation}': ${result ? '✅' : '❌'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error.message);
    console.error(error.stack);
  }
}

debugLogin().then(() => {
  console.log('\n🔍 Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 