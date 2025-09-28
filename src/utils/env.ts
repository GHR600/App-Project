// Environment variable helpers and validation
import Constants from 'expo-constants';

export const getEnvVar = (name: string, defaultValue?: string): string => {
  // For React Native/Expo, try Constants.expoConfig.extra first, then process.env fallback
  const expoValue = Constants.expoConfig?.extra?.[name.replace('REACT_APP_', '').toLowerCase().replace(/_(.)/g, (match, letter) => letter.toUpperCase())];
  const envValue = process.env[name];
  const value = expoValue || envValue;

  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }

  return value || defaultValue || '';
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development' || __DEV__;
};

// Supabase environment variables - use Constants.expoConfig.extra
const getSupabaseConfig = () => {
  const extra = Constants.expoConfig?.extra || {};
  return {
    url: extra.supabaseUrl || process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co',
    anonKey: extra.supabaseAnonKey || process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key-here'
  };
};

// API Base URL configuration for backend services
const getApiConfig = () => {
  const extra = Constants.expoConfig?.extra || {};
  return {
    baseUrl: extra.apiBaseUrl || process.env.REACT_APP_API_BASE_URL || 'https://app-project-2pd12vfcr-glebs-projects-dd2e6b15.vercel.app'
  };
};

export const SUPABASE_CONFIG = getSupabaseConfig();
export const API_CONFIG = getApiConfig();

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