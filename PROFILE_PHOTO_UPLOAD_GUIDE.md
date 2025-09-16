# Profile Photo Upload Guide

## Updated Profile Update Endpoint

The profile update endpoint (`PUT /api/auth/profile`) now supports photo uploads alongside regular profile data updates.

## Request Format

### Endpoint

```
PUT /api/auth/profile
```

### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "bio": "Love to travel and meet new people",
  "location": "New York, NY",
  "gender": "male",
  "age": 25,
  "avatarUrl": "https://example.com/avatar.jpg",
  "photos": [
    {
      "url": "https://example.com/photo1.jpg",
      "is_primary": true,
      "photo_order": 1
    },
    {
      "url": "https://example.com/photo2.jpg",
      "is_primary": false,
      "photo_order": 2
    }
  ]
}
```

### Photo Object Schema

| Field         | Type         | Required | Description                                                |
| ------------- | ------------ | -------- | ---------------------------------------------------------- |
| `url`         | string (URI) | Yes      | URL of the uploaded photo                                  |
| `is_primary`  | boolean      | No       | Whether this is the primary profile photo (default: false) |
| `photo_order` | number       | No       | Display order of the photo (default: auto-increment)       |

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile": {
    "id": "user-uuid",
    "fullName": "John Doe",
    "email": "john@example.com",
    "bio": "Love to travel and meet new people",
    "location": "New York, NY",
    "gender": "male",
    "avatarUrl": "https://example.com/avatar.jpg",
    "profileCompletionPercentage": 85,
    "updatedAt": "2025-01-15T18:45:00.000Z"
  },
  "photos": {
    "total": 3,
    "uploaded": 2,
    "list": [
      {
        "id": "photo-uuid-1",
        "url": "https://example.com/photo1.jpg",
        "isPrimary": true,
        "order": 1,
        "createdAt": "2025-01-15T18:45:00.000Z"
      },
      {
        "id": "photo-uuid-2",
        "url": "https://example.com/photo2.jpg",
        "isPrimary": false,
        "order": 2,
        "createdAt": "2025-01-15T18:45:00.000Z"
      }
    ]
  }
}
```

## Key Features

### 1. **Flexible Photo Upload**

- Upload multiple photos in a single request
- Set primary photo (only one primary photo per user)
- Auto-ordering of photos
- Photo approval system (auto-approved by default)

### 2. **Primary Photo Management**

- When a photo is marked as `is_primary: true`, all other photos are automatically set to `is_primary: false`
- Only one primary photo per user is maintained

### 3. **Activity Logging**

- Photo uploads are logged in the `user_activity_logs` table
- Tracks photo count and photo IDs for audit purposes

### 4. **Error Handling**

- Profile updates succeed even if photo uploads fail
- Detailed error logging for debugging
- Graceful degradation

### 5. **Profile Completion**

- Profile completion percentage is automatically calculated
- Includes photo count in completion calculation

## Usage Examples

### Update Profile with Photos (Flutter/Dart)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ProfileService {
  static Future<Map<String, dynamic>> updateProfile({
    required String token,
    String? name,
    String? email,
    String? bio,
    String? location,
    String? gender,
    int? age,
    String? avatarUrl,
    List<Map<String, dynamic>>? photos,
  }) async {
    final response = await http.put(
      Uri.parse('http://your-server:5000/api/auth/profile'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        if (name != null) 'name': name,
        if (email != null) 'email': email,
        if (bio != null) 'bio': bio,
        if (location != null) 'location': location,
        if (gender != null) 'gender': gender,
        if (age != null) 'age': age,
        if (avatarUrl != null) 'avatarUrl': avatarUrl,
        if (photos != null) 'photos': photos,
      }),
    );

    return jsonDecode(response.body);
  }
}

// Usage example
final result = await ProfileService.updateProfile(
  token: userToken,
  name: 'John Doe',
  bio: 'Love to travel and meet new people',
  photos: [
    {
      'url': 'https://example.com/photo1.jpg',
      'is_primary': true,
      'photo_order': 1,
    },
    {
      'url': 'https://example.com/photo2.jpg',
      'is_primary': false,
      'photo_order': 2,
    },
  ],
);
```

### Update Profile with Photos (JavaScript/React)

```javascript
const updateProfileWithPhotos = async (profileData, photos) => {
  const response = await fetch("/api/auth/profile", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...profileData,
      photos: photos.map((photo, index) => ({
        url: photo.url,
        is_primary: photo.is_primary || false,
        photo_order: photo.photo_order || index + 1,
      })),
    }),
  });

  return await response.json();
};

// Usage example
const result = await updateProfileWithPhotos(
  {
    name: "John Doe",
    bio: "Love to travel and meet new people",
    location: "New York, NY",
  },
  [
    {
      url: "https://example.com/photo1.jpg",
      is_primary: true,
    },
    {
      url: "https://example.com/photo2.jpg",
      is_primary: false,
    },
  ]
);
```

## Testing the Endpoint

### Using cURL

```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "bio": "Love to travel and meet new people",
    "photos": [
      {
        "url": "https://example.com/photo1.jpg",
        "is_primary": true,
        "photo_order": 1
      },
      {
        "url": "https://example.com/photo2.jpg",
        "is_primary": false,
        "photo_order": 2
      }
    ]
  }'
```

## Database Schema

The photos are stored in the `user_photos` table:

```sql
CREATE TABLE user_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Notes

1. **Photo URLs**: The system expects pre-uploaded photo URLs. You'll need to implement a separate file upload endpoint for actual file handling.

2. **Primary Photo**: Only one photo can be marked as primary. Setting a new primary photo automatically unsets the previous one.

3. **Photo Order**: Photos are displayed in the order specified by `photo_order` field.

4. **Approval**: Photos are auto-approved by default. You can modify this behavior for moderation purposes.

5. **Error Handling**: The endpoint is designed to be resilient - profile updates succeed even if photo uploads fail.

## Next Steps

1. Implement a file upload endpoint for actual photo uploads
2. Add photo validation (size, format, content moderation)
3. Implement photo compression and optimization
4. Add photo deletion functionality
5. Consider implementing photo approval workflow for moderation
