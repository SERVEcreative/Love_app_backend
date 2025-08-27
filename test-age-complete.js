const axios = require('axios');

// Test data with age
const testData = {
  age: 28,
  name: "John Doe",
  gender: "male",
  bio: "Test bio",
  location: "New York"
};

// Mock JWT token (replace with a real token from your OTP verification)
const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiODc5ZTBmYy03NmE4LTQwNzgtYjRjOS1mNDljOTA4YjkyYjAiLCJwaG9uZSI6Iis5MTk5OTk5OTk5OSIsImlhdCI6MTczNTI5NzIyOSwiZXhwIjoxNzM1MzgzNjI5fQ.example";

async function testCompleteAgeFlow() {
  try {
    console.log('🧪 Testing complete age flow...');
    console.log('📝 Test data:', JSON.stringify(testData, null, 2));
    
    // Step 1: Update profile with age
    console.log('\n1️⃣ Updating profile with age...');
    const updateResponse = await axios.put('http://localhost:5000/api/users/profile', testData, {
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Profile update successful!');
    console.log('📋 Update response:', JSON.stringify(updateResponse.data, null, 2));
    
    // Step 2: Fetch profile to verify age is stored
    console.log('\n2️⃣ Fetching profile to verify age...');
    const fetchResponse = await axios.get('http://localhost:5000/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${mockToken}`
      }
    });
    
    console.log('✅ Profile fetch successful!');
    console.log('📋 Fetch response:', JSON.stringify(fetchResponse.data, null, 2));
    
    // Step 3: Verify age is in the response
    const user = fetchResponse.data.user;
    if (user.age === testData.age) {
      console.log('✅ Age verification successful! Age is correctly stored and retrieved.');
    } else {
      console.log('❌ Age verification failed! Expected:', testData.age, 'Got:', user.age);
    }
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testCompleteAgeFlow();
