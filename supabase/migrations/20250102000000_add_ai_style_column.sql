-- Add ai_style column to users table for AI personality preference
-- This allows users to choose between 'coach' and 'reflector' AI styles

ALTER TABLE users
ADD COLUMN IF NOT EXISTS ai_style VARCHAR(20) DEFAULT 'reflector'
CHECK (ai_style IN ('coach', 'reflector'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_ai_style ON users(ai_style);

-- Add comment for documentation
COMMENT ON COLUMN users.ai_style IS 'User preference for AI personality: coach (strategic, direct) or reflector (thoughtful, curious)';
