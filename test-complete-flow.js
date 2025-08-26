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

async function testCompleteFlow() {
  console.log('🚀 Testing Complete Flow: OTP → Profile Creation\n');
  console.log('================================================\n');

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

    // Step 3: Verify OTP
    console.log('\n2️⃣ Verifying OTP...');
    console.log('🔐 Using OTP:', userOTP);
    
    const verifyOTPResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
      phoneNumber: '+917620787372',
      otp: userOTP
    });

    if (verifyOTPResponse.data.success) {
      console.log('\n✅ OTP Verification Successful!');
      console.log('=====================================');
      console.log('User ID:', verifyOTPResponse.data.user.id);
      console.log('Phone:', verifyOTPResponse.data.user.phoneNumber);
      console.log('Token:', verifyOTPResponse.data.token.substring(0, 50) + '...');

      const { token } = verifyOTPResponse.data;

      // Step 4: Create Profile
      console.log('\n3️⃣ Creating User Profile...');
      const name = await askQuestion('Enter your name: ');
      const age = await askQuestion('Enter your age: ');
      const gender = await askQuestion('Enter your gender (male/female/other/prefer_not_to_say): ');

      const profileData = {
        name: name,
        age: parseInt(age),
        gender: gender
      };

      console.log('\n📋 Profile Data to Create:');
      console.log(JSON.stringify(profileData, null, 2));

      const createProfileResponse = await axios.post(`${BASE_URL}/api/auth/create-profile`, profileData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (createProfileResponse.data.success) {
        console.log('\n✅ Profile Created Successfully!');
        console.log('=====================================');
        console.log('User ID:', createProfileResponse.data.user.id);
        console.log('Name:', createProfileResponse.data.user.name);
        console.log('Age:', createProfileResponse.data.user.age);
        console.log('Gender:', createProfileResponse.data.user.gender);
        console.log('Phone:', createProfileResponse.data.user.phoneNumber);
        console.log('Profile Completion:', createProfileResponse.data.user.profileCompletion + '%');
        console.log('Created At:', createProfileResponse.data.user.createdAt);

        console.log('\n🎯 COMPLETE FLOW SUMMARY:');
        console.log('=====================================');
        console.log('✅ OTP sent via WhatsApp');
        console.log('✅ OTP verified successfully');
        console.log('✅ User created in Supabase');
        console.log('✅ Profile details saved to database');
        console.log('✅ Profile completion: 80%');
        console.log('✅ User is ready for app usage');
      } else {
        console.log('❌ Failed to create profile:', createProfileResponse.data.message);
      }
    } else {
      console.log('❌ OTP verification failed:', verifyOTPResponse.data.message);
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
testCompleteFlow();
