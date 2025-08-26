-- Fix RLS Policies for Backend Service
-- Run this in your Supabase SQL Editor

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

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'user_preferences', 'user_interests', 'user_photos', 'user_documents', 'user_connections', 'user_activity_logs', 'user_sessions')
ORDER BY tablename, policyname;
