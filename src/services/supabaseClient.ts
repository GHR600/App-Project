console.log('🔧 [supabaseClient.ts] Starting to load...');

let createClient: any;
let SupabaseClient: any;

try {
  console.log('🔧 [supabaseClient.ts] Attempting to import @supabase/supabase-js...');
  const supabaseModule = require('@supabase/supabase-js');
  console.log('🔧 [supabaseClient.ts] Module imported:', supabaseModule);
  console.log('🔧 [supabaseClient.ts] Module keys:', Object.keys(supabaseModule));

  createClient = supabaseModule.createClient;
  SupabaseClient = supabaseModule.SupabaseClient;

  console.log('🔧 [supabaseClient.ts] createClient type:', typeof createClient);
  console.log('🔧 [supabaseClient.ts] createClient value:', createClient);
} catch (error) {
  console.error('❌ [supabaseClient.ts] Failed to import @supabase/supabase-js:', error);
  console.error('❌ [supabaseClient.ts] Error stack:', error instanceof Error ? error.stack : 'No stack');
}

console.log('🔧 [supabaseClient.ts] About to import from env...');

import { SUPABASE_CONFIG, validateEnvironment, isDevelopment } from '../utils/env';

console.log('🔧 [supabaseClient.ts] env imports successful');
console.log('🔧 [supabaseClient.ts] SUPABASE_CONFIG:', SUPABASE_CONFIG);

// Supabase configuration from environment
const { url: supabaseUrl, anonKey: supabaseAnonKey } = SUPABASE_CONFIG;

console.log('🔧 [supabaseClient.ts] Destructured config - url:', supabaseUrl, 'key:', supabaseAnonKey?.substring(0, 20) + '...');

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
let supabaseClient: any | null = null;

if (isValid && createClient) {
  try {
    console.log('🔧 [supabaseClient.ts] Config is valid, calling createClient...');
    console.log('🔧 [supabaseClient.ts] createClient type:', typeof createClient);

    if (typeof createClient !== 'function') {
      throw new Error(`createClient is not a function, it's a ${typeof createClient}`);
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    console.log('✅ Supabase client created successfully');
    console.log('✅ Client type:', typeof supabaseClient);
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
  }
} else {
  if (!isValid) {
    console.warn('⚠️  Skipping Supabase client creation due to invalid configuration');
    console.warn('   App will run in demo mode without database features');
  }
  if (!createClient) {
    console.error('❌ createClient function is not available from @supabase/supabase-js');
    console.error('❌ This may indicate a problem with the package installation');
  }
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