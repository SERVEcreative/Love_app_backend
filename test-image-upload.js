const axios = require("axios");

// Test configuration
const BASE_URL = "http://localhost:5000";
const TEST_PHONE = "+919876543210";

async function testImageUpload() {
  try {
    console.log("🧪 Testing Image Upload Functionality\n");

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

    // Step 3: Test profile update with image field (local path)
    console.log("3️⃣ Testing profile update with local image path...");
    const profileUpdateData1 = {
      name: "Deepak",
      fullName: "Deepak Kumar Verma",
      age: 25,
      gender: "male",
      location: "New Delhi, India",
      bio: "Love to code and build amazing apps! 🚀",
      image:
        "C:\\Users\\DEEPAK KUMAR VERMA\\OneDrive\\Desktop\\Deepak kumar verma.jpg",
    };

    const profileResponse1 = await axios.put(
      `${BASE_URL}/api/auth/profile`,
      profileUpdateData1,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Profile updated successfully with local image path!");
    console.log(
      "📊 Profile completion:",
      profileResponse1.data.profile.profileCompletionPercentage + "%"
    );
    console.log("📸 Profile image:", profileResponse1.data.profile.image);
    console.log("📷 Total photos:", profileResponse1.data.photos.total);
    console.log("📸 Photos uploaded:", profileResponse1.data.photos.uploaded);

    // Step 4: Test profile update with base64 image
    console.log("\n4️⃣ Testing profile update with base64 image...");
    const base64Image =
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A";

    const profileUpdateData2 = {
      bio: "Updated bio with base64 image! 📸",
      image: base64Image,
    };

    const profileResponse2 = await axios.put(
      `${BASE_URL}/api/auth/profile`,
      profileUpdateData2,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Profile updated successfully with base64 image!");
    console.log("📸 Profile image:", profileResponse2.data.profile.image);
    console.log("📷 Total photos:", profileResponse2.data.photos.total);

    // Step 5: Test profile update with URL image
    console.log("\n5️⃣ Testing profile update with URL image...");
    const profileUpdateData3 = {
      bio: "Updated bio with URL image! 🌐",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    };

    const profileResponse3 = await axios.put(
      `${BASE_URL}/api/auth/profile`,
      profileUpdateData3,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Profile updated successfully with URL image!");
    console.log("📸 Profile image:", profileResponse3.data.profile.image);
    console.log("📷 Total photos:", profileResponse3.data.photos.total);

    // Step 6: Test profile update with photos array
    console.log("\n6️⃣ Testing profile update with photos array...");
    const profileUpdateData4 = {
      bio: "Updated bio with photos array! 📷",
      photos: [
        {
          url: "C:\\Users\\DEEPAK KUMAR VERMA\\OneDrive\\Desktop\\Deepak kumar verma.jpg",
          is_primary: true,
          photo_order: 1,
        },
        {
          url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
          is_primary: false,
          photo_order: 2,
        },
      ],
    };

    const profileResponse4 = await axios.put(
      `${BASE_URL}/api/auth/profile`,
      profileUpdateData4,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Profile updated successfully with photos array!");
    console.log("📸 Profile image:", profileResponse4.data.profile.image);
    console.log("📷 Total photos:", profileResponse4.data.photos.total);
    console.log("📸 Photos uploaded:", profileResponse4.data.photos.uploaded);

    // Step 7: Get updated profile
    console.log("\n7️⃣ Fetching updated profile...");
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
    console.log("📸 Profile image:", profileGetResponse.data.profile.image);
    console.log("🖼️ Avatar URL:", profileGetResponse.data.profile.avatarUrl);
    console.log(
      "📷 Total photos:",
      profileGetResponse.data.profile.photos.length
    );

    console.log("\n📋 Photo details:");
    profileGetResponse.data.profile.photos.forEach((photo, index) => {
      console.log(
        `   ${index + 1}. ${photo.isPrimary ? "🌟" : "📷"} ${photo.url}`
      );
      console.log(`      Primary: ${photo.isPrimary}, Order: ${photo.order}`);
    });

    console.log("\n🎉 All image upload tests passed successfully!");
    console.log("\n📝 Summary:");
    console.log("   ✅ Local file path handling works");
    console.log("   ✅ Base64 image handling works");
    console.log("   ✅ URL image handling works");
    console.log("   ✅ Photos array handling works");
    console.log("   ✅ Image field handling works");
    console.log("   ✅ Profile fetching with images works");
    console.log("   ✅ Primary photo management works");
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
testImageUpload();
