-- Migration: Add profile fields to users table
-- Run this script in your Supabase SQL Editor to add display_name and profile_picture_url columns

-- Add display_name column
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add profile_picture_url column
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.display_name IS 'User display name for profile';
COMMENT ON COLUMN users.profile_picture_url IS 'URL to user profile picture stored in Supabase Storage';

-- Verify columns were added
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('display_name', 'profile_picture_url');

-- Success message
SELECT 'Profile fields added successfully! 🎉' as status;
