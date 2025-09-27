-- Automatic user profile creation via database triggers
-- This bypasses RLS issues by running at the database level
-- Run this in your Supabase SQL Editor

-- Create a function to automatically create user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, subscription_status, free_insights_used, streak_count, onboarding_completed, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    0,
    0,
    false,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that runs when a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.users TO authenticated;

-- Test the setup
SELECT 'Auto user profile creation setup complete!' as status;

-- Show existing users to verify
SELECT 'Existing users:' as info, id, email, created_at FROM public.users LIMIT 5;