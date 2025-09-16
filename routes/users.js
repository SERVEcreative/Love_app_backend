const express = require("express");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const userService = require("../services/userService");
const { supabaseAdmin } = require("../config/supabase");
const NodeCache = require("node-cache");

const router = express.Router();

// Initialize cache for online users
const onlineUsersCache = new NodeCache({ stdTTL: 15 }); // 15 seconds cache

// Configure multer for image uploads (memory storage for Supabase)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Flexible upload middleware that accepts both 'image' and 'photo' fields
const uploadFlexible = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
}).any(); // Accept any field name

// Validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  bio: Joi.string().max(500).allow("").optional(),
  age: Joi.number().integer().min(1).max(120).optional(),
  gender: Joi.string()
    .valid("male", "female", "other", "prefer_not_to_say")
    .optional(),
  location: Joi.string().max(255).allow("").optional(),
  avatar_url: Joi.string().uri().optional(),
  fullName: Joi.string().max(100).optional(), // Added for Flutter compatibility
  image: Joi.alternatives()
    .try(
      Joi.string().uri(), // URL
      Joi.string().pattern(/^data:image\//), // Base64 data URL
      Joi.string().min(1) // Local file path (for development)
    )
    .optional(), // Added for image upload support
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
    .optional(), // Added for photos array support
});

const updatePreferencesSchema = Joi.object({
  push_notifications: Joi.boolean().optional(),
  email_notifications: Joi.boolean().optional(),
  sms_notifications: Joi.boolean().optional(),
  privacy_level: Joi.string().valid("public", "friends", "private").optional(),
  show_online_status: Joi.boolean().optional(),
  show_last_seen: Joi.boolean().optional(),
  allow_profile_views: Joi.boolean().optional(),
});

const addInterestsSchema = Joi.object({
  interests: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        category: Joi.string().optional(),
      })
    )
    .min(1)
    .max(10)
    .required(),
});

const addPhotosSchema = Joi.object({
  photos: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required(),
        is_primary: Joi.boolean().optional(),
      })
    )
    .min(1)
    .max(10)
    .required(),
});

const searchUsersSchema = Joi.object({
  gender: Joi.string().valid("male", "female", "other").optional(),
  minAge: Joi.number().integer().min(18).max(100).optional(),
  maxAge: Joi.number().integer().min(18).max(100).optional(),
  location: Joi.string().optional(),
  sortBy: Joi.string().valid("recent", "completion").optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
  offset: Joi.number().integer().min(0).optional(),
});

// Use the shared authenticateToken middleware instead of local authenticateUser
const { authenticateToken } = require("../middleware/auth");

// Get current user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    console.log("🔍 Fetching profile for user ID:", req.user.userId);

    const result = await userService.getUserById(req.user.userId);
    console.log("📋 getUserById result:", result);

    if (!result || !result.success) {
      console.log("❌ User not found or error occurred");
      return res.status(404).json({
        error: "User not found",
        message: result?.error || "User not found",
      });
    }

    console.log("✅ User found, returning profile data");

    // Get user photos to include primary photo
    const { data: userPhotos } = await supabaseAdmin
      .from("user_photos")
      .select("*")
      .eq("user_id", req.user.userId)
      .eq("is_approved", true)
      .order("is_primary", { ascending: false })
      .order("photo_order", { ascending: true });

    // Get the primary photo URL
    let primaryPhotoUrl = "";
    if (userPhotos && userPhotos.length > 0) {
      const primaryPhoto =
        userPhotos.find((photo) => photo.is_primary) || userPhotos[0];
      primaryPhotoUrl = primaryPhoto.photo_url;
    }

    // Prepare response with Flutter-compatible field names
    const responseUser = {
      ...result.user,
      // Flutter expects these field names
      fullName: result.user.name,
      image: primaryPhotoUrl || result.user.avatar_url,
      photoUrl: primaryPhotoUrl || result.user.avatar_url,
    };

    res.json({
      success: true,
      user: responseUser,
    });
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
    console.log("🔄 Updating profile for user ID:", req.user.userId);
    console.log("📝 Request body:", JSON.stringify(req.body, null, 2));

    // Validate request body
    const { error, value } = updateProfileSchema.validate(req.body);

    if (error) {
      console.log("❌ Validation error:", error.details[0].message);
      return res.status(400).json({
        error: "Validation failed",
        details: error.details[0].message,
      });
    }

    // Transform Flutter fields to database fields
    const transformedData = { ...value };

    console.log("🔄 Transforming Flutter data to database format...");

    // Map Flutter fields to database fields
    if (transformedData.fullName) {
      console.log("📝 Mapping fullName -> name:", transformedData.fullName);
      transformedData.name = transformedData.fullName;
      delete transformedData.fullName;
    }

    // Handle image field - convert to avatar_url
    if (transformedData.image) {
      console.log("📸 Processing image field:", transformedData.image);

      // Store the image URL directly as avatar_url
      transformedData.avatar_url = transformedData.image;
      console.log(
        "📸 Image URL stored as avatar_url:",
        transformedData.avatar_url
      );

      // Remove the image field as we've converted it to avatar_url
      delete transformedData.image;
    }

    if (transformedData.age !== undefined && transformedData.age !== null) {
      console.log(
        "📝 Processing age field:",
        transformedData.age,
        "Type:",
        typeof transformedData.age
      );

      // Ensure age is a number
      const ageNumber = parseInt(transformedData.age);
      if (isNaN(ageNumber)) {
        console.log("❌ Invalid age value:", transformedData.age);
        return res.status(400).json({
          error: "Invalid age value",
          message: "Age must be a valid number",
        });
      }

      // Store age directly (no conversion needed)
      transformedData.age = ageNumber;
      console.log("📝 Storing age directly:", ageNumber);
    } else {
      console.log("📝 No age field found in request");
    }

    // Convert empty strings to null for database
    if (transformedData.bio === "") {
      console.log("📝 Converting empty bio to null");
      transformedData.bio = null;
    }
    if (transformedData.location === "") {
      console.log("📝 Converting empty location to null");
      transformedData.location = null;
    }

    console.log(
      "✅ Transformed data:",
      JSON.stringify(transformedData, null, 2)
    );

    // Handle photos array if provided
    let uploadedPhotos = [];

    // If user provided an image but no photos array, create a primary photo from the image
    if (value.image && (!value.photos || value.photos.length === 0)) {
      console.log(
        `📸 Creating primary photo from image field for user ${req.user.userId}`
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
              user_id: req.user.userId,
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

    if (value.photos && value.photos.length > 0) {
      console.log(
        `📸 Processing ${value.photos.length} photo(s) for user ${req.user.userId}`
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
            user_id: req.user.userId,
            photo_url: photoUrl,
            is_primary: photo.is_primary || false,
            photo_order: photo.photo_order || index + 1,
            is_approved: true,
          };
        });

        // Insert photos into database
        const { data: insertedPhotos, error: photoError } = await supabaseAdmin
          .from("user_photos")
          .insert(photosToInsert)
          .select();

        if (photoError) {
          console.error("Error inserting photos:", photoError);
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
              .eq("user_id", req.user.userId)
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
        }
      } catch (photoError) {
        console.error("Error handling photo uploads:", photoError);
      }
    }

    const result = await userService.updateUserProfile(
      req.user.userId,
      transformedData
    );

    if (!result.success) {
      return res.status(400).json({
        error: "Failed to update profile",
        message: result.error,
      });
    }

    // Log activity
    await userService.logActivity(req.user.userId, "profile_updated", {
      updatedFields: Object.keys(value),
    });

    // Get updated photos for response
    const { data: userPhotos } = await supabaseAdmin
      .from("user_photos")
      .select("*")
      .eq("user_id", req.user.userId)
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

    // Prepare response with Flutter-compatible field names
    const responseUser = {
      ...result.user,
      // Flutter expects these field names
      fullName: result.user.name,
      image: primaryPhotoUrl || result.user.avatar_url,
      photoUrl: primaryPhotoUrl || result.user.avatar_url,
    };

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: responseUser,
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

// Upload profile image to Supabase Storage
router.post(
  "/upload-image",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log("📸 Image upload request from user:", req.user.userId);

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No image file provided",
          message: "Please select an image file to upload",
        });
      }

      // Generate unique filename for Supabase Storage
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `profile_${
        req.user.userId
      }_${Date.now()}${fileExtension}`;
      const filePath = `${req.user.userId}/${fileName}`;

      console.log("📤 Uploading to Supabase Storage:", {
        fileName: fileName,
        filePath: filePath,
        size: req.file.size,
      });

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } =
        await supabaseAdmin.storage
          .from("Love-user-image")
          .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false,
          });

      if (uploadError) {
        console.error("❌ Supabase upload error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL for the uploaded image
      const { data: urlData } = supabaseAdmin.storage
        .from("Love-user-image")
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;

      console.log("✅ Image uploaded to Supabase successfully:", {
        fileName: fileName,
        filePath: filePath,
        size: req.file.size,
        url: imageUrl,
      });

      // Log activity
      await userService.logActivity(req.user.userId, "image_uploaded", {
        fileName: fileName,
        filePath: filePath,
        size: req.file.size,
        url: imageUrl,
      });

      res.json({
        success: true,
        message: "Image uploaded successfully",
        imageUrl: imageUrl,
        fileName: fileName,
        filePath: filePath,
        size: req.file.size,
      });
    } catch (error) {
      console.error("❌ Image upload error:", error);

      res.status(500).json({
        success: false,
        error: "Image upload failed",
        message: error.message,
      });
    }
  }
);

// Alias for upload-image endpoint (frontend compatibility)
router.post(
  "/upload-photo",
  authenticateToken,
  uploadFlexible,
  async (req, res) => {
    try {
      console.log("📸 Image upload request from user:", req.user.userId);
      console.log("📸 Files received:", req.files);

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No image file provided",
          message: "Please select an image file to upload",
        });
      }

      // Get the first file (should be the image)
      const file = req.files[0];

      // Generate unique filename for Supabase Storage
      const fileExtension = path.extname(file.originalname);
      const fileName = `profile_${
        req.user.userId
      }_${Date.now()}${fileExtension}`;
      const filePath = `${req.user.userId}/${fileName}`;

      console.log("📤 Uploading to Supabase Storage:", {
        fileName: fileName,
        filePath: filePath,
        size: file.size,
      });

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } =
        await supabaseAdmin.storage
          .from("Love-user-image")
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

      if (uploadError) {
        console.error("❌ Supabase upload error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL for the uploaded image
      const { data: urlData } = supabaseAdmin.storage
        .from("Love-user-image")
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;

      console.log("✅ Image uploaded to Supabase successfully:", {
        fileName: fileName,
        filePath: filePath,
        size: file.size,
        url: imageUrl,
      });

      // Log activity
      await userService.logActivity(req.user.userId, "image_uploaded", {
        fileName: fileName,
        filePath: filePath,
        size: file.size,
        url: imageUrl,
      });

      res.json({
        success: true,
        message: "Image uploaded successfully",
        imageUrl: imageUrl,
        fileName: fileName,
        filePath: filePath,
        size: file.size,
      });
    } catch (error) {
      console.error("❌ Image upload error:", error);

      res.status(500).json({
        success: false,
        error: "Image upload failed",
        message: error.message,
      });
    }
  }
);

// Get user preferences
router.get("/preferences", authenticateToken, async (req, res) => {
  try {
    const result = await userService.getUserById(req.user.userId);

    if (!result.success) {
      return res.status(404).json({
        error: "User not found",
        message: result.error,
      });
    }

    res.json({
      success: true,
      preferences: result.user.user_preferences?.[0] || {},
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Update user preferences
router.put("/preferences", authenticateToken, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = updatePreferencesSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details[0].message,
      });
    }

    const result = await userService.updateUserPreferences(
      req.user.userId,
      value
    );

    if (!result.success) {
      return res.status(400).json({
        error: "Failed to update preferences",
        message: result.error,
      });
    }

    // Log activity
    await userService.logActivity(req.user.userId, "preferences_updated", {
      updatedFields: Object.keys(value),
    });

    res.json({
      success: true,
      message: "Preferences updated successfully",
      preferences: result.preferences,
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Add user interests
router.post("/interests", authenticateToken, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = addInterestsSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details[0].message,
      });
    }

    const result = await userService.addUserInterests(
      req.user.userId,
      value.interests
    );

    if (!result.success) {
      return res.status(400).json({
        error: "Failed to add interests",
        message: result.error,
      });
    }

    // Log activity
    await userService.logActivity(req.user.userId, "interests_added", {
      count: value.interests.length,
    });

    res.json({
      success: true,
      message: "Interests added successfully",
      interests: result.interests,
    });
  } catch (error) {
    console.error("Add interests error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Add user photos
router.post("/photos", authenticateToken, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = addPhotosSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details[0].message,
      });
    }

    const result = await userService.addUserPhotos(
      req.user.userId,
      value.photos
    );

    if (!result.success) {
      return res.status(400).json({
        error: "Failed to add photos",
        message: result.error,
      });
    }

    // Log activity
    await userService.logActivity(req.user.userId, "photos_added", {
      count: value.photos.length,
    });

    res.json({
      success: true,
      message: "Photos added successfully",
      photos: result.photos,
    });
  } catch (error) {
    console.error("Add photos error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Search users
router.get("/search", authenticateToken, async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = searchUsersSchema.validate(req.query);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details[0].message,
      });
    }

    const result = await userService.searchUsers(req.user.userId, value);

    if (!result.success) {
      return res.status(400).json({
        error: "Failed to search users",
        message: result.error,
      });
    }

    // Log activity
    await userService.logActivity(req.user.userId, "user_search", {
      searchParams: value,
      resultsCount: result.users.length,
    });

    res.json({
      success: true,
      users: result.users,
      total: result.total,
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Get user statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const result = await userService.getUserStats(req.user.userId);

    if (!result.success) {
      return res.status(400).json({
        error: "Failed to get user stats",
        message: result.error,
      });
    }

    res.json({
      success: true,
      stats: result.stats,
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Update user status
router.put("/status", authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !["online", "offline", "away", "busy"].includes(status)) {
      return res.status(400).json({
        error: "Invalid status",
        message: "Status must be one of: online, offline, away, busy",
      });
    }

    const result = await userService.updateUserStatus(req.user.userId, status);

    if (!result.success) {
      return res.status(400).json({
        error: "Failed to update status",
        message: result.error,
      });
    }

    // Log activity
    await userService.logActivity(req.user.userId, "status_updated", {
      newStatus: status,
    });

    res.json({
      success: true,
      message: "Status updated successfully",
      user: result.user,
    });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Get online users for profile cards (minimal data) - MOVED HERE BEFORE /:userId
router.get("/online", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const {
      page = 1, // Page number (1-based)
      limit = 10, // Items per page
      refresh = false, // Force refresh cache
    } = req.query;

    console.log("🌐 Online users request from:", currentUserId);
    console.log("📊 Pagination params - page:", page, "limit:", limit);

    // Validate parameters
    const validatedLimit = Math.min(Math.max(parseInt(limit), 1), 50);
    const validatedPage = Math.max(parseInt(page), 1);
    const validatedOffset = (validatedPage - 1) * validatedLimit;

    // Cache key
    const cacheKey = `online_users_${currentUserId}_${validatedPage}_${validatedLimit}`;

    // Return cached data if available
    if (!refresh && onlineUsersCache.has(cacheKey)) {
      const cachedData = onlineUsersCache.get(cacheKey);
      console.log("📦 Returning cached online users data");
      return res.json(cachedData);
    }

    console.log("🔄 Fetching fresh online users data from database");

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("status", "online")
      .eq("is_active", true)
      .neq("id", currentUserId);

    if (countError) {
      console.error("❌ Error getting total count:", countError);
      return res.status(500).json({
        success: false,
        error: "Failed to get total count",
      });
    }

    // Fetch online users with pricing data using LEFT JOIN
    const { data: onlineUsers, error } = await supabaseAdmin
      .from("users")
      .select(
        `
        id,
        name,
        age,
        avatar_url,
        bio,
        location,
        status,
        last_seen,
        is_active,
        user_pricing(
          sms_cost,
          audio_call_cost,
          video_call_cost,
          is_active
        )
      `
      )
      .eq("status", "online")
      .eq("is_active", true)
      .neq("id", currentUserId)
      .order("last_seen", { ascending: false })
      .range(validatedOffset, validatedOffset + validatedLimit - 1);

    if (error) {
      console.error("❌ Database error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch online users",
      });
    }

    // Process users with pricing data
    const usersWithPricing = onlineUsers.map((user) => {
      // Get pricing data or use defaults
      const pricing =
        user.user_pricing && user.user_pricing.length > 0
          ? user.user_pricing[0]
          : {
              sms_cost: 10.0,
              audio_call_cost: 25.0,
              video_call_cost: 50.0,
            };

      // Calculate dynamic costs based on user attributes
      let smsCost = parseFloat(pricing.sms_cost);
      let audioCallCost = parseFloat(pricing.audio_call_cost);
      let videoCallCost = parseFloat(pricing.video_call_cost);

      // Adjust costs based on user attributes
      if (user.age && user.age < 25) {
        smsCost += 5; // Younger users cost more
        audioCallCost += 10;
        videoCallCost += 20;
      }

      if (
        user.location &&
        (user.location === "New York" || user.location === "Los Angeles")
      ) {
        smsCost += 3; // Premium locations cost more
        audioCallCost += 8;
        videoCallCost += 15;
      }

      return {
        id: user.id,
        name: user.name,
        age: user.age,
        profile_picture: user.avatar_url,
        bio: user.bio,
        location: user.location,
        status: user.status,
        last_seen: user.last_seen,
        is_active: user.is_active,
        pricing: {
          sms_cost: Math.round(smsCost * 100) / 100,
          audio_call_cost: Math.round(audioCallCost * 100) / 100,
          video_call_cost: Math.round(videoCallCost * 100) / 100,
        },
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil((totalCount || 0) / validatedLimit);
    const hasNextPage = validatedPage < totalPages;
    const hasPrevPage = validatedPage > 1;

    const response = {
      success: true,
      users: usersWithPricing,
      pagination: {
        currentPage: validatedPage,
        totalPages: totalPages,
        totalUsers: totalCount || 0,
        usersPerPage: validatedLimit,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
        nextPage: hasNextPage ? validatedPage + 1 : null,
        prevPage: hasPrevPage ? validatedPage - 1 : null,
      },
      cached: false,
      timestamp: new Date().toISOString(),
    };

    // Cache the response
    onlineUsersCache.set(cacheKey, response);
    console.log(
      `✅ Cached ${onlineUsers.length} online users (page ${validatedPage}/${totalPages})`
    );

    res.json(response);
  } catch (error) {
    console.error("❌ Error in online users API:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Get user by ID (public profile)
router.get("/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.userId) {
      // User is requesting their own profile, return full data
      const result = await userService.getUserById(userId);

      if (!result.success) {
        return res.status(404).json({
          error: "User not found",
          message: result.error,
        });
      }

      return res.json({
        success: true,
        user: result.user,
      });
    }

    // For other users, return limited public data
    const result = await userService.getUserById(userId);

    if (!result.success) {
      return res.status(404).json({
        error: "User not found",
        message: result.error,
      });
    }

    // Return only public profile data
    const publicProfile = {
      id: result.user.id,
      name: result.user.name,
      avatar_url: result.user.avatar_url,
      bio: result.user.bio,
      location: result.user.location,
      is_verified: result.user.is_verified,
      profile_completion_percentage: result.user.profile_completion_percentage,
      created_at: result.user.created_at,
    };

    // Log activity
    await userService.logActivity(req.user.userId, "profile_viewed", {
      viewedUserId: userId,
    });

    res.json({
      success: true,
      user: publicProfile,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Get full user profile (when user clicks on profile card)
router.get("/profile/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`👤 Fetching full profile for user: ${userId}`);

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("❌ Database error:", error);
      return res.status(500).json({
        success: false,
        error: "Database error",
      });
    }

    if (!user) {
      console.log("❌ User not found:", userId);
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    console.log(`✅ Profile fetched successfully for user: ${userId}`);

    res.json({
      success: true,
      user: user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

module.exports = router;
