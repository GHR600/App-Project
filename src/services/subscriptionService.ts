/**
 * Subscription Service
 * Manages RevenueCat integration and subscription status
 */

import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

export type SubscriptionStatus = 'free' | 'premium';

/**
 * Initialize RevenueCat SDK
 * Should be called early in the app lifecycle
 */
export async function initializeRevenueCat(): Promise<void> {
  // Try to get API key from expo config first, then fall back to process.env
  const extra = Constants.expoConfig?.extra || {};

  // Select the appropriate API key based on platform
  let apiKey: string | undefined;

  if (Platform.OS === 'ios') {
    // iOS uses Apple App Store key
    apiKey = extra.revenuecatAppleApiKey || process.env.REACT_APP_REVENUECAT_APPLE_API_KEY;
  } else if (Platform.OS === 'android') {
    // Android uses Google Play key
    apiKey = extra.revenuecatGoogleApiKey || process.env.REACT_APP_REVENUECAT_GOOGLE_API_KEY;
  } else if (Platform.OS === 'web') {
    // Web uses Web Billing key
    apiKey = extra.revenuecatWebApiKey || process.env.REACT_APP_REVENUECAT_WEB_API_KEY;
  }

  if (!apiKey) {
    console.warn(`RevenueCat API key not configured for platform: ${Platform.OS}. Subscription features will not work.`);
    return;
  }

  try {
    // Set log level based on environment
    if (__DEV__) {
      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    // Configure RevenueCat with platform-specific key
    await Purchases.configure({ apiKey });

    console.log(`RevenueCat initialized successfully for ${Platform.OS}`);
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
    throw error;
  }
}

/**
 * Log in user to RevenueCat
 * Links RevenueCat customer to your user ID
 */
export async function loginRevenueCat(userId: string): Promise<void> {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    console.log('RevenueCat logged in successfully:', customerInfo);
  } catch (error) {
    console.error('Error logging in to RevenueCat:', error);
    throw error;
  }
}

/**
 * Log out user from RevenueCat
 */
export async function logoutRevenueCat(): Promise<void> {
  try {
    await Purchases.logOut();
    console.log('RevenueCat logged out successfully');
  } catch (error) {
    console.error('Error logging out from RevenueCat:', error);
  }
}

/**
 * Check subscription status
 * Returns 'premium' if user has active premium entitlement, otherwise 'free'
 */
export async function checkSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isPremium = customerInfo.entitlements.active['premium'] !== undefined;

    return isPremium ? 'premium' : 'free';
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return 'free';
  }
}

/**
 * Sync subscription status to Supabase
 * Updates users.subscription_status in the database
 */
export async function syncSubscriptionStatus(): Promise<void> {
  try {
    // Get subscription status from RevenueCat
    const status = await checkSubscriptionStatus();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('No authenticated user to sync subscription');
      return;
    }

    // Update subscription status in Supabase
    const { error } = await supabase
      .from('users')
      .update({
        subscription_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      throw error;
    }

    console.log('Subscription status synced to Supabase:', status);
  } catch (error) {
    console.error('Error syncing subscription status:', error);
  }
}

/**
 * Get available subscription packages from RevenueCat
 */
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  try {
    const offerings = await Purchases.getOfferings();

    if (offerings.current && offerings.current.availablePackages.length > 0) {
      return offerings;
    }

    console.warn('No offerings available');
    return null;
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return null;
  }
}

/**
 * Purchase a subscription package
 */
export async function purchasePackage(
  packageToPurchase: PurchasesPackage
): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

    // Sync subscription status to backend
    await syncSubscriptionStatus();

    return {
      success: true,
      customerInfo,
    };
  } catch (error: any) {
    // Check if user cancelled
    if (error.userCancelled) {
      return {
        success: false,
        error: 'Purchase cancelled',
      };
    }

    console.error('Error purchasing package:', error);
    return {
      success: false,
      error: error.message || 'Purchase failed',
    };
  }
}

/**
 * Restore previous purchases
 * Useful for users who reinstall the app or switch devices
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> {
  try {
    const customerInfo = await Purchases.restorePurchases();

    // Sync restored subscription status to backend
    await syncSubscriptionStatus();

    return {
      success: true,
      customerInfo,
    };
  } catch (error: any) {
    console.error('Error restoring purchases:', error);
    return {
      success: false,
      error: error.message || 'Failed to restore purchases',
    };
  }
}

/**
 * Get customer info including all subscription details
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Error getting customer info:', error);
    return null;
  }
}

/**
 * Set up listener for subscription status changes
 * Automatically syncs status when it changes
 */
export function setupSubscriptionListener(): void {
  Purchases.addCustomerInfoUpdateListener((customerInfo) => {
    console.log('Customer info updated:', customerInfo);
    syncSubscriptionStatus();
  });
}
