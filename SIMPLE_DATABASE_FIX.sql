-- Simple Database Fix - Run these commands one by one in your Supabase SQL Editor

-- Step 1: Add the entry_type column with default value
ALTER TABLE journal_entries ADD COLUMN entry_type VARCHAR(20) DEFAULT 'note';

-- Step 2: Add the title column
ALTER TABLE journal_entries ADD COLUMN title TEXT;

-- Step 3: Add constraint for entry_type values
ALTER TABLE journal_entries ADD CONSTRAINT check_entry_type CHECK (entry_type IN ('journal', 'note'));

-- Step 4: Create unique index for journal entries (one per user per day)
CREATE UNIQUE INDEX unique_journal_per_user_per_day
ON journal_entries (user_id, DATE(created_at))
WHERE entry_type = 'journal';

-- Step 5: Verify the changes worked
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'journal_entries'
AND column_name IN ('entry_type', 'title');

-- This should show:
-- entry_type | character varying | 'note'::character varying
-- title      | text              | (null)