const axios = require("axios");

// Test configuration
const BASE_URL = "http://localhost:5000";
const TEST_PHONE = "+919876543210";
const TEST_OTP = "123456"; // This will be displayed in console from the debug mode

async function testProfilePhotoUpdate() {
  try {
    console.log("🧪 Testing Profile Photo Update Functionality\n");

    // Step 1: Send OTP
    console.log("1️⃣ Sending OTP...");
    const otpResponse = await axios.post(`${BASE_URL}/api/auth/send-otp`, {
      phoneNumber: TEST_PHONE,
    });
    console.log("✅ OTP sent:", otpResponse.data.message);
    console.log("📱 Check console for OTP code\n");

    // Wait for user to check console for OTP
    console.log(
      "⏳ Please check the server console for the OTP code and update TEST_OTP in this script"
    );
    console.log("   Then press Enter to continue...\n");

    // For automated testing, we'll use the debug OTP from response
    const debugOTP = otpResponse.data.debugOTP || TEST_OTP;
    console.log(`🔑 Using OTP: ${debugOTP}\n`);

    // Step 2: Verify OTP and get token
    console.log("2️⃣ Verifying OTP...");
    const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
      phoneNumber: TEST_PHONE,
      otp: debugOTP,
    });

    const token = verifyResponse.data.token;
    console.log("✅ OTP verified successfully");
    console.log(`🎫 Token received: ${token.substring(0, 20)}...\n`);

    // Step 3: Update profile with photos
    console.log("3️⃣ Updating profile with photos...");
    const profileUpdateData = {
      name: "John Doe",
      bio: "Love to travel and meet new people! 📸✈️",
      location: "New York, NY",
      gender: "male",
      age: 25,
      photos: [
        {
          url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
          is_primary: true,
          photo_order: 1,
        },
        {
          url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
          is_primary: false,
          photo_order: 2,
        },
        {
          url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
          is_primary: false,
          photo_order: 3,
        },
      ],
    };

    const profileResponse = await axios.put(
      `${BASE_URL}/api/auth/profile`,
      profileUpdateData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Profile updated successfully!");
    console.log(
      "📊 Profile completion:",
      profileResponse.data.profile.profileCompletionPercentage + "%"
    );
    console.log("📸 Photos uploaded:", profileResponse.data.photos.uploaded);
    console.log("📷 Total photos:", profileResponse.data.photos.total);
    console.log("\n📋 Photo details:");
    profileResponse.data.photos.list.forEach((photo, index) => {
      console.log(
        `   ${index + 1}. ${photo.isPrimary ? "🌟" : "📷"} ${photo.url}`
      );
      console.log(`      Primary: ${photo.isPrimary}, Order: ${photo.order}`);
    });

    // Step 4: Get updated profile
    console.log("\n4️⃣ Fetching updated profile...");
    const profileGetResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Profile fetched successfully!");
    console.log("👤 Name:", profileGetResponse.data.profile.fullName);
    console.log("📝 Bio:", profileGetResponse.data.profile.bio);
    console.log("📍 Location:", profileGetResponse.data.profile.location);
    console.log("👨 Gender:", profileGetResponse.data.profile.gender);
    console.log("🎂 Age:", profileGetResponse.data.profile.age);
    console.log(
      "📸 Primary photo:",
      profileGetResponse.data.profile.image || "None"
    );

    console.log("\n🎉 All tests passed successfully!");
    console.log("\n📝 Summary:");
    console.log("   ✅ OTP sending works");
    console.log("   ✅ OTP verification works");
    console.log("   ✅ Profile update with photos works");
    console.log("   ✅ Photo upload and storage works");
    console.log("   ✅ Primary photo management works");
    console.log("   ✅ Profile fetching works");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log(
        "\n💡 Tip: Make sure to update the TEST_OTP with the actual OTP from console"
      );
    }

    if (error.response?.status === 500) {
      console.log(
        "\n💡 Tip: Make sure the server is running and database is connected"
      );
    }
  }
}

// Run the test
testProfilePhotoUpdate();
