# API Documentation - OTP Authentication & Profile Creation

## 🔐 Complete Flow: OTP → Profile Creation

### Step 1: Send OTP
**POST** `/api/auth/send-otp`

**Request Body:**
```json
{
  "phoneNumber": "+917620787372"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "messageId": "wamid.HBgMOTE3NjIwNzg3MzcyFQIAERgSNENGOUNBM0QxQTU3NjJFRTQ1AA=="
}
```

---

### Step 2: Verify OTP
**POST** `/api/auth/verify-otp`

**Request Body:**
```json
{
  "phoneNumber": "+917620787372",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "12345678-1234-1234-1234-123456789012",
    "phoneNumber": "917620787372",
    "name": null,
    "isVerified": true,
    "verificationStatus": "verified",
    "profileCompletion": 30,
    "createdAt": "2025-01-25T18:30:00.000Z"
  }
}
```

---

### Step 3: Create Profile
**POST** `/api/auth/create-profile`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "age": 25,
  "gender": "male"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile created successfully",
  "user": {
    "id": "12345678-1234-1234-1234-123456789012",
    "phoneNumber": "917620787372",
    "name": "John Doe",
    "age": 25,
    "gender": "male",
    "isVerified": true,
    "profileCompletion": 80,
    "createdAt": "2025-01-25T18:30:00.000Z"
  }
}
```

---

## 🎯 Implementation Benefits

### ✅ **Clean Separation of Concerns**
- OTP verification handles authentication
- Profile creation handles user data
- Each step has a specific responsibility

### ✅ **Security**
- JWT token validates user identity (via Authorization header)
- Input validation on all fields
- Proper error handling
- Token-based authentication (Bearer token)
- No sensitive data in request body
- Reusable authentication middleware
- Standard OAuth 2.0 Bearer token pattern

### ✅ **Scalability**
- Easy to add more profile fields later
- Can add additional verification steps
- Modular API design

### ✅ **User Experience**
- Step-by-step flow
- Clear error messages
- Progress tracking (profile completion %)

---

## 🧪 Testing

Run the complete flow test:
```bash
node test-complete-flow.js
```

This will guide you through:
1. Sending OTP
2. Entering OTP
3. Creating profile with name, age, gender

---

## 📊 Database Schema

### Users Table
```sql
- id (UUID, Primary Key)
- phone_number (VARCHAR)
- name (VARCHAR)
- date_of_birth (DATE)
- gender (ENUM)
- is_verified (BOOLEAN)
- verification_status (VARCHAR)
- profile_completion_percentage (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### User Preferences Table
```sql
- user_id (UUID, Foreign Key)
- push_notifications (BOOLEAN)
- email_notifications (BOOLEAN)
- privacy_level (VARCHAR)
- show_online_status (BOOLEAN)
```

---

## 🔧 Error Handling

### Common Error Responses:

**Invalid OTP:**
```json
{
  "success": false,
  "error": "Invalid OTP"
}
```

**Invalid Token:**
```json
{
  "error": "Invalid token",
  "message": "Token is invalid or expired"
}
```

**Validation Error:**
```json
{
  "error": "Validation failed",
  "details": "Age must be between 18 and 100"
}
```

---

## 🚀 Next Steps

1. **Test the complete flow** using `test-complete-flow.js`
2. **Fix RLS policies** in Supabase if needed
3. **Add more profile fields** (bio, location, photos)
4. **Implement profile updates** for existing users
5. **Add profile validation** (age restrictions, etc.)
