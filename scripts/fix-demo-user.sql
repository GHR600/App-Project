-- Complete demo user setup for development/testing
-- Run this in your Supabase SQL Editor

-- STEP 1: Create demo user directly in the users table (no auth required)
-- This bypasses all authentication issues and creates a simple demo user
INSERT INTO users (
    id,
    email,
    subscription_status,
    free_insights_used,
    streak_count,
    onboarding_completed,
    created_at,
    updated_at
) VALUES (
    '12345678-1234-4123-8123-123456789abc',
    'demo.user@aijournal.app',
    'free',
    0,
    0,
    false,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- STEP 2: Create a sample journal entry for the demo user
INSERT INTO journal_entries (
    id,
    user_id,
    content,
    mood_rating,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '12345678-1234-4123-8123-123456789abc',
    'Welcome to the AI Journaling App! This is your first demo entry. You can write about your thoughts, feelings, and experiences here. Try creating a new entry to see the AI insights feature in action!',
    4,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- STEP 3: Verify everything is set up correctly
SELECT 'Demo user setup complete!' as status;

-- Show the demo user
SELECT 'Demo User:' as type, * FROM users WHERE id = '12345678-1234-4123-8123-123456789abc';

-- Show demo entries
SELECT 'Demo Entries:' as type, * FROM journal_entries WHERE user_id = '12345678-1234-4123-8123-123456789abc';