# Profile API Documentation

## Overview

The Profile API provides endpoints to fetch and update user profile information. All endpoints require JWT authentication.

## Base URL
```
http://localhost:5000/api/auth
```

## Authentication

All profile endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Get User Profile

**GET** `/profile`

Fetches complete user profile information including basic details, photos, interests, and preferences.

#### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Response

**Success (200)**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "profile": {
    "id": "uuid-string",
    "phoneNumber": "+916204691688",
    "fullName": "John Doe",
    "email": "john@example.com",
    "age": 25,
    "gender": "male",
    "location": "Mumbai, India",
    "bio": "Love traveling and photography",
    "image": "https://example.com/primary-photo.jpg",
    "avatarUrl": "https://example.com/avatar.jpg",
    "photos": [
      {
        "id": "photo-uuid",
        "url": "https://example.com/photo1.jpg",
        "isPrimary": true,
        "order": 1
      }
    ],
    "online": true,
    "lastSeen": "Just now",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:45:00.000Z",
    "lastLoginAt": "2024-01-20T14:45:00.000Z",
    "loginCount": 15,
    "isVerified": true,
    "verificationStatus": "verified",
    "isActive": true,
    "isPremium": false,
    "profileCompletionPercentage": 85,
    "interests": ["Photography", "Travel", "Music"],
    "preferences": {
      "pushNotifications": true,
      "emailNotifications": true,
      "smsNotifications": false,
      "privacyLevel": "public",
      "showOnlineStatus": true,
      "showLastSeen": true,
      "allowProfileViews": true
    }
  }
}
```

**Error Responses**

- **401 Unauthorized**: Invalid or missing token
- **404 Not Found**: User profile not found
- **500 Internal Server Error**: Server error

---

### 2. Update User Profile

**PUT** `/profile`

Updates user profile information. Only provided fields will be updated.

#### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "bio": "Love traveling and photography",
  "location": "Mumbai, India",
  "gender": "male",
  "dateOfBirth": "1999-05-15",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Full name (2-100 characters) |
| `email` | string | No | Valid email address |
| `bio` | string | No | User bio (max 500 characters) |
| `location` | string | No | User location (max 255 characters) |
| `gender` | string | No | One of: "male", "female", "other", "prefer_not_to_say" |
| `dateOfBirth` | date | No | Date of birth (YYYY-MM-DD format) |
| `avatarUrl` | string | No | URL to avatar image |

#### Response

**Success (200)**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile": {
    "id": "uuid-string",
    "fullName": "John Doe",
    "email": "john@example.com",
    "bio": "Love traveling and photography",
    "location": "Mumbai, India",
    "gender": "male",
    "avatarUrl": "https://example.com/new-avatar.jpg",
    "profileCompletionPercentage": 85,
    "updatedAt": "2024-01-20T15:30:00.000Z"
  }
}
```

**Error Responses**

- **400 Bad Request**: Validation error
- **401 Unauthorized**: Invalid or missing token
- **500 Internal Server Error**: Server error

---

## Profile Data Structure

### Basic Information
- `id`: Unique user identifier
- `phoneNumber`: User's phone number
- `fullName`: User's full name
- `email`: User's email address
- `age`: Calculated age from date of birth
- `gender`: User's gender
- `location`: User's location
- `bio`: User's bio/description

### Images
- `image`: Primary profile image URL
- `avatarUrl`: Avatar image URL
- `photos`: Array of user photos with metadata

### Status & Activity
- `online`: Current online status
- `lastSeen`: Formatted last seen time
- `createdAt`: Account creation date
- `updatedAt`: Last profile update
- `lastLoginAt`: Last login timestamp
- `loginCount`: Total login count

### Verification & Status
- `isVerified`: Email/phone verification status
- `verificationStatus`: Detailed verification status
- `isActive`: Account active status
- `isPremium`: Premium membership status
- `profileCompletionPercentage`: Profile completion percentage

### Additional Data
- `interests`: Array of user interests
- `preferences`: User preferences object

---

## Flutter Integration

### 1. Model Class
Use the provided `UserProfileModel` class in your Flutter project.

### 2. API Service
```dart
// Fetch profile
final profile = await ProfileApiService.fetchProfile(token);

// Update profile
final updatedProfile = await ProfileApiService.updateProfile(
  token, 
  {'name': 'New Name', 'bio': 'New bio'}
);
```

### 3. Widget Usage
```dart
ProfileCardWidget(userProfile: userProfile)
```

---

## Error Handling

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Validation error | Check request body format |
| 401 | Authentication failed | Verify JWT token |
| 404 | Profile not found | Check if user exists |
| 429 | Rate limit exceeded | Wait before retrying |
| 500 | Server error | Check server logs |

### Error Response Format
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "details": "Additional error details (if available)"
}
```

---

## Testing

### Test Script
Run the test script to verify the profile endpoints:
```bash
node test-profile-fetch.js
```

### Manual Testing with cURL

**Get Profile:**
```bash
curl -X GET "http://localhost:5000/api/auth/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Update Profile:**
```bash
curl -X PUT "http://localhost:5000/api/auth/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "bio": "Updated bio",
    "location": "Mumbai, India"
  }'
```

---

## Security Features

- ✅ JWT token authentication
- ✅ Input validation and sanitization
- ✅ Rate limiting protection
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CORS configuration

---

## Rate Limiting

Profile endpoints are subject to rate limiting:
- **Get Profile**: 100 requests per minute
- **Update Profile**: 10 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642680000
```

---

## Notes

1. **Profile Completion**: Automatically calculated based on filled fields
2. **Age Calculation**: Automatically calculated from date of birth
3. **Last Seen**: Formatted for user-friendly display
4. **Photos**: Ordered by primary status and custom order
5. **Preferences**: Default values provided if not set
6. **Interests**: Array of interest names from database
