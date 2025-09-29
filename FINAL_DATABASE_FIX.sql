-- Final Database Fix - Corrected unique index
-- Run these commands one by one in your Supabase SQL Editor

-- Step 1: Add ONLY the entry_type column (title already exists)
ALTER TABLE journal_entries ADD COLUMN entry_type VARCHAR(20) DEFAULT 'note';

-- Step 2: Add constraint for entry_type values
ALTER TABLE journal_entries ADD CONSTRAINT check_entry_type CHECK (entry_type IN ('journal', 'note'));

-- Step 3: Create unique index for journal entries (fixed version)
-- Using date_trunc instead of DATE() function
CREATE UNIQUE INDEX unique_journal_per_user_per_day
ON journal_entries (user_id, date_trunc('day', created_at))
WHERE entry_type = 'journal';

-- Alternative approach if the above still doesn't work:
-- We can create a computed column or handle this in application logic
-- For now, let's skip the database constraint and handle it in the app

-- Step 4: Verify the entry_type column was added successfully
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'journal_entries'
AND column_name = 'entry_type';

-- This should show:
-- entry_type | character varying | 'note'::character varying