import React, { useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

type HapticFeedbackStyle = 'light' | 'medium' | 'heavy' | 'none';

interface AnimatedButtonProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  hapticFeedback?: HapticFeedbackStyle;
  scaleMin?: number;
  children: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  style,
  onPressIn,
  onPressOut,
  onPress,
  hapticFeedback = 'light',
  scaleMin = 0.95,
  children,
  disabled,
  ...rest
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (event: any) => {
    // Trigger haptic feedback on iOS only
    if (Platform.OS === 'ios' && hapticFeedback !== 'none') {
      switch (hapticFeedback) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    }

    // Scale down animation
    Animated.timing(scaleAnim, {
      toValue: scaleMin,
      duration: 0,
      useNativeDriver: true,
    }).start();

    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    // Spring back animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();

    onPressOut?.(event);
  };

  const handlePress = (event: any) => {
    onPress?.(event);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      {...rest}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};
