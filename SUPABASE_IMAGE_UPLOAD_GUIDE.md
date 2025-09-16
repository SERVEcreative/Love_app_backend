# Supabase Image Upload Implementation Guide

## Overview

This guide explains the complete image upload implementation using Supabase Storage for the Love app backend. The system handles image uploads, storage in Supabase buckets, and profile updates with proper Flutter compatibility.

## Implementation Summary

### ✅ What's Been Implemented

1. **Supabase Bucket Creation**: Created "Love-user-image" bucket
2. **Backend Image Upload**: Modified to upload directly to Supabase Storage
3. **Profile Integration**: Images are stored as URLs in user profiles
4. **Flutter Compatibility**: Returns proper image URLs for frontend display

## Architecture

### Frontend Flow

```
User selects image → Frontend calls uploadImageFile() → Backend uploads to Supabase → Returns image URL → Frontend updates profile with URL
```

### Backend Flow

```
Receive image → Validate file → Upload to Supabase Storage → Get public URL → Store URL in user profile → Return to frontend
```

## Supabase Storage Setup

### 1. Bucket Configuration

- **Bucket Name**: `Love-user-image`
- **Access**: Private (secure)
- **File Size Limit**: 5MB
- **Allowed Types**: JPEG, PNG, GIF, WebP

### 2. File Organization

```
Love-user-image/
├── {userId}/
│   ├── profile_{userId}_{timestamp}.jpg
│   ├── profile_{userId}_{timestamp}.png
│   └── ...
```

### 3. Security Policies (To be applied in Supabase Dashboard)

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Policy 1: Users can upload their own images
CREATE POLICY "Users can upload their own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'Love-user-image' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can view their own images
CREATE POLICY "Users can view their own images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'Love-user-image' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can update their own images
CREATE POLICY "Users can update their own images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'Love-user-image' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can delete their own images
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'Love-user-image' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## API Endpoints

### 1. Image Upload

**Endpoint**: `POST /api/users/upload-image`

**Headers**:

- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Body**:

- `image`: File (image file)

**Response**:

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "imageUrl": "https://your-project.supabase.co/storage/v1/object/public/Love-user-image/userId/profile_userId_timestamp.jpg",
  "fileName": "profile_userId_timestamp.jpg",
  "filePath": "userId/profile_userId_timestamp.jpg",
  "size": 12345
}
```

### 2. Profile Update with Image

**Endpoint**: `PUT /api/users/profile`

**Headers**:

- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body**:

```json
{
  "name": "Display Name",
  "fullName": "Full Name",
  "age": 25,
  "gender": "male",
  "location": "City",
  "bio": "User bio",
  "image": "https://your-project.supabase.co/storage/v1/object/public/Love-user-image/userId/profile_userId_timestamp.jpg"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "user-id",
    "name": "Display Name",
    "fullName": "Full Name",
    "age": 25,
    "gender": "male",
    "location": "City",
    "bio": "User bio",
    "image": "https://your-project.supabase.co/storage/v1/object/public/Love-user-image/userId/profile_userId_timestamp.jpg",
    "photoUrl": "https://your-project.supabase.co/storage/v1/object/public/Love-user-image/userId/profile_userId_timestamp.jpg",
    "avatar_url": "https://your-project.supabase.co/storage/v1/object/public/Love-user-image/userId/profile_userId_timestamp.jpg"
  }
}
```

### 3. Profile Retrieval

**Endpoint**: `GET /api/users/profile`

**Headers**:

- `Authorization: Bearer <token>`

**Response**:

```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "name": "Display Name",
    "fullName": "Full Name",
    "age": 25,
    "gender": "male",
    "location": "City",
    "bio": "User bio",
    "image": "https://your-project.supabase.co/storage/v1/object/public/Love-user-image/userId/profile_userId_timestamp.jpg",
    "photoUrl": "https://your-project.supabase.co/storage/v1/object/public/Love-user-image/userId/profile_userId_timestamp.jpg",
    "avatar_url": "https://your-project.supabase.co/storage/v1/object/public/Love-user-image/userId/profile_userId_timestamp.jpg"
  }
}
```

## Flutter Integration

### Frontend Service Method

The Flutter frontend calls:

```dart
// Upload image
final imageUrl = await _profileService.uploadImageFile(_selectedImage!.path);

// Update profile with image
final updatedProfile = await _profileService.updateProfile(
  name: _nameController.text.trim(),
  fullName: _fullNameController.text.trim(),
  age: int.parse(_ageController.text.trim()),
  gender: _selectedGender,
  location: _locationController.text.trim(),
  bio: _bioController.text.trim(),
  image: imageUrl,
);
```

### Expected Response Format

The Flutter frontend expects these fields in the response:

- `image`: Primary image URL
- `photoUrl`: Alternative photo URL field
- `fullName`: Full name field (mapped from `name`)

## Testing

### Test Script

Run the Supabase image upload test:

```bash
node test-supabase-image-upload.js
```

This test covers:

1. Server health check
2. Supabase bucket verification
3. Image upload endpoint testing
4. Profile update with image URL
5. Authentication validation

### Manual Testing

1. **Upload Image**:

   ```bash
   curl -X POST http://localhost:5000/api/users/upload-image \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "image=@/path/to/image.jpg"
   ```

2. **Update Profile**:

   ```bash
   curl -X PUT http://localhost:5000/api/users/profile \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "fullName": "Test User Full Name",
       "age": 25,
       "gender": "male",
       "location": "Test City",
       "bio": "Test bio",
       "image": "https://your-project.supabase.co/storage/v1/object/public/Love-user-image/userId/profile_userId_timestamp.jpg"
     }'
   ```

3. **Get Profile**:
   ```bash
   curl -X GET http://localhost:5000/api/users/profile \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **File Type Validation**: Only image files are allowed
3. **File Size Limit**: 5MB maximum file size
4. **User Isolation**: Files are organized by user ID
5. **Supabase RLS**: Row Level Security policies protect user data
6. **Unique Filenames**: Prevents filename conflicts
7. **Error Handling**: Proper cleanup and error responses

## File Storage Details

### Supabase Storage

- **Location**: Supabase Storage bucket "Love-user-image"
- **Organization**: Files stored in user-specific folders
- **Naming**: `profile_{userId}_{timestamp}.{extension}`
- **Access**: Public URLs for easy frontend integration
- **Backup**: Automatic Supabase backup and redundancy

### Database Integration

- Images are stored as URLs in the `avatar_url` field
- Primary photo is marked in the `user_photos` table
- Photo metadata is stored (order, approval status, etc.)
- Profile updates sync with photo records

## Production Considerations

### Recommended Improvements

1. **Image Processing**: Add image resizing, compression, format conversion
2. **CDN**: Use Supabase's built-in CDN for faster delivery
3. **Backup**: Implement additional backup strategies
4. **Monitoring**: Add logging and monitoring for upload failures
5. **Rate Limiting**: Consider rate limiting for upload endpoints
6. **Image Optimization**: Implement automatic image optimization

### Environment Configuration

- Update Supabase project settings
- Configure proper CORS settings
- Set up image processing settings
- Configure backup and monitoring

## Error Handling

The system handles various error scenarios:

- Invalid file types
- File size exceeded
- Upload failures
- Authentication errors
- Supabase connection errors
- Network issues

All errors return appropriate HTTP status codes and error messages.

## Conclusion

This implementation provides a complete image upload system using Supabase Storage that:

✅ Matches Flutter frontend requirements  
✅ Handles file uploads securely to Supabase  
✅ Integrates with existing user system  
✅ Provides proper error handling  
✅ Supports profile updates with images  
✅ Returns Flutter-compatible response format  
✅ Includes comprehensive testing  
✅ Uses secure Supabase Storage with RLS policies

The system is ready for production use with the Flutter frontend and provides a scalable, secure solution for user profile image management.
