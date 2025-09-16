const express = require("express");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const whatsappService = require("../services/whatsappService");
const otpStorage = require("../services/otpStorage");
const userService = require("../services/userService");
const { supabase, supabaseAdmin } = require("../config/supabase");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Enhanced validation schemas
const sendOTPSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required(),
});

const verifyOTPSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required(),
  otp: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required(),
});

// Helper function to get client IP
const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    "unknown"
  );
};

// Helper function to get user agent
const getUserAgent = (req) => {
  return req.headers["user-agent"] || "unknown";
};

// Send OTP via WhatsApp
router.post("/send-otp", async (req, res) => {
  try {
    // Get client information for security
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    // Validate request body
    const { error, value } = sendOTPSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details[0].message,
      });
    }

    const { phoneNumber } = value;

    // Check if phone number is valid
    if (!whatsappService.isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        error: "Invalid phone number format",
      });
    }

    // Send OTP via WhatsApp with security checks
    const result = await whatsappService.sendOTP(
      phoneNumber,
      clientIP,
      userAgent
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        message: "OTP sent successfully via WhatsApp",
        messageId: result.messageId,
        // OTP is not returned in response for security
      });
    } else {
      res.status(500).json({
        error: "Failed to send OTP",
      });
    }
  } catch (error) {
    console.error("Send OTP error:", error);

    // Handle security-related errors
    if (
      error.message.includes("IP blocked") ||
      error.message.includes("Rate limit")
    ) {
      return res.status(429).json({
        error: "Too many requests",
        message: error.message,
        retryAfter: error.message.includes("minutes")
          ? parseInt(error.message.match(/(\d+)/)[1]) * 60
          : 900, // 15 minutes default
      });
    }

    // Handle specific WhatsApp API errors
    if (error.message.includes("Failed to send OTP via WhatsApp")) {
      return res.status(500).json({
        error: "WhatsApp template error",
        message:
          "There was an issue with the WhatsApp template. Please check template configuration.",
        details: error.message,
      });
    }

    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Verify OTP and create/update user
router.post("/verify-otp", async (req, res) => {
  try {
    // Get client information for security
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    // Validate request body
    const { error, value } = verifyOTPSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details[0].message,
      });
    }

    const { phoneNumber, otp } = value;

    // Check if phone number is valid
    if (!whatsappService.isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        error: "Invalid phone number format",
      });
    }

    // Format phone number for verification
    const formattedPhone = whatsappService.formatPhoneNumber(phoneNumber);

    // Check if IP is blocked
    const ipBlockCheck = otpStorage.isIPBlocked(clientIP);
    if (ipBlockCheck.blocked) {
      return res.status(429).json({
        error: "IP blocked",
        message: ipBlockCheck.reason,
        retryAfter: Math.ceil(ipBlockCheck.remainingTime / 1000),
      });
    }

    // Verify OTP with enhanced security
    const result = otpStorage.verifyOTP(
      formattedPhone,
      otp,
      clientIP,
      userAgent
    );

    if (result.success) {
      console.log("✅ OTP verified successfully for:", formattedPhone);

      // Check if user already exists
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("phone_number", formattedPhone)
        .single();

      let user;
      let isNewUser = false;

      if (existingUser) {
        // User exists - update login info
        console.log("🔄 Existing user found, updating login info");
        const { data: updatedUser, error: updateError } = await supabaseAdmin
          .from("users")
          .update({
            last_login_at: new Date().toISOString(),
            login_count: existingUser.login_count + 1,
            status: "online",
            updated_at: new Date().toISOString(),
          })
          .eq("phone_number", formattedPhone)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating user:", updateError);
          return res.status(500).json({
            error: "Failed to update user",
            message: updateError.message,
          });
        }

        user = updatedUser;
      } else {
        // New user - create user
        console.log("🆕 New user, creating account");
        isNewUser = true;

        const userData = {
          phone_number: formattedPhone,
          is_verified: true,
          verification_status: "verified",
          verification_date: new Date().toISOString(),
          last_login_at: new Date().toISOString(),
          login_count: 1,
          profile_completion_percentage: 30,
          status: "online",
        };

        const { data: newUser, error: insertError } = await supabaseAdmin
          .from("users")
          .insert([userData])
          .select()
          .single();

        if (insertError) {
          console.error("Error creating user:", insertError);
          return res.status(500).json({
            error: "Failed to create user",
            message: insertError.message,
          });
        }

        user = newUser;

        // Create default preferences for new user
        const { error: prefError } = await supabaseAdmin
          .from("user_preferences")
          .insert({
            user_id: user.id,
            push_notifications: true,
            email_notifications: true,
            sms_notifications: false,
            privacy_level: "public",
            show_online_status: true,
            show_last_seen: true,
            allow_profile_views: true,
          });

        if (prefError) {
          console.error("Error creating preferences:", prefError);
        }
      }

      // Generate JWT token with enhanced security
      const token = jwt.sign(
        {
          userId: user.id,
          phoneNumber: formattedPhone,
          ip: clientIP,
          deviceId: otpStorage.generateDeviceId(userAgent, clientIP),
          iat: Math.floor(Date.now() / 1000),
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "24h",
          issuer: "whatsapp-otp-auth",
          audience: "mobile-app",
        }
      );

      // Check if user has complete profile
      const hasCompleteProfile =
        user.name && user.profile_completion_percentage >= 80;

      res.status(200).json({
        success: true,
        message: result.message,
        token: token,
        user: {
          id: user.id,
          phoneNumber: formattedPhone,
          name: user.name,
          isVerified: user.is_verified,
          verificationStatus: user.verification_status,
          profileCompletion: user.profile_completion_percentage,
          createdAt: user.created_at,
          loginCount: user.login_count,
        },
        isNewUser: isNewUser,
        hasCompleteProfile: hasCompleteProfile,
        requiresProfileCompletion: !hasCompleteProfile,
        redirectTo: hasCompleteProfile ? "dashboard" : "profile-completion",
      });
    } else {
      // Handle blocked IP after failed attempts
      if (result.blocked) {
        return res.status(429).json({
          success: false,
          error: result.message,
          retryAfter: Math.ceil(result.remainingTime / 1000),
        });
      }

      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Create user profile after OTP verification
router.post("/create-profile", authenticateToken, async (req, res) => {
  try {
    // Validate request body (without token)
    const createProfileSchema = Joi.object({
      name: Joi.string().min(2).max(50).required(),
      age: Joi.number().integer().min(18).max(100).required(),
      gender: Joi.string()
        .valid("male", "female", "other", "prefer_not_to_say")
        .required(),
    });

    const { error, value } = createProfileSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details[0].message,
      });
    }

    const { name, age, gender } = value;

    const userId = req.user.userId;
    const phoneNumber = req.user.phoneNumber;

    // Calculate date of birth from age
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - age;
    const dateOfBirth = new Date(birthYear, 0, 1);

    // Update user profile in Supabase using admin client to bypass RLS
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        name: name,
        age: age,
        gender: gender,
        profile_completion_percentage: 80, // Higher completion with basic info
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating user profile:", updateError);
      return res.status(500).json({
        error: "Failed to update profile",
        message: updateError.message,
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile created successfully",
      user: {
        id: updatedUser.id,
        phoneNumber: updatedUser.phone_number,
        name: updatedUser.name,
        age: age,
        gender: updatedUser.gender,
        isVerified: updatedUser.is_verified,
        profileCompletion: updatedUser.profile_completion_percentage,
        createdAt: updatedUser.created_at,
      },
    });
  } catch (error) {
    console.error("Create profile error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Get complete user profile data
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const phoneNumber = req.user.phoneNumber;

    console.log("📋 Fetching profile for user:", userId);

    // Get user data from database
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user:", userError);
      return res.status(500).json({
        error: "Failed to fetch user profile",
        message: userError.message,
      });
    }

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User profile does not exist",
      });
    }

    // Get user preferences
    const { data: preferences, error: prefError } = await supabaseAdmin
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Get user photos (primary photo first)
    const { data: photos, error: photoError } = await supabaseAdmin
      .from("user_photos")
      .select("*")
      .eq("user_id", userId)
      .eq("is_approved", true)
      .order("is_primary", { ascending: false })
      .order("photo_order", { ascending: true });

    // Get user interests
    const { data: interests, error: interestError } = await supabaseAdmin
      .from("user_interests")
      .select("*")
      .eq("user_id", userId);

    // Get age directly from database
    let age = user.age;

    // Format last seen
    let lastSeen = "Never";
    if (user.last_seen) {
      const lastSeenDate = new Date(user.last_seen);
      const now = new Date();
      const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));

      if (diffInMinutes < 1) {
        lastSeen = "Just now";
      } else if (diffInMinutes < 60) {
        lastSeen = `${diffInMinutes} min ago`;
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60);
        lastSeen = `${hours} hour${hours > 1 ? "s" : ""} ago`;
      } else {
        const days = Math.floor(diffInMinutes / 1440);
        lastSeen = `${days} day${days > 1 ? "s" : ""} ago`;
      }
    }

    // Get primary photo URL
    let primaryPhotoUrl = "";
    if (photos && photos.length > 0) {
      const primaryPhoto =
        photos.find((photo) => photo.is_primary) || photos[0];
      primaryPhotoUrl = primaryPhoto.photo_url;
    }

    // Format interests list
    const interestsList = interests
      ? interests.map((interest) => interest.interest_name)
      : [];

    // Build complete profile response
    const profileData = {
      success: true,
      message: "Profile fetched successfully",
      profile: {
        // Basic Info
        id: user.id,
        phoneNumber: user.phone_number,
        fullName: user.name || "Anonymous",
        email: user.email || "",
        age: age,
        gender: user.gender || "",
        location: user.location || "",
        bio: user.bio || "",

        // Profile Images
        image: primaryPhotoUrl,
        avatarUrl: user.avatar_url || primaryPhotoUrl,
        photos: photos
          ? photos.map((photo) => ({
              id: photo.id,
              url: photo.photo_url,
              isPrimary: photo.is_primary,
              order: photo.photo_order,
            }))
          : [],

        // Status & Activity
        online: user.status === "online",
        lastSeen: lastSeen,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLoginAt: user.last_login_at,
        loginCount: user.login_count || 0,

        // Verification & Status
        isVerified: user.is_verified || false,
        verificationStatus: user.verification_status || "pending",
        isActive: user.is_active || true,
        isPremium: user.is_premium || false,
        profileCompletionPercentage: user.profile_completion_percentage || 0,

        // Interests
        interests: interestsList,

        // Preferences
        preferences: preferences
          ? {
              pushNotifications: preferences.push_notifications,
              emailNotifications: preferences.email_notifications,
              smsNotifications: preferences.sms_notifications,
              privacyLevel: preferences.privacy_level,
              showOnlineStatus: preferences.show_online_status,
              showLastSeen: preferences.show_last_seen,
              allowProfileViews: preferences.allow_profile_views,
            }
          : {
              pushNotifications: true,
              emailNotifications: true,
              smsNotifications: false,
              privacyLevel: "public",
              showOnlineStatus: true,
              showLastSeen: true,
              allowProfileViews: true,
            },
      },
    };

    console.log("✅ Profile fetched successfully for user:", user.id);
    res.status(200).json(profileData);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Validate request body with photo support
    const updateProfileSchema = Joi.object({
      name: Joi.string().min(2).max(100).optional(),
      fullName: Joi.string().min(2).max(100).optional(), // Support fullName field
      email: Joi.string().email().optional(),
      bio: Joi.string().max(500).optional(),
      location: Joi.string().max(255).optional(),
      gender: Joi.string()
        .valid("male", "female", "other", "prefer_not_to_say")
        .optional(),
      age: Joi.number().integer().min(1).max(120).optional(),
      dateOfBirth: Joi.date().max("now").optional(),
      avatarUrl: Joi.string().uri().optional(),
      image: Joi.alternatives()
        .try(
          Joi.string().uri(), // URL
          Joi.string().pattern(/^data:image\//), // Base64 data URL
          Joi.string().min(1) // Local file path (for development)
        )
        .optional(),
      photos: Joi.array()
        .items(
          Joi.object({
            url: Joi.alternatives()
              .try(
                Joi.string().uri(),
                Joi.string().pattern(/^data:image\//),
                Joi.string().min(1)
              )
              .required(),
            is_primary: Joi.boolean().optional().default(false),
            photo_order: Joi.number().integer().min(0).optional().default(0),
          })
        )
        .optional(),
    });

    const { error, value } = updateProfileSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details[0].message,
      });
    }

    // Get current user data for completion calculation
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching current user:", fetchError);
      return res.status(500).json({
        error: "Failed to fetch user data",
        message: fetchError.message,
      });
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    // Handle name field (support both 'name' and 'fullName')
    if (value.name) updateData.name = value.name;
    if (value.fullName) updateData.name = value.fullName;

    if (value.email) updateData.email = value.email;
    if (value.bio) updateData.bio = value.bio;
    if (value.location) updateData.location = value.location;
    if (value.gender) updateData.gender = value.gender;
    if (value.age) updateData.age = parseInt(value.age);

    // Handle image field - convert to avatar_url or photo
    if (value.image) {
      // If it's a local file path, convert it to a URL or handle it appropriately
      if (value.image.startsWith("C:\\") || value.image.startsWith("/")) {
        // For development: convert local path to a placeholder URL
        // In production, you should upload the file and get a proper URL
        updateData.avatar_url = `https://placeholder.com/400x400?text=Profile+Image`;
        console.log(`📸 Local image path detected: ${value.image}`);
        console.log(`🔄 Converted to placeholder URL for development`);
      } else if (value.image.startsWith("data:image/")) {
        // Handle base64 data URL - in production, save to file storage
        updateData.avatar_url = value.image;
        console.log(`📸 Base64 image data received`);
      } else {
        // Assume it's already a URL
        updateData.avatar_url = value.image;
        console.log(`📸 Image URL received: ${value.image}`);
      }
    }

    if (value.avatarUrl) updateData.avatar_url = value.avatarUrl;

    // Calculate new profile completion percentage
    const completionFields = [
      "name",
      "email",
      "bio",
      "location",
      "gender",
      "age",
      "avatar_url",
    ];
    const completedFields = completionFields.filter(
      (field) =>
        (updateData[field] !== undefined &&
          updateData[field] !== null &&
          updateData[field] !== "") ||
        (currentUser[field] !== null && currentUser[field] !== "")
    ).length;
    updateData.profile_completion_percentage = Math.round(
      (completedFields / completionFields.length) * 100
    );

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return res.status(500).json({
        error: "Failed to update profile",
        message: updateError.message,
      });
    }

    let uploadedPhotos = [];

    // If user provided an image but no photos array, create a primary photo from the image
    if (value.image && (!value.photos || value.photos.length === 0)) {
      console.log(
        `📸 Creating primary photo from image field for user ${userId}`
      );

      try {
        let imageUrl = value.image;

        // Handle different types of image inputs
        if (value.image.startsWith("C:\\") || value.image.startsWith("/")) {
          // Local file path - convert to placeholder URL for development
          imageUrl = `https://placeholder.com/400x400?text=Profile+Image`;
          console.log(`📸 Local image path detected: ${value.image}`);
        } else if (value.image.startsWith("data:image/")) {
          // Base64 data URL
          imageUrl = value.image;
          console.log(`📸 Base64 image data received`);
        }

        // Create a primary photo from the image
        const { data: insertedPhoto, error: photoError } = await supabaseAdmin
          .from("user_photos")
          .insert([
            {
              user_id: userId,
              photo_url: imageUrl,
              is_primary: true,
              photo_order: 1,
              is_approved: true,
            },
          ])
          .select();

        if (photoError) {
          console.error("Error inserting primary photo:", photoError);
        } else {
          uploadedPhotos = insertedPhoto || [];
          console.log(`✅ Successfully created primary photo from image field`);
        }
      } catch (error) {
        console.error("Error handling image field:", error);
      }
    }

    // Handle photo uploads if provided
    if (value.photos && value.photos.length > 0) {
      console.log(
        `📸 Processing ${value.photos.length} photo(s) for user ${userId}`
      );

      try {
        // Prepare photos for insertion
        const photosToInsert = value.photos.map((photo, index) => {
          let photoUrl = photo.url;

          // Handle different types of image inputs
          if (photo.url.startsWith("C:\\") || photo.url.startsWith("/")) {
            // Local file path - convert to placeholder URL for development
            photoUrl = `https://placeholder.com/400x400?text=Photo+${
              index + 1
            }`;
            console.log(`📸 Local photo path detected: ${photo.url}`);
          } else if (photo.url.startsWith("data:image/")) {
            // Base64 data URL
            photoUrl = photo.url;
            console.log(`📸 Base64 photo data received`);
          }

          return {
            user_id: userId,
            photo_url: photoUrl,
            is_primary: photo.is_primary || false,
            photo_order: photo.photo_order || index + 1,
            is_approved: true, // Auto-approve for now, can be changed for moderation
          };
        });

        // Insert photos into database
        const { data: insertedPhotos, error: photoError } = await supabaseAdmin
          .from("user_photos")
          .insert(photosToInsert)
          .select();

        if (photoError) {
          console.error("Error inserting photos:", photoError);
          // Don't fail the entire request if photos fail, just log the error
        } else {
          uploadedPhotos = insertedPhotos || [];
          console.log(
            `✅ Successfully uploaded ${uploadedPhotos.length} photo(s)`
          );

          // If any photo is marked as primary, unset other primary photos
          const primaryPhotos = value.photos.filter(
            (photo) => photo.is_primary
          );
          if (primaryPhotos.length > 0) {
            await supabaseAdmin
              .from("user_photos")
              .update({ is_primary: false })
              .eq("user_id", userId)
              .neq("id", uploadedPhotos.find((p) => p.is_primary)?.id);

            // Set the new primary photo
            const primaryPhotoId = uploadedPhotos.find((p) => p.is_primary)?.id;
            if (primaryPhotoId) {
              await supabaseAdmin
                .from("user_photos")
                .update({ is_primary: true })
                .eq("id", primaryPhotoId);
            }
          }

          // Log photo upload activity
          await supabaseAdmin.from("user_activity_logs").insert({
            user_id: userId,
            activity_type: "photos_added",
            activity_details: {
              count: uploadedPhotos.length,
              photo_ids: uploadedPhotos.map((p) => p.id),
            },
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.headers["user-agent"],
          });
        }
      } catch (photoError) {
        console.error("Error handling photo uploads:", photoError);
        // Continue with response even if photos fail
      }
    }

    // Get updated photos for response
    const { data: userPhotos } = await supabaseAdmin
      .from("user_photos")
      .select("*")
      .eq("user_id", userId)
      .eq("is_approved", true)
      .order("is_primary", { ascending: false })
      .order("photo_order", { ascending: true });

    // Get the primary photo URL for the response
    let primaryPhotoUrl = "";
    if (userPhotos && userPhotos.length > 0) {
      const primaryPhoto =
        userPhotos.find((photo) => photo.is_primary) || userPhotos[0];
      primaryPhotoUrl = primaryPhoto.photo_url;
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile: {
        id: updatedUser.id,
        fullName: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio,
        location: updatedUser.location,
        gender: updatedUser.gender,
        age: updatedUser.age,
        image: primaryPhotoUrl || updatedUser.avatar_url,
        avatarUrl: updatedUser.avatar_url,
        profileCompletionPercentage: updatedUser.profile_completion_percentage,
        updatedAt: updatedUser.updated_at,
      },
      photos: {
        total: userPhotos?.length || 0,
        uploaded: uploadedPhotos.length,
        list:
          userPhotos?.map((photo) => ({
            id: photo.id,
            url: photo.photo_url,
            isPrimary: photo.is_primary,
            order: photo.photo_order,
            createdAt: photo.created_at,
          })) || [],
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Security status endpoint (for debugging - remove in production)
router.get("/security-status/:phoneNumber", (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const clientIP = getClientIP(req);

    const otpInfo = otpStorage.getStoredOTP(phoneNumber);
    const rateLimitInfo = otpStorage.getRateLimitInfo(phoneNumber);
    const ipBlockInfo = otpStorage.getBlockedIPInfo(clientIP);

    res.json({
      phoneNumber,
      otpInfo,
      rateLimitInfo,
      ipBlockInfo,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Logout endpoint
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const phoneNumber = req.user.phoneNumber;
    const token = req.headers.authorization?.split(" ")[1]; // Extract token from header
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    console.log(`🚪 Logout request for user: ${userId} (${phoneNumber})`);

    // 1. Update user status to offline
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        status: "offline",
        last_seen: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating user status:", updateError);
      // Continue with logout even if status update fails
    } else {
      console.log(`✅ User status updated to offline: ${userId}`);
    }

    // 2. Clear user sessions
    const { error: sessionError } = await supabaseAdmin
      .from("user_sessions")
      .delete()
      .eq("user_id", userId);

    if (sessionError) {
      console.error("Error clearing user sessions:", sessionError);
      // Continue with logout even if session cleanup fails
    } else {
      console.log(`✅ User sessions cleared: ${userId}`);
    }

    // 3. Log logout activity
    try {
      await supabaseAdmin.from("user_activity_logs").insert({
        user_id: userId,
        activity_type: "logout",
        activity_details: {
          logout_method: "app_logout",
          logout_time: new Date().toISOString(),
          ip_address: clientIP,
          user_agent: userAgent,
          logout_success: true,
        },
        ip_address: clientIP,
        user_agent: userAgent,
      });

      console.log(`✅ Logout activity logged: ${userId}`);
    } catch (logError) {
      console.error("Error logging logout activity:", logError);
      // Continue with logout even if logging fails
    }

    // 4. Add token to blacklist (using otpStorage for consistency)
    if (token) {
      try {
        // Store token in blacklist with expiration (24 hours from now)
        const tokenExpiry = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours
        otpStorage.addToBlacklist(token, tokenExpiry);
        console.log(`🔒 Token blacklisted for user: ${userId}`);
      } catch (blacklistError) {
        console.error("Error blacklisting token:", blacklistError);
        // Continue with logout even if blacklisting fails
      }
    }

    console.log(`✅ Logout successful for user: ${userId}`);

    res.json({
      success: true,
      message: "Logged out successfully",
      logoutTime: new Date().toISOString(),
      sessionCleared: true,
      user: {
        id: userId,
        phoneNumber: phoneNumber,
        status: "offline",
      },
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Logout failed",
      message: "Unable to complete logout. Please try again.",
    });
  }
});

// Debug endpoint to show complete user data in database (remove in production)
router.get("/debug-user/:phoneNumber", async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const formattedPhone = whatsappService.formatPhoneNumber(phoneNumber);

    // Get user from database
    const userResult = await userService.getUserByPhone(formattedPhone);

    if (!userResult.success) {
      return res.status(404).json({
        error: "User not found",
        message: userResult.error,
      });
    }

    // Get user preferences
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userResult.user.id)
      .single();

    // Get user activity logs
    const { data: activityLogs } = await supabase
      .from("user_activity_logs")
      .select("*")
      .eq("user_id", userResult.user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    res.json({
      success: true,
      message: "Complete user data from database",
      user: userResult.user,
      preferences: preferences || {},
      recentActivity: activityLogs || [],
      databaseTables: {
        users: "✅ User profile data",
        user_preferences: "✅ User preferences",
        user_activity_logs: "✅ Activity tracking",
        user_interests: "⏳ Available for interests",
        user_photos: "⏳ Available for photos",
        user_connections: "⏳ Available for friends/blocks",
        user_sessions: "⏳ Available for online status",
      },
    });
  } catch (error) {
    console.error("Debug user error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
