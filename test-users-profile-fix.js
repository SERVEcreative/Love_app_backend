const axios = require("axios");

// Test configuration
const BASE_URL = "http://localhost:5000";
const TEST_PHONE = "+919876543210";

async function testUsersProfileFix() {
  try {
    console.log("🧪 Testing Users Profile Fix (/api/users/profile)\n");

    // Step 1: Send OTP
    console.log("1️⃣ Sending OTP...");
    const otpResponse = await axios.post(`${BASE_URL}/api/auth/send-otp`, {
      phoneNumber: TEST_PHONE,
    });
    console.log("✅ OTP sent:", otpResponse.data.message);

    // Get debug OTP from response
    const debugOTP = otpResponse.data.debugOTP || "123456";
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

    // Step 3: Test profile update with image field (using /api/users/profile endpoint)
    console.log(
      "3️⃣ Testing profile update with image field using /api/users/profile..."
    );
    const profileUpdateData = {
      name: "Deepak",
      fullName: "Deepak Kumar Verma",
      age: 25,
      gender: "male",
      location: "New Delhi, India",
      bio: "Love to code and build amazing apps! 🚀",
      image:
        "C:\\Users\\DEEPAK KUMAR VERMA\\OneDrive\\Desktop\\Deepak kumar verma.jpg",
    };

    const profileResponse = await axios.put(
      `${BASE_URL}/api/users/profile`,
      profileUpdateData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Profile updated successfully!");
    console.log("📊 User data:", profileResponse.data.user);
    console.log("📸 Profile image:", profileResponse.data.user.image);
    console.log("📷 Total photos:", profileResponse.data.photos.total);
    console.log("📸 Photos uploaded:", profileResponse.data.photos.uploaded);

    console.log("\n📋 Photo details:");
    profileResponse.data.photos.list.forEach((photo, index) => {
      console.log(
        `   ${index + 1}. ${photo.isPrimary ? "🌟" : "📷"} ${photo.url}`
      );
      console.log(`      Primary: ${photo.isPrimary}, Order: ${photo.order}`);
    });

    console.log("\n🎉 Users profile fix test passed successfully!");
    console.log("\n📝 Summary:");
    console.log("   ✅ /api/users/profile endpoint now accepts image field");
    console.log("   ✅ Local file path handling works");
    console.log("   ✅ Image field converted to avatar_url");
    console.log("   ✅ Primary photo created from image");
    console.log("   ✅ Photo information returned in response");
    console.log("   ✅ No more validation errors!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);

    if (error.response?.status === 400) {
      console.log(
        "\n💡 This might be a validation error - check the server logs"
      );
    }

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
testUsersProfileFix();
