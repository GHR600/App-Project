import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

export const useThemeTransition = (isDark: boolean) => {
  const colorAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: isDark ? 1 : 0,
      duration: 300,
      useNativeDriver: false, // Color interpolation requires non-native driver
    }).start();
  }, [isDark]);

  const interpolateColor = (lightColor: string, darkColor: string) => {
    return colorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [lightColor, darkColor],
    });
  };

  return { colorAnim, interpolateColor };
};
