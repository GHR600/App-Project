-- Migration: Allow multiple journal entries per day
-- This migration removes the UNIQUE constraint on (user_id, date) to allow
-- users to create multiple entries on the same day

-- Drop the unique constraint if it exists
ALTER TABLE journal_entries
DROP CONSTRAINT IF EXISTS journal_entries_user_id_date_key;

-- Add comment to document the change
COMMENT ON TABLE journal_entries IS 'Unified entries table - supports multiple entries per day with flexible tagging';
