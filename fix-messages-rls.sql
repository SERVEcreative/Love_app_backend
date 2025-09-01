-- Fix RLS policies for messages table to allow backend operations
-- This script allows the backend service to insert messages on behalf of users

-- First, let's check the current RLS policies
-- You can run this in your Supabase SQL editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Users can insert messages they send" ON messages;
DROP POLICY IF EXISTS "Users can update messages they received" ON messages;

-- Create new policies that allow backend service operations
-- Policy 1: Allow users to view messages they sent or received
CREATE POLICY "Users can view messages they sent or received" ON messages
    FOR SELECT USING (
        auth.uid()::text = sender_id::text OR
        auth.uid()::text = receiver_id::text
    );

-- Policy 2: Allow backend service to insert messages (bypasses RLS for service role)
-- This policy allows the backend to insert messages on behalf of users
CREATE POLICY "Backend can insert messages" ON messages
    FOR INSERT WITH CHECK (true);

-- Policy 3: Allow users to update messages they received (for read status)
CREATE POLICY "Users can update messages they received" ON messages
    FOR UPDATE USING (auth.uid()::text = receiver_id::text);

-- Policy 4: Allow backend service to update messages (for read status updates)
CREATE POLICY "Backend can update messages" ON messages
    FOR UPDATE WITH CHECK (true);

-- Also fix conversations table policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations they participate in" ON conversations;

-- Create new conversation policies
CREATE POLICY "Users can view conversations they participate in" ON conversations
    FOR SELECT USING (
        auth.uid()::text = participant1_id::text OR
        auth.uid()::text = participant2_id::text
    );

-- Allow backend to create conversations
CREATE POLICY "Backend can insert conversations" ON conversations
    FOR INSERT WITH CHECK (true);

-- Allow backend to update conversations
CREATE POLICY "Backend can update conversations" ON conversations
    FOR UPDATE WITH CHECK (true);

-- Fix message_reactions table policies
DROP POLICY IF EXISTS "Users can view reactions on messages they can see" ON message_reactions;
DROP POLICY IF EXISTS "Users can insert their own reactions" ON message_reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions" ON message_reactions;

-- Create new message_reactions policies
CREATE POLICY "Users can view reactions on messages they can see" ON message_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages
            WHERE messages.id = message_reactions.message_id
            AND (messages.sender_id::text = auth.uid()::text OR messages.receiver_id::text = auth.uid()::text)
        )
    );

-- Allow backend to manage reactions
CREATE POLICY "Backend can insert reactions" ON message_reactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Backend can delete reactions" ON message_reactions
    FOR DELETE WITH CHECK (true);

-- Verify the policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('messages', 'conversations', 'message_reactions')
ORDER BY tablename, policyname;
