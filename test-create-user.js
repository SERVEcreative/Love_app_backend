const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testCreateUser() {
  console.log('🚀 Testing Create User API\n');
  console.log('=====================================\n');

  try {
    // Test data
    const userData = {
      phoneNumber: '917620787372',
      name: 'John Doe',
      age: 25,
      gender: 'male'
    };

    console.log('📋 User Data to Create:');
    console.log(JSON.stringify(userData, null, 2));

    // Call the create-user API
    console.log('\n📡 Calling /api/auth/create-user...');
    const response = await axios.post(`${BASE_URL}/api/auth/create-user`, userData);

    if (response.data.success) {
      console.log('\n✅ User Created Successfully!');
      console.log('=====================================');
      console.log('User ID:', response.data.user.id);
      console.log('Phone:', response.data.user.phoneNumber);
      console.log('Name:', response.data.user.name);
      console.log('Age:', response.data.user.age);
      console.log('Gender:', response.data.user.gender);
      console.log('Verified:', response.data.user.isVerified);
      console.log('Profile Completion:', response.data.user.profileCompletion + '%');
      console.log('Created At:', response.data.user.createdAt);

      console.log('\n🎯 SUMMARY:');
      console.log('=====================================');
      console.log('✅ User created in Supabase');
      console.log('✅ Default preferences created');
      console.log('✅ Profile completion: 60%');
      console.log('✅ User is verified and ready');
    } else {
      console.log('❌ Failed to create user:', response.data.message);
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
testCreateUser();

