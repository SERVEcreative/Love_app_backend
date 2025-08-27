const axios = require('axios');

// Test data
const testData = {
  age: 25,
  name: "Test User",
  gender: "male"
};

// Mock JWT token (replace with a real token from your OTP verification)
const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiODc5ZTBmYy03NmE4LTQwNzgtYjRjOS1mNDljOTA4YjkyYjAiLCJwaG9uZSI6Iis5MTk5OTk5OTk5OSIsImlhdCI6MTczNTI5NzIyOSwiZXhwIjoxNzM1MzgzNjI5fQ.example";

async function testAgeUpdate() {
  try {
    console.log('🧪 Testing age update...');
    console.log('📝 Test data:', JSON.stringify(testData, null, 2));
    
    const response = await axios.put('http://localhost:5000/api/users/profile', testData, {
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Age update successful!');
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Age update failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testAgeUpdate();
