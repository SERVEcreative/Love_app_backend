const axios = require('axios');
const readline = require('readline');

const BASE_URL = 'http://localhost:5000';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to get user input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function testOTPVerification() {
  console.log('🚀 Testing OTP Verification with User Creation\n');
  console.log('===============================================\n');

  try {
    // Step 1: Send OTP
    console.log('1️⃣ Sending OTP via WhatsApp...');
    const sendOTPResponse = await axios.post(`${BASE_URL}/api/auth/send-otp`, {
      phoneNumber: '+917620787372'
    });

    if (sendOTPResponse.data.success) {
      console.log('✅ OTP sent successfully!');
      console.log('📱 Message ID:', sendOTPResponse.data.messageId);
    } else {
      console.log('❌ Failed to send OTP:', sendOTPResponse.data.message);
      rl.close();
      return;
    }

    // Step 2: Get OTP from user
    console.log('\n📱 Please check your WhatsApp for the OTP...');
    const userOTP = await askQuestion('Enter the 6-digit OTP you received: ');
    
    if (!userOTP || userOTP.length !== 6) {
      console.log('❌ Invalid OTP format. Please enter a 6-digit number.');
      rl.close();
      return;
    }

    // Step 3: Verify OTP (this will create user in Supabase)
    console.log('\n2️⃣ Verifying OTP and creating user in Supabase...');
    console.log('🔐 Using OTP:', userOTP);
    
    const verifyOTPResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
      phoneNumber: '+917620787372',
      otp: userOTP
    });

    // Step 4: Print the complete response
    console.log('\n📋 COMPLETE OTP VERIFICATION RESPONSE:');
    console.log('==========================================');
    console.log(JSON.stringify(verifyOTPResponse.data, null, 2));

    if (verifyOTPResponse.data.success) {
      console.log('\n✅ OTP Verification & User Creation Successful!');
      console.log('=====================================');
      console.log('User ID:', verifyOTPResponse.data.user.id);
      console.log('Phone:', verifyOTPResponse.data.user.phoneNumber);
      console.log('Verified:', verifyOTPResponse.data.user.isVerified);
      console.log('Profile Completion:', verifyOTPResponse.data.user.profileCompletion + '%');
      console.log('Token:', verifyOTPResponse.data.token.substring(0, 50) + '...');
      
      console.log('\n🎯 WHAT HAPPENED:');
      console.log('=====================================');
      console.log('✅ OTP verified successfully');
      console.log('✅ User created in Supabase database');
      console.log('✅ Default preferences created');
      console.log('✅ JWT token generated');
      console.log('✅ User is ready for profile completion');
    } else {
      console.log('\n❌ OTP verification failed:', verifyOTPResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('\n📋 ERROR RESPONSE:');
      console.log('==========================================');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    rl.close();
  }
}

// Run the test
testOTPVerification();
