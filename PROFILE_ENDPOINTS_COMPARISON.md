# Profile Endpoints Comparison

## Overview

You now have two distinct profile endpoints that serve different purposes:

1. **`/api/auth/profile`** - **Public Profile** (for Flutter ProfileCardWidget)
2. **`/api/users/profile`** - **Detailed Profile** (for admin/user management)

## 📊 Endpoint Comparison

### 1. **`/api/auth/profile`** - Public Profile Endpoint

**Purpose**: Provides clean, formatted data for Flutter ProfileCardWidget display

**Response Structure**:
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "profile": {
    "id": "uuid",
    "phoneNumber": "+1234567890",
    "fullName": "John Doe",
    "email": "john@example.com",
    "age": 25,
    "gender": "male",
    "location": "New York",
    "bio": "User bio",
    
    // Profile Images
    "image": "https://example.com/photo.jpg",
    "avatarUrl": "https://example.com/avatar.jpg",
    "photos": [
      {
        "id": "photo-1",
        "url": "https://example.com/photo1.jpg",
        "isPrimary": true,
        "order": 1
      }
    ],
    
    // Status & Activity
    "online": true,
    "lastSeen": "2 hours ago",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:45:00.000Z",
    "lastLoginAt": "2024-01-20T14:45:00.000Z",
    "loginCount": 15,
    
    // Verification & Status
    "isVerified": true,
    "verificationStatus": "verified",
    "isActive": true,
    "isPremium": false,
    "profileCompletionPercentage": 85,
    
    // Interests
    "interests": ["Photography", "Travel", "Music"],
    
    // Preferences
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

**Key Features**:
- ✅ **Flutter-ready format** - Perfect for ProfileCardWidget
- ✅ **Clean data structure** - No internal IDs or raw data
- ✅ **Calculated fields** - Age, formatted last seen, etc.
- ✅ **Only approved photos** - Filters out pending/rejected photos
- ✅ **Formatted interests** - Simple string array
- ✅ **User-friendly** - Designed for frontend consumption

---

### 2. **`/api/users/profile`** - Detailed Profile Endpoint

**Purpose**: Provides comprehensive user data for admin management and detailed user information

**Response Structure**:
```json
{
  "success": true,
  "message": "Detailed profile fetched successfully",
  "user": {
    // Basic Information
    "id": "uuid",
    "phoneNumber": "+1234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "age": 25,
    "gender": "male",
    "location": "New York",
    "bio": "User bio",
    "avatarUrl": "https://example.com/avatar.jpg",
    "dateOfBirth": "1999-01-15",
    
    // Status & Activity
    "status": "online",
    "lastSeen": "2 hours ago",
    "lastSeenRaw": "2024-01-20T12:45:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:45:00.000Z",
    "lastLoginAt": "2024-01-20T14:45:00.000Z",
    "loginCount": 15,
    
    // Verification & Status
    "isVerified": true,
    "verificationStatus": "verified",
    "verificationDate": "2024-01-18T10:00:00.000Z",
    "isActive": true,
    "isPremium": false,
    "profileCompletionPercentage": 85,
    
    // Device & Network
    "deviceId": "device-123",
    "ipAddress": "192.168.1.1",
    
    // Statistics
    "connectionsCount": 25,
    "photosCount": 5,
    "interestsCount": 3,
    "documentsCount": 2,
    "activeSessionsCount": 1,
    
    // Detailed Related Data
    "preferences": {
      "id": "pref-uuid",
      "pushNotifications": true,
      "emailNotifications": true,
      "smsNotifications": false,
      "privacyLevel": "public",
      "showOnlineStatus": true,
      "showLastSeen": true,
      "allowProfileViews": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:45:00.000Z"
    },
    
    "photos": [
      {
        "id": "photo-uuid",
        "url": "https://example.com/photo.jpg",
        "order": 1,
        "isPrimary": true,
        "isApproved": true,
        "createdAt": "2024-01-16T10:00:00.000Z"
      }
    ],
    
    "interests": [
      {
        "id": "interest-uuid",
        "name": "Photography",
        "category": "Hobbies",
        "createdAt": "2024-01-17T10:00:00.000Z"
      }
    ],
    
    "documents": [
      {
        "id": "doc-uuid",
        "type": "id_card",
        "url": "https://example.com/doc.jpg",
        "verificationStatus": "approved",
        "verifiedAt": "2024-01-18T10:00:00.000Z",
        "verifiedBy": "admin-uuid",
        "rejectionReason": null,
        "createdAt": "2024-01-17T10:00:00.000Z"
      }
    ],
    
    "recentActivity": [
      {
        "id": "activity-uuid",
        "type": "profile_updated",
        "details": { "updatedFields": ["name", "bio"] },
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2024-01-20T14:45:00.000Z"
      }
    ],
    
    "activeSessions": [
      {
        "id": "session-uuid",
        "sessionId": "session-123",
        "socketId": "socket-456",
        "connectionType": "mobile",
        "deviceInfo": { "platform": "iOS", "version": "17.0" },
        "lastHeartbeat": "2024-01-20T14:45:00.000Z",
        "expiresAt": "2024-01-20T15:45:00.000Z",
        "createdAt": "2024-01-20T13:45:00.000Z"
      }
    ]
  }
}
```

**Key Features**:
- ✅ **Complete data** - All user information including internal IDs
- ✅ **Raw data included** - Both formatted and raw timestamps
- ✅ **All photos** - Including pending and rejected photos
- ✅ **Detailed statistics** - Counts for all related data
- ✅ **Activity tracking** - Recent user activity logs
- ✅ **Session management** - Active user sessions
- ✅ **Document verification** - All verification documents
- ✅ **Admin-friendly** - Designed for backend management

---

## 🎯 Usage Guidelines

### Use `/api/auth/profile` for:
- ✅ **Flutter ProfileCardWidget** display
- ✅ **Public profile views** (other users viewing profiles)
- ✅ **Frontend consumption** (clean, formatted data)
- ✅ **Mobile app** profile screens
- ✅ **Quick profile** information

### Use `/api/users/profile` for:
- ✅ **Admin dashboard** user management
- ✅ **User settings** page (detailed preferences)
- ✅ **Profile editing** (showing all photos, including pending)
- ✅ **Analytics** and user statistics
- ✅ **Debugging** user issues
- ✅ **Backend operations** requiring complete user data

---

## 🔧 Implementation Examples

### Flutter App (Use `/api/auth/profile`)
```dart
// In your Flutter app
final response = await http.get(
  Uri.parse('$baseUrl/api/auth/profile'),
  headers: {'Authorization': 'Bearer $token'},
);

final profileData = json.decode(response.body)['profile'];
// Use directly in ProfileCardWidget
ProfileCardWidget(userProfile: profileData);
```

### Admin Dashboard (Use `/api/users/profile`)
```javascript
// In your admin dashboard
const response = await fetch('/api/users/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const userData = await response.json();
// Use for detailed user management
showUserDetails(userData.user);
```

### Profile Settings (Use `/api/users/profile`)
```javascript
// In your profile settings page
const detailedProfile = await fetch('/api/users/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Show all photos (including pending)
const allPhotos = detailedProfile.user.photos;
// Show detailed preferences
const preferences = detailedProfile.user.preferences;
```

---

## 📱 Response Size Comparison

| Endpoint | Approximate Size | Use Case |
|----------|------------------|----------|
| `/api/auth/profile` | ~2-3 KB | Frontend display |
| `/api/users/profile` | ~8-12 KB | Backend management |

---

## 🚀 Benefits of This Approach

1. **Clear Separation**: Each endpoint has a specific purpose
2. **Performance**: Frontend gets only what it needs
3. **Security**: Admin data is separate from public data
4. **Maintainability**: Easy to modify each endpoint independently
5. **Scalability**: Can optimize each endpoint for its use case

This approach eliminates confusion and provides the right data for each use case! 🎉
