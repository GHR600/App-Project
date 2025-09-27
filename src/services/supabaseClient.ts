import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, validateEnvironment, isDevelopment } from '../utils/env';

// Supabase configuration from environment
const { url: supabaseUrl, anonKey: supabaseAnonKey } = SUPABASE_CONFIG;

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  const { isValid } = validateEnvironment();
  return isValid;
};

// Development warning
if (isDevelopment()) {
  const { isValid, errors } = validateEnvironment();
  if (!isValid) {
    console.warn('⚠️  Supabase Configuration Issues:');
    errors.forEach(error => console.warn(`   - ${error}`));
    console.warn('   Please check your .env.local file or environment variables.');
  }
}