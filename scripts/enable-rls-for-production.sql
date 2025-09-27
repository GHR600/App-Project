-- Re-enable RLS for production use with real authentication
-- Run this in your Supabase SQL Editor

-- Enable RLS on all tables for production security
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Verify RLS policies are in place
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'journal_entries', 'user_preferences', 'ai_insights');

SELECT 'RLS re-enabled for all tables - ready for production!' as status;