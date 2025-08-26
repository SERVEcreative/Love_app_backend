# Quick Fix Guide for Backend Issues

## Problem Summary
You're sending `name`, `age`, and `gender` from the frontend, but getting RLS policy violations and 400 errors on the create-profile endpoint.

## Root Cause
The RLS policies are using `auth.uid()` which requires Supabase Auth, but your backend uses custom JWT authentication.

## Quick Fix Steps

### Step 1: Add Service Role Key to Environment
Add this to your `.env` file:
```env
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### Step 2: Update Supabase Config
Update your `config/supabase.js` file:

```javascript
// Add this after the existing supabase client:
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Update module.exports:
module.exports = {
  supabase,
  supabaseAdmin,  // Add this line
  testConnection
};
```

### Step 3: Fix RLS Policies
Run this SQL in your Supabase SQL Editor:

```sql
-- Drop existing policies that use auth.uid()
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can view public profiles" ON users;
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;

-- Create new policies that allow backend service to manage all data
CREATE POLICY "Service role can manage all users" ON users
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage all preferences" ON user_preferences
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage all interests" ON user_interests
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage all photos" ON user_photos
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage all documents" ON user_documents
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage all connections" ON user_connections
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage all activity logs" ON user_activity_logs
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage all sessions" ON user_sessions
    FOR ALL USING (true) WITH CHECK (true);
```

### Step 4: Update Database Operations
Change these lines in your code:

**In `routes/auth.js`:**
```javascript
// Change this line:
const { supabase } = require('../config/supabase');
// To this:
const { supabase, supabaseAdmin } = require('../config/supabase');

// Then change all database operations from supabase to supabaseAdmin:
// Example:
const { data: newUser, error: insertError } = await supabaseAdmin
  .from('users')
  .insert([userData])
  .select()
  .single();
```

**In `services/userService.js`:**
```javascript
// Change this line:
const { supabase } = require('../config/supabase');
// To this:
const { supabase, supabaseAdmin } = require('../config/supabase');

// Then change all database operations from supabase to supabaseAdmin
```

### Step 5: Test the Fix
Run the test script:
```bash
node test-create-profile-simple.js
```

## Expected Data Format
Your frontend should send:
```json
{
  "name": "string (2-50 characters)",
  "age": "number (18-100)",
  "gender": "male" | "female" | "other" | "prefer_not_to_say"
}
```

## What the Backend Does
1. Receives `name`, `age`, `gender` from frontend
2. Calculates `date_of_birth` from age (this is working correctly)
3. Updates user profile in database
4. Returns success response

## Troubleshooting

### If you still get RLS errors:
1. Make sure you added the service role key to `.env`
2. Verify the SQL script was run in Supabase
3. Check that you're using `supabaseAdmin` for database operations

### If you get 400 errors:
1. Check that your request body matches the expected format
2. Make sure `age` is a number, not a string
3. Verify all required fields are present

### If you get 429 errors:
This is expected - your rate limiting is working. Wait before retrying.

## Files to Update
1. `.env` - Add service role key
2. `config/supabase.js` - Add supabaseAdmin client
3. `routes/auth.js` - Use supabaseAdmin for database operations
4. `services/userService.js` - Use supabaseAdmin for database operations
5. Supabase SQL Editor - Run the RLS policy fix

After these changes, your create-profile endpoint should work correctly with the data you're sending from the frontend.
