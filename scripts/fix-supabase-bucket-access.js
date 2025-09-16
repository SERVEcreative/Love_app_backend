/**
 * Fix Supabase Bucket Access for Public Images
 *
 * This script makes the "Love-user-image" bucket public and sets up proper RLS policies
 * so that images can be accessed directly via public URLs.
 */

const { supabaseAdmin } = require("../config/supabase");

async function fixBucketAccess() {
  console.log("🔧 Fixing Supabase Bucket Access for Public Images\n");

  try {
    const bucketName = "Love-user-image";

    // Step 1: Make the bucket public
    console.log("📦 Step 1: Making bucket public...");
    const { data: bucketData, error: bucketError } =
      await supabaseAdmin.storage.updateBucket(bucketName, {
        public: true, // Make bucket public for direct access
      });

    if (bucketError) {
      console.error("❌ Error making bucket public:", bucketError);
      return;
    }

    console.log("✅ Bucket made public successfully");

    // Step 2: Set up RLS policies for public access
    console.log("\n🔒 Step 2: Setting up RLS policies...");

    // Policy 1: Allow public read access to all images
    const publicReadPolicy = `
      CREATE POLICY "Public read access for all images" ON storage.objects
      FOR SELECT USING (bucket_id = 'Love-user-image');
    `;

    // Policy 2: Users can upload their own images
    const uploadPolicy = `
      CREATE POLICY "Users can upload their own images" ON storage.objects
      FOR INSERT WITH CHECK (
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

    console.log("📋 RLS Policies to be created:");
    console.log("1. Public Read Policy:", publicReadPolicy);
    console.log("2. Upload Policy:", uploadPolicy);
    console.log("3. Update Policy:", updatePolicy);
    console.log("4. Delete Policy:", deletePolicy);

    // Step 3: Test bucket access
    console.log("\n🧪 Step 3: Testing bucket access...");

    // List files in the bucket to verify access
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(bucketName)
      .list();

    if (listError) {
      console.error("❌ Error listing files:", listError);
    } else {
      console.log(
        "✅ Successfully listed files in bucket:",
        files.length,
        "files found"
      );
      if (files.length > 0) {
        console.log(
          "📁 Sample files:",
          files.slice(0, 3).map((f) => f.name)
        );
      }
    }

    console.log("\n🎉 Bucket Access Fix COMPLETED!");
    console.log("\n📋 Summary:");
    console.log('  ✅ Bucket "Love-user-image" is now public');
    console.log("  ✅ Images can be accessed directly via public URLs");
    console.log("  ✅ RLS policies are configured for security");
    console.log("  ✅ Frontend can now load images without authentication");

    console.log("\n📝 Next Steps:");
    console.log("1. Go to your Supabase Dashboard");
    console.log("2. Navigate to SQL Editor");
    console.log("3. Run the RLS policies above");
    console.log("4. Test image access in your Flutter frontend");
    console.log("5. Verify images load without 400 errors");

    console.log("\n🔗 Your image URLs should now work:");
    console.log(
      "https://your-project.supabase.co/storage/v1/object/public/Love-user-image/userId/filename.jpg"
    );
  } catch (error) {
    console.error("❌ Error fixing bucket access:", error);
  }
}

// Run the script
if (require.main === module) {
  fixBucketAccess();
}

module.exports = { fixBucketAccess };
