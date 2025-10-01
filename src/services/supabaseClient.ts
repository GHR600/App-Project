import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, validateEnvironment, isDevelopment } from '../utils/env';

// Supabase configuration from environment
const { url: supabaseUrl, anonKey: supabaseAnonKey } = SUPABASE_CONFIG;

// Validate configuration before creating client
console.log('🔧 Initializing Supabase client...');
console.log('   URL:', supabaseUrl);
console.log('   Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET');

const { isValid, errors } = validateEnvironment();

if (!isValid) {
  console.error('❌ Supabase Configuration Errors:');
  errors.forEach(error => console.error(`   - ${error}`));
  console.error('   Please check your environment variables.');
}

// Create the Supabase client - only if valid configuration
let supabaseClient: SupabaseClient | null = null;

if (isValid) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    });
    console.log('✅ Supabase client created successfully');
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
  }
} else {
  console.warn('⚠️  Skipping Supabase client creation due to invalid configuration');
  console.warn('   App will run in demo mode without database features');
}

// Export the client (will be null if not configured)
export const supabase = supabaseClient;

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return isValid && supabaseClient !== null;
};

// Helper to check if client is ready before operations
export const ensureSupabaseReady = (): boolean => {
  if (!supabaseClient) {
    console.error('❌ Supabase client is not initialized');
    return false;
  }
  if (!isValid) {
    console.warn('⚠️  Supabase is not properly configured');
    return false;
  }
  return true;
};

// Development warning
if (isDevelopment()) {
  if (!isValid) {
    console.warn('⚠️  Supabase Configuration Issues:');
    errors.forEach(error => console.warn(`   - ${error}`));
    console.warn('   Please check your .env.local file or environment variables.');
    console.warn('   The app will run in demo mode without database features.');
  }
}