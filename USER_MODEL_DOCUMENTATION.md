# User Model Documentation - Supabase Database Schema

## Overview

This documentation describes the complete user model structure based on your Supabase database schema. The user system consists of multiple related tables that work together to provide comprehensive user management.

## 📊 Database Tables Structure

### 1. **users** (Main Table)
The primary user table containing basic profile information.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique user identifier |
| `phone_number` | VARCHAR(20) | UNIQUE, NOT NULL | User's phone number |
| `name` | VARCHAR(100) | - | User's display name |
| `email` | VARCHAR(255) | UNIQUE | User's email address |
| `avatar_url` | TEXT | - | Profile picture URL |
| `bio` | TEXT | - | User's biography |
| `date_of_birth` | DATE | - | User's birth date |
| `gender` | VARCHAR(20) | CHECK constraint | male, female, other, prefer_not_to_say |
| `location` | VARCHAR(255) | - | User's location |
| `status` | VARCHAR(50) | DEFAULT 'online' | Current online status |
| `last_seen` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last activity timestamp |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Account creation date |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update timestamp |
| `is_verified` | BOOLEAN | DEFAULT FALSE | Email/phone verification status |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account active status |
| `is_premium` | BOOLEAN | DEFAULT FALSE | Premium membership status |
| `device_id` | VARCHAR(255) | - | Device identifier |
| `ip_address` | INET | - | User's IP address |
| `verification_status` | VARCHAR(20) | DEFAULT 'pending' | pending, verified, blocked |
| `verification_date` | TIMESTAMP WITH TIME ZONE | - | Verification completion date |
| `profile_completion_percentage` | INTEGER | 0-100 | Profile completion score |
| `last_login_at` | TIMESTAMP WITH TIME ZONE | - | Last login timestamp |
| `login_count` | INTEGER | DEFAULT 0 | Total login count |

### 2. **user_preferences** (User Settings)
User preferences and app settings.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | UUID | PRIMARY KEY | Unique preference identifier |
| `user_id` | UUID | FOREIGN KEY | References users(id) |
| `push_notifications` | BOOLEAN | TRUE | Enable push notifications |
| `email_notifications` | BOOLEAN | TRUE | Enable email notifications |
| `sms_notifications` | BOOLEAN | FALSE | Enable SMS notifications |
| `privacy_level` | VARCHAR(20) | 'public' | public, friends, private |
| `show_online_status` | BOOLEAN | TRUE | Show online status to others |
| `show_last_seen` | BOOLEAN | TRUE | Show last seen to others |
| `allow_profile_views` | BOOLEAN | TRUE | Allow profile views |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOW() | Update timestamp |

### 3. **user_interests** (User Hobbies)
User interests and hobbies.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `user_id` | UUID | FOREIGN KEY to users(id) |
| `interest_name` | VARCHAR(100) | Interest name |
| `interest_category` | VARCHAR(50) | Interest category |
| `created_at` | TIMESTAMP WITH TIME ZONE | Creation timestamp |

### 4. **user_photos** (User Photos)
User profile photos and gallery.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | UUID | PRIMARY KEY | Unique photo identifier |
| `user_id` | UUID | FOREIGN KEY | References users(id) |
| `photo_url` | TEXT | NOT NULL | Photo URL |
| `photo_order` | INTEGER | 0 | Display order |
| `is_primary` | BOOLEAN | FALSE | Primary profile photo |
| `is_approved` | BOOLEAN | TRUE | Photo approval status |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOW() | Upload timestamp |

### 5. **user_documents** (Verification Documents)
User verification documents for premium features.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `user_id` | UUID | FOREIGN KEY to users(id) |
| `document_type` | VARCHAR(50) | id_card, passport, drivers_license, selfie |
| `document_url` | TEXT | Document file URL |
| `verification_status` | VARCHAR(20) | pending, approved, rejected |
| `verified_at` | TIMESTAMP WITH TIME ZONE | Verification timestamp |
| `verified_by` | UUID | Admin who verified |
| `rejection_reason` | TEXT | Rejection reason if any |
| `created_at` | TIMESTAMP WITH TIME ZONE | Upload timestamp |

### 6. **user_connections** (Friends/Connections)
User connections and friend relationships.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | UUID | PRIMARY KEY | Connection identifier |
| `user_id` | UUID | FOREIGN KEY | First user |
| `connected_user_id` | UUID | FOREIGN KEY | Second user |
| `connection_type` | VARCHAR(20) | 'friend' | friend, blocked, pending |
| `connection_status` | VARCHAR(20) | 'active' | active, inactive |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOW() | Connection date |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOW() | Last update |

### 7. **user_activity_logs** (Activity Tracking)
User activity tracking and analytics.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `user_id` | UUID | FOREIGN KEY to users(id) |
| `activity_type` | VARCHAR(50) | Activity type |
| `activity_details` | JSONB | Activity details |
| `ip_address` | INET | User's IP address |
| `user_agent` | TEXT | Browser/device info |
| `created_at` | TIMESTAMP WITH TIME ZONE | Activity timestamp |

### 8. **user_sessions** (Session Management)
User session tracking for online status.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | UUID | PRIMARY KEY | Session identifier |
| `user_id` | UUID | FOREIGN KEY | References users(id) |
| `session_id` | VARCHAR(255) | UNIQUE | Session token |
| `socket_id` | VARCHAR(255) | - | WebSocket connection ID |
| `connection_type` | VARCHAR(20) | 'web' | web, mobile |
| `device_info` | JSONB | - | Device information |
| `last_heartbeat` | TIMESTAMP WITH TIME ZONE | NOW() | Last activity |
| `expires_at` | TIMESTAMP WITH TIME ZONE | - | Session expiry |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOW() | Session start |

## 🏗️ Model Classes

### UserModel Class

The main user model class that represents a complete user with all related data.

```javascript
const user = new UserModel({
  id: 'uuid-here',
  phone_number: '+1234567890',
  name: 'John Doe',
  email: 'john@example.com',
  // ... other fields
});
```

#### Key Methods:

- **`isValid()`** - Check if user has required fields
- **`isProfileComplete()`** - Check if profile is 80%+ complete
- **`isVerified()`** - Check if user is verified
- **`isOnline()`** - Check if user is currently online
- **`toJSON()`** - Convert to JSON format
- **`toProfileCardFormat()`** - Convert to Flutter ProfileCardWidget format

#### Calculated Properties:

- **`age`** - Calculate age from date of birth
- **`primaryPhoto`** - Get primary profile photo
- **`displayName`** - Get display name (name or 'Anonymous')
- **`formattedLastSeen`** - Format last seen time

### Related Model Classes

- **`UserPreference`** - User preferences and settings
- **`UserInterest`** - User interests and hobbies
- **`UserPhoto`** - User photos and gallery
- **`UserDocument`** - Verification documents
- **`UserConnection`** - User connections/friends
- **`UserActivityLog`** - Activity tracking
- **`UserSession`** - Session management

## 🔧 Usage Examples

### Creating a User Model

```javascript
const { UserModel } = require('./UserModel');

// From database row
const user = UserModel.fromDatabaseRow(databaseRow);

// From profile card data
const user = UserModel.fromProfileCardData(profileData);

// Manual creation
const user = new UserModel({
  phone_number: '+1234567890',
  name: 'John Doe',
  email: 'john@example.com'
});
```

### Updating User Data

```javascript
// Update profile
user.updateProfile({
  name: 'John Smith',
  bio: 'Updated bio',
  location: 'New York'
});

// Update preferences
user.updatePreferences({
  pushNotifications: false,
  privacyLevel: 'friends'
});

// Add interests
user.addInterest({
  name: 'Photography',
  category: 'Hobbies'
});

// Add photos
user.addPhoto({
  url: 'https://example.com/photo.jpg',
  isPrimary: true
});
```

### Data Transformation

```javascript
// Get JSON representation
const jsonData = user.toJSON();

// Get ProfileCardWidget format
const profileData = user.toProfileCardFormat();

// Check user status
if (user.isOnline()) {
  console.log(`${user.displayName} is online`);
}

if (user.isProfileComplete()) {
  console.log('Profile is complete');
}
```

## 📱 Flutter Integration

The `toProfileCardFormat()` method provides data in the exact format expected by your Flutter ProfileCardWidget:

```javascript
const profileData = user.toProfileCardFormat();
// Returns:
{
  id: "uuid",
  phoneNumber: "+1234567890",
  fullName: "John Doe",
  email: "john@example.com",
  age: 25,
  gender: "male",
  location: "New York",
  bio: "User bio",
  image: "https://example.com/photo.jpg",
  avatarUrl: "https://example.com/avatar.jpg",
  photos: [...],
  online: true,
  lastSeen: "2 hours ago",
  createdAt: "2024-01-15T10:30:00.000Z",
  updatedAt: "2024-01-20T14:45:00.000Z",
  lastLoginAt: "2024-01-20T14:45:00.000Z",
  loginCount: 15,
  isVerified: true,
  verificationStatus: "verified",
  isActive: true,
  isPremium: false,
  profileCompletionPercentage: 85,
  interests: ["Photography", "Travel", "Music"],
  preferences: {
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    privacyLevel: "public",
    showOnlineStatus: true,
    showLastSeen: true,
    allowProfileViews: true
  }
}
```

## 🔒 Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies:
- Users can only view/update their own data
- Public profiles can be viewed by others
- Admin operations bypass RLS using service role

### Validation
- Phone number format validation
- Email format validation
- Gender enum validation
- Profile completion percentage (0-100)
- Verification status validation

## 📊 Database Indexes

Performance indexes are created on:
- `users(phone_number)` - Phone number lookups
- `users(email)` - Email lookups
- `users(status)` - Online status queries
- `users(verification_status)` - Verification queries
- `users(location)` - Location-based searches
- `users(created_at)` - Date-based queries
- `user_connections(user_id, connected_user_id)` - Connection queries
- `user_sessions(user_id, session_id)` - Session management
- `user_activity_logs(user_id, created_at)` - Activity tracking

## 🔄 Triggers and Functions

### Automatic Updates
- `update_updated_at_column()` - Automatically updates `updated_at` timestamp
- `calculate_profile_completion()` - Calculates profile completion percentage

### Triggers
- Profile completion calculation on user updates
- Timestamp updates on all relevant tables

## 🎯 Best Practices

1. **Always use the UserModel class** for data manipulation
2. **Use `toProfileCardFormat()`** for Flutter integration
3. **Validate data** before saving to database
4. **Use transactions** for multi-table operations
5. **Implement proper error handling** for all operations
6. **Use the service role** for admin operations
7. **Cache frequently accessed data** for performance

This user model provides a complete foundation for your dating app's user management system! 🚀
