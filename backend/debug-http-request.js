const axios = require('axios');

async function debugHttpRequest() {
  console.log('🔍 Debugging HTTP login request...\n');
  
  const loginData = {
    email: 'json.alanano@gmail.com',
    password: '52C!3fa7'
  };
  
  try {
    console.log('Making HTTP POST request to /api/auth/login');
    console.log('Request data:', loginData);
    console.log('');
    
    const response = await axios.post('http://localhost:5001/api/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ HTTP request successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', {
      success: response.data.success,
      message: response.data.message,
      hasUser: !!response.data.user,
      hasTokens: !!response.data.tokens,
      userEmail: response.data.user?.email
    });
    
  } catch (error) {
    console.log('❌ HTTP request failed!');
    console.log('Error status:', error.response?.status || 'No status');
    console.log('Error message:', error.response?.data?.error || error.message);
    console.log('Error details:', error.response?.data?.details || 'No details');
    console.log('Full error response:', error.response?.data || 'No response data');
  }
}

debugHttpRequest().then(() => {
  console.log('\n🔍 HTTP debug complete');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
}); 