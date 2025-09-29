-- Minimal Database Fix - Just add the missing column
-- Run these commands one by one in your Supabase SQL Editor

-- Step 1: Add ONLY the entry_type column (title already exists)
ALTER TABLE journal_entries ADD COLUMN entry_type VARCHAR(20) DEFAULT 'note';

-- Step 2: Add constraint for entry_type values
ALTER TABLE journal_entries ADD CONSTRAINT check_entry_type CHECK (entry_type IN ('journal', 'note'));

-- Step 3: Verify it worked
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'journal_entries'
AND column_name = 'entry_type';

-- You should see:
-- entry_type | character varying | 'note'::character varying

-- Note: We'll handle the "one journal per day" rule in the app code
-- (which is already implemented and working)