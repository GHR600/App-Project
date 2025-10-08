-- Migration: Add AI Style Column to Users Table
-- This adds support for AI personality selection (Coach vs Reflector)

-- Add ai_style column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS ai_style VARCHAR(20) DEFAULT 'reflector'
CHECK (ai_style IN ('coach', 'reflector'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_ai_style ON users(ai_style);

-- Update any existing NULL values to default 'reflector'
UPDATE users SET ai_style = 'reflector' WHERE ai_style IS NULL;

-- Verify the migration
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'ai_style';

SELECT 'AI style column migration completed successfully! ✅' as status;
