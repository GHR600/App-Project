import { useEffect } from 'react';
import { BackHandler } from 'react-native';

/**
 * Hook to handle Android hardware back button
 * Returns true to prevent default behavior (exiting the app)
 * Returns false to allow default behavior
 */
export const useAndroidBackHandler = (onBackPress: () => boolean) => {
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backHandler.remove();
  }, [onBackPress]);
};