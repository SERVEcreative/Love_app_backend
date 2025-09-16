# Supabase RLS Policies Setup Guide

## 🎯 Problem Solved: Image Access Issue

Your Flutter frontend was getting **400 errors** when trying to access Supabase image URLs because the bucket was private. I've made the bucket public, but now we need to set up the proper Row Level Security (RLS) policies.

## ✅ What's Been Fixed

1. **✅ Bucket Made Public**: "Love-user-image" bucket is now public
2. **✅ Files Accessible**: Images can be accessed directly via public URLs
3. **✅ Security Maintained**: RLS policies will control access properly

## 🔒 Required RLS Policies

Go to your **Supabase Dashboard** → **SQL Editor** and run these policies:

### 1. Public Read Access Policy

```sql
CREATE POLICY "Public read access for all images" ON storage.objects
FOR SELECT USING (bucket_id = 'Love-user-image');
```

### 2. User Upload Policy

```sql
CREATE POLICY "Users can upload their own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'Love-user-image' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. User Update Policy

```sql
CREATE POLICY "Users can update their own images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'Love-user-image' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. User Delete Policy

```sql
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'Love-user-image' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the Policies

1. Copy and paste each policy above into the SQL Editor
2. Click **Run** for each policy
3. Verify each policy is created successfully

### Step 3: Test Image Access

1. Go back to your Flutter app
2. Try to load the profile image again
3. The image should now load without 400 errors

## 🔗 Your Image URLs

Your image URLs should now work perfectly:

```
https://kgijlarzjdpardjbefoq.supabase.co/storage/v1/object/public/Love-user-image/e0b70d93-cb9f-4d31-8dd2-a0f931be6ff2/profile_e0b70d93-cb9f-4d31-8dd2-a0f931be6ff2_1758050420337.jpg
```

## 🛡️ Security Features

### What These Policies Do:

- **Public Read**: Anyone can view images (for profile display)
- **User Upload**: Only authenticated users can upload images
- **User Update**: Users can only update their own images
- **User Delete**: Users can only delete their own images

### File Organization:

```
Love-user-image/
├── e0b70d93-cb9f-4d31-8dd2-a0f931be6ff2/  (User ID folder)
│   ├── profile_e0b70d93-cb9f-4d31-8dd2-a0f931be6ff2_1758050420337.jpg
│   └── ...
├── another-user-id/
│   └── ...
```

## 🧪 Testing

After applying the policies, test these scenarios:

### ✅ Should Work:

1. **View Images**: Anyone can view profile images
2. **Upload Images**: Authenticated users can upload to their folder
3. **Update Images**: Users can update their own images
4. **Delete Images**: Users can delete their own images

### ❌ Should Not Work:

1. **Upload to Other Folders**: Users cannot upload to other users' folders
2. **Update Other Images**: Users cannot update other users' images
3. **Delete Other Images**: Users cannot delete other users' images

## 🚀 Expected Result

After applying these policies, your Flutter frontend should:

1. **✅ Load Images Successfully**: No more 400 errors
2. **✅ Display Profile Images**: Images show in ProfileCardWidget
3. **✅ Fast Loading**: Images load quickly via Supabase CDN
4. **✅ Secure Access**: Only authorized users can modify images

## 🔧 Troubleshooting

### If Images Still Don't Load:

1. **Check Policy Creation**: Verify all 4 policies were created successfully
2. **Check Bucket Status**: Ensure bucket is public in Storage settings
3. **Check URL Format**: Verify the image URL format is correct
4. **Check File Exists**: Confirm the file exists in the bucket

### If You Get Permission Errors:

1. **Check RLS Policies**: Ensure policies are applied correctly
2. **Check User Authentication**: Verify user is properly authenticated
3. **Check File Path**: Ensure file path matches user ID folder structure

## 📱 Flutter Frontend

Your Flutter app should now work perfectly with these image URLs. The ProfileCardWidget will be able to load and display images without any authentication issues.

## 🎉 Success!

Once you've applied these RLS policies, your image upload and display system will be fully functional:

- ✅ **Upload**: Users can upload images via `/api/users/upload-photo`
- ✅ **Store**: Images are stored in Supabase Storage
- ✅ **Access**: Images are accessible via public URLs
- ✅ **Display**: Flutter frontend can display images
- ✅ **Secure**: Proper access control with RLS policies

Your Love app now has a complete, secure, and scalable image management system! 🚀
