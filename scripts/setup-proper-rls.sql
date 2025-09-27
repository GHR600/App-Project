-- Proper RLS setup that maintains security while allowing user operations
-- Run this in your Supabase SQL Editor

-- First, enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

DROP POLICY IF EXISTS "Users can view own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON journal_entries;

DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;

DROP POLICY IF EXISTS "Users can view own insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can insert own insights" ON ai_insights;

-- ===================================
-- USERS TABLE POLICIES
-- ===================================

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile (for the trigger)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ===================================
-- JOURNAL ENTRIES TABLE POLICIES
-- ===================================

-- Allow users to view their own entries
CREATE POLICY "Users can view own entries" ON journal_entries
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to create their own entries
CREATE POLICY "Users can insert own entries" ON journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own entries
CREATE POLICY "Users can update own entries" ON journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own entries
CREATE POLICY "Users can delete own entries" ON journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- ===================================
-- USER PREFERENCES TABLE POLICIES
-- ===================================

-- Allow users to view their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to create their own preferences
CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own preferences
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- ===================================
-- AI INSIGHTS TABLE POLICIES
-- ===================================

-- Allow users to view their own insights
CREATE POLICY "Users can view own insights" ON ai_insights
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to create their own insights
CREATE POLICY "Users can insert own insights" ON ai_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===================================
-- VERIFICATION
-- ===================================

-- Show all policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'journal_entries', 'user_preferences', 'ai_insights');

SELECT '✅ Proper RLS setup complete - secure and functional!' as status;