# Login Flow Guide - New vs Returning Users

## Overview

The login system now intelligently handles both new and returning users:

- **New Users**: OTP verification → Profile creation → Dashboard
- **Returning Users**: OTP verification → Direct to Dashboard (skip profile creation)

## Updated Login Flow

### 1. OTP Verification (`/api/auth/verify-otp`)

The verify-otp endpoint now:

1. **Checks if user exists** in the database
2. **Updates login info** for existing users
3. **Creates new user** if not found
4. **Returns smart response** with redirect information

### 2. Response Format

```json
{
  "success": true,
  "message": "OTP verified successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "phoneNumber": "+916204691688",
    "name": "John Doe",
    "isVerified": true,
    "verificationStatus": "verified",
    "profileCompletion": 80,
    "createdAt": "2025-08-26T20:00:00.000Z",
    "loginCount": 2
  },
  "isNewUser": false,
  "hasCompleteProfile": true,
  "requiresProfileCompletion": false,
  "redirectTo": "dashboard"
}
```

### 3. Response Fields Explained

| Field | Description |
|-------|-------------|
| `isNewUser` | `true` for first-time users, `false` for returning users |
| `hasCompleteProfile` | `true` if user has name and profile completion ≥ 80% |
| `requiresProfileCompletion` | `true` if user needs to complete profile |
| `redirectTo` | Where to redirect: `"dashboard"` or `"profile-completion"` |
| `user.loginCount` | Number of times user has logged in |

## Frontend Implementation

### For New Users (First Login)

```javascript
// 1. Send OTP
const otpResponse = await axios.post('/api/auth/send-otp', {
  phoneNumber: '+916204691688'
});

// 2. Verify OTP
const verifyResponse = await axios.post('/api/auth/verify-otp', {
  phoneNumber: '+916204691688',
  otp: '123456'
});

const { isNewUser, hasCompleteProfile, redirectTo, token } = verifyResponse.data;

if (isNewUser && !hasCompleteProfile) {
  // Show profile completion screen
  navigateTo('/profile-completion');
} else {
  // Go directly to dashboard
  navigateTo('/dashboard');
}
```

### For Returning Users

```javascript
// Same OTP verification process
const verifyResponse = await axios.post('/api/auth/verify-otp', {
  phoneNumber: '+916204691688',
  otp: '123456'
});

const { isNewUser, hasCompleteProfile, redirectTo, token } = verifyResponse.data;

// Returning users with complete profiles go directly to dashboard
if (!isNewUser && hasCompleteProfile) {
  navigateTo('/dashboard');
} else if (requiresProfileCompletion) {
  navigateTo('/profile-completion');
}
```

## Profile Completion

### When Profile Completion is Required

- New users without complete profiles
- Users with profile completion < 80%
- Users missing required fields (name, age, gender)

### Profile Creation Endpoint

```javascript
// Create profile (only if required)
const profileResponse = await axios.post('/api/auth/create-profile', {
  name: 'John Doe',
  age: 25,
  gender: 'male'
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Database Changes

### User Table Updates

- `login_count`: Tracks number of logins
- `last_login_at`: Last login timestamp
- `profile_completion_percentage`: Profile completion status

### Login Tracking

```sql
-- Example of login tracking
UPDATE users 
SET 
  last_login_at = NOW(),
  login_count = login_count + 1,
  status = 'online'
WHERE phone_number = '+916204691688';
```

## Test the Flow

Run the test script to see the complete flow:

```bash
node test-login-flow.js
```

This will demonstrate:
1. First login (new user)
2. Profile creation
3. Second login (returning user)
4. Direct dashboard access

## Expected Behavior

### First Time User
```
1. Send OTP → Verify OTP → Profile Completion → Dashboard
Response: isNewUser: true, redirectTo: "profile-completion"
```

### Returning User with Complete Profile
```
1. Send OTP → Verify OTP → Dashboard (direct)
Response: isNewUser: false, redirectTo: "dashboard"
```

### Returning User with Incomplete Profile
```
1. Send OTP → Verify OTP → Profile Completion → Dashboard
Response: isNewUser: false, redirectTo: "profile-completion"
```

## Security Features

- ✅ Rate limiting on OTP requests
- ✅ IP blocking for suspicious activity
- ✅ JWT token authentication
- ✅ Login count tracking
- ✅ Session management

## Benefits

1. **Better UX**: Returning users skip profile creation
2. **Efficient**: No unnecessary profile screens
3. **Smart Routing**: Automatic redirect based on user state
4. **Tracking**: Login count and last login tracking
5. **Security**: Maintains all security features
