const AuthService = require('./src/services/AuthService');

async function debugAuthService() {
  console.log('🔍 Debugging AuthService.login method...\n');
  
  const authService = new AuthService();
  const testEmail = 'json.alanano@gmail.com';
  const testPassword = '52C!3fa7';
  
  try {
    console.log('Calling AuthService.login with:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('');
    
    const result = await authService.login(testEmail, testPassword);
    
    console.log('✅ AuthService.login successful!');
    console.log('Result:', {
      success: result.success,
      hasUser: !!result.user,
      hasTokens: !!result.tokens,
      userEmail: result.user?.email,
      tokensAccessToken: !!result.tokens?.accessToken
    });
    
  } catch (error) {
    console.log('❌ AuthService.login failed!');
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
  }
}

debugAuthService().then(() => {
  console.log('\n🔍 AuthService debug complete');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 