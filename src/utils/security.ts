import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Input validation utilities
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    throw new ValidationError('Input must be a string');
  }

  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const sanitizeJournalContent = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Remove excessive whitespace but preserve paragraph breaks
  return content
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n\n') // Preserve paragraph breaks
    .trim();
};

// Content filtering for inappropriate content
export const hasInappropriateContent = (content: string): boolean => {
  // This is a basic implementation - in production, you'd use a proper content filtering service
  const inappropriatePatterns = [
    /\b(violence|harm|suicide|self-harm)\b/i,
    // Add more patterns as needed
  ];

  return inappropriatePatterns.some(pattern => pattern.test(content));
};

// Rate limiting utilities
interface RateLimitRule {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  isAllowed(key: string, rule: RateLimitRule): boolean {
    const now = Date.now();
    const windowStart = now - rule.windowMs;

    // Get existing attempts for this key
    const keyAttempts = this.attempts.get(key) || [];

    // Filter out attempts outside the current window
    const recentAttempts = keyAttempts.filter(time => time > windowStart);

    // Check if we're within the limit
    if (recentAttempts.length >= rule.maxRequests) {
      return false;
    }

    // Add this attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);

    return true;
  }

  getRemainingTime(key: string, rule: RateLimitRule): number {
    const attempts = this.attempts.get(key) || [];
    if (attempts.length === 0) return 0;

    const oldestAttempt = Math.min(...attempts);
    const windowEnd = oldestAttempt + rule.windowMs;
    return Math.max(0, windowEnd - Date.now());
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Rate limiting rules
export const RATE_LIMITS = {
  AI_INSIGHTS: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  CHAT_MESSAGES: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
  JOURNAL_ENTRIES: { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour
  LOGIN_ATTEMPTS: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 minutes
} as const;

// Secure storage utilities
export class SecureStorage {
  private static readonly ENCRYPTION_KEY = 'ai_journal_app_key_v1';

  static async setItem(key: string, value: string): Promise<void> {
    try {
      // In a real app, you'd use react-native-keychain for secure storage
      const encrypted = this.simpleEncrypt(value);
      await AsyncStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('SecureStorage.setItem error:', error);
      throw new Error('Failed to store secure data');
    }
  }

  static async getItem(key: string): Promise<string | null> {
    try {
      const encrypted = await AsyncStorage.getItem(key);
      if (!encrypted) return null;

      return this.simpleDecrypt(encrypted);
    } catch (error) {
      console.error('SecureStorage.getItem error:', error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('SecureStorage.removeItem error:', error);
      throw new Error('Failed to remove secure data');
    }
  }

  // Simple encryption for demo - use proper encryption in production
  private static simpleEncrypt(text: string): string {
    return Buffer.from(text).toString('base64');
  }

  private static simpleDecrypt(encrypted: string): string {
    return Buffer.from(encrypted, 'base64').toString('utf-8');
  }
}

// Environment variable validation
export const validateEnvironment = (): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // Check required environment variables
  if (!process.env.REACT_APP_SUPABASE_URL) {
    errors.push('REACT_APP_SUPABASE_URL is required');
  }

  if (!process.env.REACT_APP_SUPABASE_ANON_KEY) {
    errors.push('REACT_APP_SUPABASE_ANON_KEY is required');
  }

  // Validate URL format
  if (process.env.REACT_APP_SUPABASE_URL &&
      !process.env.REACT_APP_SUPABASE_URL.includes('.supabase.co')) {
    errors.push('REACT_APP_SUPABASE_URL appears to be invalid');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// API request security
export const createSecureHeaders = (authToken?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-App-Version': '1.0.0',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
};

export const validateApiResponse = (response: any): boolean => {
  // Basic API response validation
  if (!response || typeof response !== 'object') {
    return false;
  }

  // Check for common API response patterns
  if ('success' in response || 'data' in response || 'error' in response) {
    return true;
  }

  return false;
};

// Security monitoring
export const logSecurityEvent = (event: string, details?: any) => {
  console.warn(`[SECURITY] ${event}`, details);

  // In production, send to security monitoring service
  // Example: Send to SIEM, log aggregation service, etc.
};

// Biometric authentication helper (mock implementation)
export const isBiometricAvailable = async (): Promise<boolean> => {
  // In a real app, you'd use react-native-biometrics or expo-local-authentication
  return false; // Mock implementation
};

export const authenticateWithBiometric = async (): Promise<boolean> => {
  // Mock implementation
  return new Promise((resolve) => {
    Alert.alert(
      'Biometric Authentication',
      'Biometric authentication is not implemented in this demo',
      [{ text: 'OK', onPress: () => resolve(false) }]
    );
  });
};

// Session security
export class SessionSecurity {
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  static async validateSession(): Promise<boolean> {
    try {
      const sessionData = await AsyncStorage.getItem('@session_data');
      if (!sessionData) return false;

      const { timestamp, lastActivity } = JSON.parse(sessionData);
      const now = Date.now();

      // Check session timeout
      if (now - timestamp > this.SESSION_TIMEOUT) {
        await this.clearSession();
        return false;
      }

      // Check activity timeout
      if (now - lastActivity > this.ACTIVITY_TIMEOUT) {
        await this.clearSession();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  static async updateActivity(): Promise<void> {
    try {
      const sessionData = await AsyncStorage.getItem('@session_data');
      if (sessionData) {
        const data = JSON.parse(sessionData);
        data.lastActivity = Date.now();
        await AsyncStorage.setItem('@session_data', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Session update error:', error);
    }
  }

  static async createSession(): Promise<void> {
    try {
      const sessionData = {
        timestamp: Date.now(),
        lastActivity: Date.now(),
      };
      await AsyncStorage.setItem('@session_data', JSON.stringify(sessionData));
    } catch (error) {
      console.error('Session creation error:', error);
    }
  }

  static async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem('@session_data');
    } catch (error) {
      console.error('Session clear error:', error);
    }
  }
}

// Input sanitization for different contexts
export const sanitizeForDisplay = (input: string): string => {
  return sanitizeInput(input);
};

export const sanitizeForDatabase = (input: string): string => {
  // Additional sanitization for database storage
  return sanitizeInput(input)
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .substring(0, 10000); // Limit length
};

export const sanitizeForApi = (input: any): any => {
  if (typeof input === 'string') {
    return sanitizeInput(input);
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeForApi);
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeForApi(value);
    }
    return sanitized;
  }

  return input;
};