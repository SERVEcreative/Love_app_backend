const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api/auth';
const TEST_PHONE = '+916204691688';

async function testLoginFlow() {
  console.log('🧪 Testing Login Flow (New vs Returning Users)...\n');

  try {
    // Step 1: Send OTP
    console.log('1. Sending OTP...');
    const otpResponse = await axios.post(`${BASE_URL}/send-otp`, {
      phoneNumber: TEST_PHONE
    });
    console.log('✅ OTP sent successfully');

    // Step 2: Get OTP from storage (for testing)
    console.log('\n2. Getting OTP from storage...');
    const otpInfoResponse = await axios.get(`${BASE_URL}/security-status/${TEST_PHONE}`);
    const otp = otpInfoResponse.data.otpInfo?.otp;
    
    if (!otp) {
      console.log('❌ No OTP found in storage. Please check the OTP service.');
      return;
    }
    console.log('✅ OTP retrieved:', otp);

    // Step 3: Verify OTP (First Login)
    console.log('\n3. First Login - Verifying OTP...');
    const verifyResponse = await axios.post(`${BASE_URL}/verify-otp`, {
      phoneNumber: TEST_PHONE,
      otp: otp
    });
    
    const firstLoginData = verifyResponse.data;
    console.log('✅ First login response:');
    console.log('   - Is New User:', firstLoginData.isNewUser);
    console.log('   - Has Complete Profile:', firstLoginData.hasCompleteProfile);
    console.log('   - Requires Profile Completion:', firstLoginData.requiresProfileCompletion);
    console.log('   - Redirect To:', firstLoginData.redirectTo);
    console.log('   - Login Count:', firstLoginData.user.loginCount);

    // Step 4: If profile completion required, create profile
    if (firstLoginData.requiresProfileCompletion) {
      console.log('\n4. Creating Profile...');
      const profileData = {
        name: 'Test User',
        age: 25,
        gender: 'male'
      };

      const profileResponse = await axios.post(`${BASE_URL}/create-profile`, profileData, {
        headers: {
          'Authorization': `Bearer ${firstLoginData.token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Profile created successfully!');
      console.log('   - Profile Completion:', profileResponse.data.user.profileCompletion + '%');
    }

    // Step 5: Second Login (Returning User)
    console.log('\n5. Second Login - Testing Returning User...');
    
    // Send OTP again
    const otpResponse2 = await axios.post(`${BASE_URL}/send-otp`, {
      phoneNumber: TEST_PHONE
    });
    console.log('✅ OTP sent for second login');

    // Get OTP again
    const otpInfoResponse2 = await axios.get(`${BASE_URL}/security-status/${TEST_PHONE}`);
    const otp2 = otpInfoResponse2.data.otpInfo?.otp;
    console.log('✅ OTP retrieved for second login');

    // Verify OTP (Second Login)
    const verifyResponse2 = await axios.post(`${BASE_URL}/verify-otp`, {
      phoneNumber: TEST_PHONE,
      otp: otp2
    });
    
    const secondLoginData = verifyResponse2.data;
    console.log('✅ Second login response:');
    console.log('   - Is New User:', secondLoginData.isNewUser);
    console.log('   - Has Complete Profile:', secondLoginData.hasCompleteProfile);
    console.log('   - Requires Profile Completion:', secondLoginData.requiresProfileCompletion);
    console.log('   - Redirect To:', secondLoginData.redirectTo);
    console.log('   - Login Count:', secondLoginData.user.loginCount);

    // Summary
    console.log('\n📊 Login Flow Summary:');
    console.log('   First Login:');
    console.log('     - New User: ' + firstLoginData.isNewUser);
    console.log('     - Profile Complete: ' + firstLoginData.hasCompleteProfile);
    console.log('     - Redirect: ' + firstLoginData.redirectTo);
    console.log('   Second Login:');
    console.log('     - New User: ' + secondLoginData.isNewUser);
    console.log('     - Profile Complete: ' + secondLoginData.hasCompleteProfile);
    console.log('     - Redirect: ' + secondLoginData.redirectTo);
    console.log('     - Login Count Increased: ' + (secondLoginData.user.loginCount > firstLoginData.user.loginCount));

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n💡 400 Error Details:');
      console.log('Request body validation failed.');
      console.log('Error:', error.response.data);
    }
    
    if (error.response?.status === 401) {
      console.log('\n💡 401 Error Details:');
      console.log('Authentication failed.');
      console.log('Error:', error.response.data);
    }
    
    if (error.response?.status === 429) {
      console.log('\n💡 429 Error Details:');
      console.log('Rate limit exceeded. Wait before retrying.');
      console.log('This is expected behavior - your security is working!');
    }

    if (error.response?.status === 500) {
      console.log('\n💡 500 Error Details:');
      console.log('Server error. Check server logs for details.');
      console.log('Error:', error.response.data);
    }
  }
}

// Run the test
testLoginFlow();
