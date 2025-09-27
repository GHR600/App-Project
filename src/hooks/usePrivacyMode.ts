import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIVACY_MODE_KEY = '@privacy_mode_enabled';
const PRIVACY_TIMEOUT_KEY = '@privacy_timeout';

export interface PrivacyModeSettings {
  isEnabled: boolean;
  isLocked: boolean;
  autoLockTimeout: number; // minutes
  requiresUnlock: boolean;
}

export const usePrivacyMode = () => {
  const [privacyMode, setPrivacyMode] = useState<PrivacyModeSettings>({
    isEnabled: false,
    isLocked: false,
    autoLockTimeout: 5,
    requiresUnlock: false,
  });

  const [lastActiveTime, setLastActiveTime] = useState<number>(Date.now());

  // Load privacy settings from storage
  useEffect(() => {
    const loadPrivacySettings = async () => {
      try {
        const enabled = await AsyncStorage.getItem(PRIVACY_MODE_KEY);
        const timeout = await AsyncStorage.getItem(PRIVACY_TIMEOUT_KEY);

        setPrivacyMode(prev => ({
          ...prev,
          isEnabled: enabled === 'true',
          autoLockTimeout: timeout ? parseInt(timeout) : 5,
        }));
      } catch (error) {
        console.error('Error loading privacy settings:', error);
      }
    };

    loadPrivacySettings();
  }, []);

  // Auto-lock functionality
  useEffect(() => {
    if (!privacyMode.isEnabled) return;

    const checkAutoLock = () => {
      const now = Date.now();
      const timeSinceActive = (now - lastActiveTime) / (1000 * 60); // minutes

      if (timeSinceActive >= privacyMode.autoLockTimeout && !privacyMode.isLocked) {
        setPrivacyMode(prev => ({
          ...prev,
          isLocked: true,
          requiresUnlock: true,
        }));
      }
    };

    const interval = setInterval(checkAutoLock, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [privacyMode.isEnabled, privacyMode.autoLockTimeout, lastActiveTime, privacyMode.isLocked]);

  const enablePrivacyMode = async (timeout: number = 5) => {
    try {
      await AsyncStorage.setItem(PRIVACY_MODE_KEY, 'true');
      await AsyncStorage.setItem(PRIVACY_TIMEOUT_KEY, timeout.toString());

      setPrivacyMode(prev => ({
        ...prev,
        isEnabled: true,
        autoLockTimeout: timeout,
        isLocked: false,
        requiresUnlock: false,
      }));
    } catch (error) {
      console.error('Error enabling privacy mode:', error);
    }
  };

  const disablePrivacyMode = async () => {
    try {
      await AsyncStorage.setItem(PRIVACY_MODE_KEY, 'false');

      setPrivacyMode(prev => ({
        ...prev,
        isEnabled: false,
        isLocked: false,
        requiresUnlock: false,
      }));
    } catch (error) {
      console.error('Error disabling privacy mode:', error);
    }
  };

  const unlockPrivacyMode = () => {
    setPrivacyMode(prev => ({
      ...prev,
      isLocked: false,
      requiresUnlock: false,
    }));
    setLastActiveTime(Date.now());
  };

  const lockPrivacyMode = () => {
    setPrivacyMode(prev => ({
      ...prev,
      isLocked: true,
      requiresUnlock: true,
    }));
  };

  const updateActivity = () => {
    setLastActiveTime(Date.now());
  };

  const shouldBlurContent = (): boolean => {
    return privacyMode.isEnabled && privacyMode.isLocked;
  };

  return {
    privacyMode,
    enablePrivacyMode,
    disablePrivacyMode,
    unlockPrivacyMode,
    lockPrivacyMode,
    updateActivity,
    shouldBlurContent,
  };
};