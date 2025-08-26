const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api/auth';
const TEST_PHONE = '+916204691688';

async function testProfileFix() {
  console.log('🧪 Testing Profile Creation Fix...\n');

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

    // Step 3: Verify OTP
    console.log('\n3. Verifying OTP...');
    const verifyResponse = await axios.post(`${BASE_URL}/verify-otp`, {
      phoneNumber: TEST_PHONE,
      otp: otp
    });
    
    const token = verifyResponse.data.token;
    console.log('✅ OTP verified, token received');

    // Step 4: Create Profile (same format as your frontend)
    console.log('\n4. Creating profile...');
    const profileData = {
      name: 'Test User',
      age: 25,
      gender: 'male'
    };

    console.log('📤 Sending data:', JSON.stringify(profileData, null, 2));

    const profileResponse = await axios.post(`${BASE_URL}/create-profile`, profileData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Profile created successfully!');
    console.log('📥 Response:', JSON.stringify(profileResponse.data, null, 2));

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
testProfileFix();
