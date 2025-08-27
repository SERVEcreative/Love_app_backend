const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';

// Test with a mock token to see what happens
const generateMockToken = () => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    userId: 'test-user-id-123',
    phoneNumber: '+916204691688',
    ip: '127.0.0.1',
    deviceId: 'test-device-123',
    iat: Math.floor(Date.now() / 1000)
  })).toString('base64');

  // This is a fake signature - in real scenario, you'd need the actual JWT_SECRET
  const signature = Buffer.from('fake-signature-for-testing').toString('base64');

  return `${header}.${payload}.${signature}`;
};

async function testProfileDebug() {
  console.log('🔍 Testing Profile Endpoint Debug...\n');

  try {
    // ========================================
    // TEST 1: WITHOUT TOKEN
    // ========================================
    console.log('📋 TEST 1: Request without token...');
    console.log('====================================');

    try {
      const noTokenResponse = await axios.get(`${BASE_URL}/api/users/profile`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Request without token - SUCCESS!');
      console.log('Status:', noTokenResponse.status);

    } catch (error) {
      console.log('❌ Request without token - FAILED (Expected)');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data?.message || error.message);
    }

    // ========================================
    // TEST 2: WITH MOCK TOKEN
    // ========================================
    console.log('\n📋 TEST 2: Request with mock token...');
    console.log('=====================================');

    const mockToken = generateMockToken();
    console.log('🔑 Generated mock token:', mockToken.substring(0, 50) + '...');

    try {
      const mockTokenResponse = await axios.get(`${BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Request with mock token - SUCCESS!');
      console.log('Status:', mockTokenResponse.status);
      console.log('Response:', JSON.stringify(mockTokenResponse.data, null, 2));

    } catch (error) {
      console.log('❌ Request with mock token - FAILED (Expected)');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data?.message || error.message);
    }

    // ========================================
    // TEST 3: CHECK SERVER STATUS
    // ========================================
    console.log('\n📋 TEST 3: Check server status...');
    console.log('==================================');

    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`, {
        timeout: 5000
      });

      console.log('✅ Server is running');
      console.log('Status:', healthResponse.status);

    } catch (error) {
      console.log('❌ Server health check failed');
      console.log('Error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('💡 Server might not be running on port 5000');
      }
    }

    // ========================================
    // TEST 4: CHECK ROUTE REGISTRATION
    // ========================================
    console.log('\n📋 TEST 4: Check route registration...');
    console.log('=====================================');

    try {
      const routesResponse = await axios.get(`${BASE_URL}/api/users/nonexistent`, {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Route exists but endpoint not found');
      console.log('Status:', routesResponse.status);

    } catch (error) {
      console.log('❌ Route test failed');
      console.log('Status:', error.response?.status);
      
      if (error.response?.status === 404) {
        console.log('✅ Routes are registered (404 for nonexistent endpoint)');
      } else {
        console.log('❌ Routes might not be properly registered');
      }
    }

    console.log('\n🎯 Debug Summary:');
    console.log('=================');
    console.log('1. If TEST 1 returns 401 - Authentication middleware is working');
    console.log('2. If TEST 2 returns 401 - JWT verification is working');
    console.log('3. If TEST 3 fails - Server might not be running');
    console.log('4. If TEST 4 returns 404 - Routes are registered');
    console.log('5. The issue might be with the userService.getUserById method');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testProfileDebug();
