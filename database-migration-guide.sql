-- Database Migration Guide for Day-Based Journal System
-- Run these SQL commands in your Supabase SQL editor

-- Step 1: Add new columns to journal_entries table
ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS entry_type VARCHAR(20) DEFAULT 'note' CHECK (entry_type IN ('journal', 'note'));

ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS title TEXT;

-- Step 2: Create unique constraint for journal entries per user per day
-- This ensures only one journal entry per user per day
CREATE UNIQUE INDEX IF NOT EXISTS unique_journal_per_user_per_day
ON journal_entries (user_id, DATE(created_at))
WHERE entry_type = 'journal';

-- Step 3: Update existing entries to have entry_type = 'note' for backward compatibility
-- (This is already handled by the DEFAULT value, but you can run this for safety)
UPDATE journal_entries
SET entry_type = 'note'
WHERE entry_type IS NULL;

-- Step 4: Optional: Add indexes for better performance on day-based queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date_type
ON journal_entries (user_id, DATE(created_at), entry_type);

CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at_desc
ON journal_entries (created_at DESC);

-- Step 5: Create or update RLS policies if needed (adjust according to your current policies)
-- These policies ensure users can only access their own entries
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own journal entries" ON journal_entries;
    DROP POLICY IF EXISTS "Users can insert own journal entries" ON journal_entries;
    DROP POLICY IF EXISTS "Users can update own journal entries" ON journal_entries;
    DROP POLICY IF EXISTS "Users can delete own journal entries" ON journal_entries;

    -- Create new policies that work with the new schema
    CREATE POLICY "Users can view own journal entries" ON journal_entries
        FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert own journal entries" ON journal_entries
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own journal entries" ON journal_entries
        FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete own journal entries" ON journal_entries
        FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Step 6: Verify the changes
-- Run these queries to ensure everything is working correctly

-- Check if the new columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'journal_entries'
AND column_name IN ('entry_type', 'title');

-- Check the unique constraint
SELECT conname, contype, consrc
FROM pg_constraint
WHERE conname = 'unique_journal_per_user_per_day';

-- Test query to see the new structure
SELECT id, user_id, title, entry_type, content, mood_rating, created_at
FROM journal_entries
ORDER BY created_at DESC
LIMIT 5;

-- Notes:
-- 1. The entry_type column defaults to 'note' for backward compatibility
-- 2. The unique constraint only applies to 'journal' entries, allowing multiple notes per day
-- 3. The title column is optional and can be NULL
-- 4. All existing functionality should continue to work without changes
-- 5. The new day-based UI will group entries by date and separate journals from notes