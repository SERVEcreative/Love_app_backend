/**
 * Create Supabase Storage Bucket for User Images
 *
 * This script creates a bucket named "Love-user-image" in Supabase Storage
 * with appropriate security policies for user profile images.
 */

const { supabaseAdmin } = require("../config/supabase");

async function createUserImageBucket() {
  console.log("🚀 Creating Supabase Storage Bucket for User Images\n");

  try {
    const bucketName = "Love-user-image";

    // Check if bucket already exists
    console.log("🔍 Checking if bucket already exists...");
    const { data: existingBuckets, error: listError } =
      await supabaseAdmin.storage.listBuckets();

    if (listError) {
      console.error("❌ Error listing buckets:", listError);
      return;
    }

    const bucketExists = existingBuckets.some(
      (bucket) => bucket.name === bucketName
    );

    if (bucketExists) {
      console.log(`✅ Bucket "${bucketName}" already exists`);
      return;
    }

    // Create the bucket
    console.log(`📦 Creating bucket "${bucketName}"...`);
    const { data: bucket, error: createError } =
      await supabaseAdmin.storage.createBucket(bucketName, {
        public: false, // Private bucket for security
        fileSizeLimit: 5242880, // 5MB limit
        allowedMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ],
      });

    if (createError) {
      console.error("❌ Error creating bucket:", createError);
      return;
    }

    console.log("✅ Bucket created successfully:", bucket);

    // Create security policies for the bucket
    console.log("🔒 Setting up security policies...");

    // Policy 1: Users can upload their own images
    const uploadPolicy = `
      CREATE POLICY "Users can upload their own images" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'Love-user-image' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
    `;

    // Policy 2: Users can view their own images
    const viewPolicy = `
      CREATE POLICY "Users can view their own images" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'Love-user-image' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
    `;

    // Policy 3: Users can update their own images
    const updatePolicy = `
      CREATE POLICY "Users can update their own images" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'Love-user-image' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
    `;

    // Policy 4: Users can delete their own images
    const deletePolicy = `
      CREATE POLICY "Users can delete their own images" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'Love-user-image' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
    `;

    // Execute policies (Note: These would need to be run in Supabase SQL editor)
    console.log("📋 Security policies to be created:");
    console.log("1. Upload Policy:", uploadPolicy);
    console.log("2. View Policy:", viewPolicy);
    console.log("3. Update Policy:", updatePolicy);
    console.log("4. Delete Policy:", deletePolicy);

    console.log("\n🎉 Bucket setup completed!");
    console.log("\n📝 Next Steps:");
    console.log("1. Go to your Supabase Dashboard");
    console.log("2. Navigate to SQL Editor");
    console.log("3. Run the security policies above");
    console.log("4. Test the image upload functionality");
  } catch (error) {
    console.error("❌ Error creating bucket:", error);
  }
}

// Run the script
if (require.main === module) {
  createUserImageBucket();
}

module.exports = { createUserImageBucket };
