import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface PressableCardProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'none';
  scaleMin?: number;
}

export const PressableCard: React.FC<PressableCardProps> = ({
  style,
  onPressIn,
  onPressOut,
  onPress,
  hapticFeedback = 'light',
  scaleMin = 0.98,
  children,
  disabled,
  ...rest
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

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

    // Scale down and fade animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: scaleMin,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.9,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();

    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    // Spring back animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

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
            opacity: opacityAnim,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};
