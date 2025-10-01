// Environment variable helpers and validation
import Constants from 'expo-constants';

console.log('📦 Loading env.ts...');
console.log('📦 Constants imported:', Constants ? 'YES' : 'NO');
console.log('📦 Constants.expoConfig:', Constants?.expoConfig ? 'EXISTS' : 'UNDEFINED');

export const getEnvVar = (name: string, defaultValue?: string): string => {
  try {
    // For React Native/Expo, try Constants.expoConfig.extra first, then process.env fallback
    const expoValue = Constants?.expoConfig?.extra?.[name.replace('REACT_APP_', '').toLowerCase().replace(/_(.)/g, (match, letter) => letter.toUpperCase())];
    const envValue = process.env[name];
    const value = expoValue || envValue;

    if (!value && !defaultValue) {
      throw new Error(`Environment variable ${name} is required but not set`);
    }

    return value || defaultValue || '';
  } catch (error) {
    console.error(`❌ Error in getEnvVar for ${name}:`, error);
    return defaultValue || '';
  }
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development' || __DEV__;
};

// Supabase environment variables - use Constants.expoConfig.extra
const getSupabaseConfig = () => {
  try {
    console.log('📦 getSupabaseConfig called');
    const extra = Constants?.expoConfig?.extra || {};
    console.log('📦 extra:', extra);

    const url = extra.supabaseUrl || process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
    const anonKey = extra.supabaseAnonKey || process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key-here';

    console.log('📦 Supabase config - URL:', url.substring(0, 30) + '...');
    console.log('📦 Supabase config - Key:', anonKey.substring(0, 20) + '...');

    return { url, anonKey };
  } catch (error) {
    console.error('❌ Error in getSupabaseConfig:', error);
    return {
      url: 'https://your-project.supabase.co',
      anonKey: 'your-anon-key-here'
    };
  }
};

// API Base URL configuration for backend services
const getApiConfig = () => {
  try {
    const extra = Constants?.expoConfig?.extra || {};
    const rawUrl = extra.apiBaseUrl || process.env.REACT_APP_API_BASE_URL || 'https://app-project-ksq4tr6pa-glebs-projects-dd2e6b15.vercel.app';
    // Remove trailing slash to prevent double slashes in API calls
    const baseUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
    return {
      baseUrl
    };
  } catch (error) {
    console.error('❌ Error in getApiConfig:', error);
    return {
      baseUrl: 'https://app-project-ksq4tr6pa-glebs-projects-dd2e6b15.vercel.app'
    };
  }
};

console.log('📦 About to call getSupabaseConfig()...');
export const SUPABASE_CONFIG = getSupabaseConfig();
console.log('📦 SUPABASE_CONFIG created:', SUPABASE_CONFIG);

console.log('📦 About to call getApiConfig()...');
export const API_CONFIG = getApiConfig();
console.log('📦 API_CONFIG created:', API_CONFIG);

// Validate environment configuration
export const validateEnvironment = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (SUPABASE_CONFIG.url === 'https://your-project.supabase.co') {
    errors.push('REACT_APP_SUPABASE_URL is not configured');
  }

  if (SUPABASE_CONFIG.anonKey === 'your-anon-key-here') {
    errors.push('REACT_APP_SUPABASE_ANON_KEY is not configured');
  }

  if (!SUPABASE_CONFIG.url.includes('supabase.co')) {
    errors.push('REACT_APP_SUPABASE_URL appears to be invalid');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};