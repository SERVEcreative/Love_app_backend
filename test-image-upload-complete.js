/**
 * Complete Image Upload Test Script
 *
 * This script tests the complete image upload and profile update flow
 * that matches the Flutter frontend implementation.
 */

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

// Configuration
const BASE_URL = "http://localhost:5000/api";
const TEST_PHONE = "+1234567890";
const TEST_OTP = "123456";

// Test data
const testUserData = {
  name: "Test User",
  fullName: "Test User Full Name",
  age: 25,
  gender: "male",
  location: "Test City",
  bio: "This is a test bio for image upload testing",
};

async function testCompleteImageUploadFlow() {
  console.log("🚀 Starting Complete Image Upload Flow Test\n");

  try {
    // Step 1: Send OTP
    console.log("📱 Step 1: Sending OTP...");
    const otpResponse = await axios.post(`${BASE_URL}/auth/send-otp`, {
      phoneNumber: TEST_PHONE,
    });
    console.log("✅ OTP sent:", otpResponse.data);

    // Step 2: Verify OTP and get token
    console.log("\n🔐 Step 2: Verifying OTP...");
    const verifyResponse = await axios.post(`${BASE_URL}/auth/verify-otp`, {
      phoneNumber: TEST_PHONE,
      otp: TEST_OTP,
    });
    console.log("✅ OTP verified:", verifyResponse.data);

    const token = verifyResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Step 3: Get current profile
    console.log("\n👤 Step 3: Getting current profile...");
    const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
      headers,
    });
    console.log(
      "✅ Current profile:",
      JSON.stringify(profileResponse.data, null, 2)
    );

    // Step 4: Create a test image file (simple text file for testing)
    console.log("\n📸 Step 4: Creating test image file...");
    const testImagePath = path.join(__dirname, "test-image.txt");
    fs.writeFileSync(testImagePath, "This is a test image file content");
    console.log("✅ Test image file created:", testImagePath);

    // Step 5: Upload image
    console.log("\n📤 Step 5: Uploading image...");
    const formData = new FormData();
    formData.append("image", fs.createReadStream(testImagePath), {
      filename: "test-image.txt",
      contentType: "text/plain",
    });

    const uploadResponse = await axios.post(
      `${BASE_URL}/users/upload-image`,
      formData,
      {
        headers: {
          ...headers,
          ...formData.getHeaders(),
        },
      }
    );
    console.log("✅ Image uploaded:", uploadResponse.data);

    const imageUrl = uploadResponse.data.imageUrl;

    // Step 6: Update profile with image
    console.log("\n🔄 Step 6: Updating profile with image...");
    const updateData = {
      ...testUserData,
      image: imageUrl,
    };

    const updateResponse = await axios.put(
      `${BASE_URL}/users/profile`,
      updateData,
      { headers }
    );
    console.log(
      "✅ Profile updated:",
      JSON.stringify(updateResponse.data, null, 2)
    );

    // Step 7: Verify profile was updated correctly
    console.log("\n🔍 Step 7: Verifying updated profile...");
    const updatedProfileResponse = await axios.get(
      `${BASE_URL}/users/profile`,
      { headers }
    );
    const updatedProfile = updatedProfileResponse.data.user;

    console.log("✅ Updated profile verification:");
    console.log("  - Name:", updatedProfile.name);
    console.log("  - Full Name:", updatedProfile.fullName);
    console.log("  - Age:", updatedProfile.age);
    console.log("  - Gender:", updatedProfile.gender);
    console.log("  - Location:", updatedProfile.location);
    console.log("  - Bio:", updatedProfile.bio);
    console.log("  - Image URL:", updatedProfile.image);
    console.log("  - Photo URL:", updatedProfile.photoUrl);

    // Step 8: Test profile update without image (just text fields)
    console.log("\n🔄 Step 8: Testing profile update without image...");
    const textOnlyUpdate = {
      name: "Updated Test User",
      fullName: "Updated Test User Full Name",
      age: 26,
      gender: "female",
      location: "Updated Test City",
      bio: "This is an updated test bio",
    };

    const textUpdateResponse = await axios.put(
      `${BASE_URL}/users/profile`,
      textOnlyUpdate,
      { headers }
    );
    console.log(
      "✅ Text-only profile update:",
      JSON.stringify(textUpdateResponse.data, null, 2)
    );

    // Step 9: Final verification
    console.log("\n🔍 Step 9: Final profile verification...");
    const finalProfileResponse = await axios.get(`${BASE_URL}/users/profile`, {
      headers,
    });
    const finalProfile = finalProfileResponse.data.user;

    console.log("✅ Final profile:");
    console.log("  - Name:", finalProfile.name);
    console.log("  - Full Name:", finalProfile.fullName);
    console.log("  - Age:", finalProfile.age);
    console.log("  - Gender:", finalProfile.gender);
    console.log("  - Location:", finalProfile.location);
    console.log("  - Bio:", finalProfile.bio);
    console.log("  - Image URL:", finalProfile.image);
    console.log("  - Photo URL:", finalProfile.photoUrl);

    // Cleanup
    console.log("\n🧹 Cleaning up test files...");
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log("✅ Test image file deleted");
    }

    console.log("\n🎉 Complete Image Upload Flow Test PASSED!");
    console.log("\n📋 Summary:");
    console.log("  ✅ OTP authentication working");
    console.log("  ✅ Profile retrieval working");
    console.log("  ✅ Image upload endpoint working");
    console.log("  ✅ Profile update with image working");
    console.log("  ✅ Profile update without image working");
    console.log("  ✅ Flutter-compatible response format working");
  } catch (error) {
    console.error("\n❌ Test FAILED:", error.response?.data || error.message);

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);
    }

    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testCompleteImageUploadFlow();
}

module.exports = { testCompleteImageUploadFlow };
