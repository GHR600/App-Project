-- Migration: Convert entry_type field to tags array
-- This migration handles the conversion of the old entry_type system to the new tags system

-- Step 1: Migrate existing entries with entry_type to tags
-- If entry has entry_type='journal', add 'journal' tag
-- If entry has entry_type='note', add 'note' tag

-- For PostgreSQL, if you have an entry_type column:
-- UPDATE journal_entries
-- SET tags = ARRAY[entry_type]
-- WHERE entry_type IS NOT NULL AND (tags IS NULL OR tags = '{}');

-- Since we're using a unified table now, we'll set default tags based on current usage:
-- Entries with mood_rating are likely journals
-- Entries without mood_rating but with short titles might be notes

-- Add 'journal' tag to entries with mood ratings
UPDATE journal_entries
SET tags = array_append(tags, 'journal')
WHERE mood_rating IS NOT NULL
  AND NOT ('journal' = ANY(tags));

-- For entries without tags and no mood rating, add 'note' tag
UPDATE journal_entries
SET tags = array_append(tags, 'note')
WHERE (tags IS NULL OR tags = '{}')
  AND mood_rating IS NULL;

-- Step 2: If there's an old entry_type column, drop it
-- Uncomment the following lines if entry_type column exists:
-- ALTER TABLE journal_entries DROP COLUMN IF EXISTS entry_type;

-- Add comment
COMMENT ON TABLE journal_entries IS 'Unified entries table - stores both journal entries and notes with tags for categorization';
