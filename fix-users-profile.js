const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_PHONE = '+916204691688';

async function fixUsersProfile() {
  console.log('🔧 Fixing Users Profile Endpoint...\n');

  try {
    // ========================================
    // STEP 1: GET A VALID JWT TOKEN
    // ========================================
    console.log('🔑 STEP 1: Getting JWT Token...');
    
    // Send OTP
    const otpResponse = await axios.post(`${BASE_URL}/api/auth/send-otp`, {
      phoneNumber: TEST_PHONE
    });
    console.log('✅ OTP sent successfully');

    // Get OTP from storage
    const otpInfoResponse = await axios.get(`${BASE_URL}/api/auth/security-status/${TEST_PHONE}`);
    const otp = otpInfoResponse.data.otpInfo?.otp;
    
    if (!otp) {
      console.log('❌ No OTP found in storage. Please check the OTP service.');
      return;
    }
    console.log('✅ OTP retrieved:', otp);

    // Verify OTP to get token
    const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
      phoneNumber: TEST_PHONE,
      otp: otp
    });
    
    const token = verifyResponse.data.token;
    console.log('✅ JWT Token obtained:', token.substring(0, 50) + '...');

    // ========================================
    // STEP 2: TEST CURRENT /api/users/profile
    // ========================================
    console.log('\n\n👤 STEP 2: Testing Current /api/users/profile...');
    console.log('================================================');
    
    try {
      const usersProfileResponse = await axios.get(`${BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ /api/users/profile - WORKING!');
      console.log('Status:', usersProfileResponse.status);
      console.log('Response Structure:');
      console.log('- success:', usersProfileResponse.data.success);
      console.log('- user.id:', usersProfileResponse.data.user?.id);
      console.log('- user.name:', usersProfileResponse.data.user?.name);
      console.log('- user.phone_number:', usersProfileResponse.data.user?.phone_number);
      
    } catch (error) {
      console.log('❌ /api/users/profile - FAILED!');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data?.message || error.message);
      
      if (error.response?.status === 401) {
        console.log('\n💡 Issue: Authentication failed');
        console.log('This suggests the authenticateUser middleware is not working properly');
      }
    }

    // ========================================
    // STEP 3: COMPARE WITH /api/auth/profile
    // ========================================
    console.log('\n\n📋 STEP 3: Comparing with /api/auth/profile...');
    console.log('===============================================');
    
    try {
      const authProfileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ /api/auth/profile - WORKING!');
      console.log('Status:', authProfileResponse.status);
      console.log('Response Structure:');
      console.log('- success:', authProfileResponse.data.success);
      console.log('- profile.id:', authProfileResponse.data.profile?.id);
      console.log('- profile.fullName:', authProfileResponse.data.profile?.fullName);
      console.log('- profile.phoneNumber:', authProfileResponse.data.profile?.phoneNumber);
      
    } catch (error) {
      console.log('❌ /api/auth/profile - FAILED!');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data?.message || error.message);
    }

    console.log('\n🎯 Analysis:');
    console.log('============');
    console.log('1. /api/auth/profile uses authenticateToken middleware');
    console.log('2. /api/users/profile uses authenticateUser middleware');
    console.log('3. Both should work with the same JWT token');
    console.log('4. If one fails, there might be a middleware issue');

    console.log('\n💡 Recommendation:');
    console.log('==================');
    console.log('Use /api/auth/profile for your Flutter app because:');
    console.log('- It provides complete profile data');
    console.log('- It\'s designed for ProfileCardWidget');
    console.log('- It includes calculated fields (age, lastSeen, etc.)');
    console.log('- It has better error handling');

    console.log('\n🔧 If you need to fix /api/users/profile:');
    console.log('1. Replace authenticateUser with authenticateToken');
    console.log('2. Update the response format to match /api/auth/profile');
    console.log('3. Add the missing profile fields');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
fixUsersProfile();
