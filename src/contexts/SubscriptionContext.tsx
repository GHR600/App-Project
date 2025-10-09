import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Purchases from 'react-native-purchases';
import {
  checkSubscriptionStatus,
  syncSubscriptionStatus,
  setupSubscriptionListener,
  SubscriptionStatus,
} from '../services/subscriptionService';

interface SubscriptionContextType {
  status: SubscriptionStatus | 'loading';
  isPremium: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [status, setStatus] = useState<SubscriptionStatus | 'loading'>('loading');
  const [isLoading, setIsLoading] = useState(true);

  const loadSubscriptionStatus = async () => {
    try {
      const subscriptionStatus = await checkSubscriptionStatus();
      setStatus(subscriptionStatus);

      // Sync to backend
      await syncSubscriptionStatus();
    } catch (error) {
      console.error('Error loading subscription status:', error);
      // Default to free on error
      setStatus('free');
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    setIsLoading(true);
    await loadSubscriptionStatus();
  };

  useEffect(() => {
    // Initial load
    loadSubscriptionStatus();

    // Set up listener for subscription changes
    setupSubscriptionListener();

    // Listen for customer info updates
    const listener = Purchases.addCustomerInfoUpdateListener(async (customerInfo) => {
      console.log('Customer info updated in context:', customerInfo);
      const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
      const newStatus: SubscriptionStatus = isPremium ? 'premium' : 'free';

      setStatus(newStatus);

      // Sync to backend
      await syncSubscriptionStatus();
    });

    // Cleanup
    return () => {
      // RevenueCat doesn't provide a way to remove specific listeners
      // The listener will be cleaned up when the app unmounts
    };
  }, []);

  const isPremium = status === 'premium';

  const value: SubscriptionContextType = {
    status,
    isPremium,
    isLoading,
    refresh,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
