-- Migration: Add tags column to journal_entries table
-- This migration adds a tags array column to support the unified entry system

-- Add tags column to journal_entries
ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add index for tags to improve query performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_tags ON journal_entries USING GIN(tags);

-- Add comment to document the column
COMMENT ON COLUMN journal_entries.tags IS 'Array of tags for categorizing entries (e.g., journal, note, work, personal)';
