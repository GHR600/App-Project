-- Temporarily disable RLS for demo/development mode
-- Run this in your Supabase SQL Editor if you want to test without authentication

-- IMPORTANT: Only use this for development/demo. Re-enable RLS for production!

-- Disable RLS on main tables for demo mode
ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights DISABLE ROW LEVEL SECURITY;

-- To re-enable RLS later for production, run:
-- ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

SELECT 'RLS disabled for all tables for demo mode' as status;