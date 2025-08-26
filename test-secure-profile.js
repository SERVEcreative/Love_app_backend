const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testSecureProfileCreation() {
  console.log('🔐 Testing Secure Profile Creation with Authorization Header\n');
  console.log('============================================================\n');

  try {
    // Mock JWT token (in real scenario, this comes from OTP verification)
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5NzVhODMyYy1lNWIzLTQ4ZjMtYjkzZC1jMDRiOTA1OTU0MmUiLCJwaG9uZU51bWJlciI6IjkxNzYyMDc4NzM3MiIsImlwIjoiOjoxIiwiZGV2aWNlSWQiOiJkN2NlNmJhMzUwZmY0OGM5IiwiaWF0IjoxNzU2MjQwMjU5LCJleHAiOjE3NTYzMjY2NTksImF1ZCI6Im1vYmlsZS1hcHAiLCJpc3MiOiJ3aGF0c2FwcC1vdHAtYXV0aCJ9.xC1m1SruAkanAZWq08sXPbB1sWkQuElMwMLtVAMcasE';

    // Profile data (without token in body)
    const profileData = {
      name: 'John Doe',
      age: 25,
      gender: 'male'
    };

    console.log('📋 Profile Data (Secure - No token in body):');
    console.log(JSON.stringify(profileData, null, 2));

    console.log('\n🔑 Authorization Header:');
    console.log(`Bearer ${mockToken.substring(0, 50)}...`);

    // Make secure API call with Authorization header
    const response = await axios.post(`${BASE_URL}/api/auth/create-profile`, profileData, {
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('\n✅ Secure Profile Creation Successful!');
      console.log('=====================================');
      console.log('User ID:', response.data.user.id);
      console.log('Name:', response.data.user.name);
      console.log('Age:', response.data.user.age);
      console.log('Gender:', response.data.user.gender);
      console.log('Profile Completion:', response.data.user.profileCompletion + '%');

      console.log('\n🎯 Security Benefits:');
      console.log('=====================================');
      console.log('✅ Token sent via Authorization header (standard practice)');
      console.log('✅ No sensitive data in request body');
      console.log('✅ Follows OAuth 2.0 Bearer token pattern');
      console.log('✅ Better security and logging');
      console.log('✅ Easier to implement middleware');
    } else {
      console.log('❌ Failed to create profile:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    
    if (error.response?.data) {
      console.log('\n📋 ERROR RESPONSE:');
      console.log('==========================================');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testSecureProfileCreation();
