import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { AnimatedButton } from './AnimatedButton';
import { useTheme } from '../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';

interface AnimatedSaveButtonProps {
  onPress: () => void;
  isSaving: boolean;
  isSuccess: boolean;
  style?: StyleProp<ViewStyle>;
  label?: string;
}

export const AnimatedSaveButton: React.FC<AnimatedSaveButtonProps> = ({
  onPress,
  isSaving,
  isSuccess,
  style,
  label = 'Save',
}) => {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSaving) {
      // Rotating spinner animation
      const rotation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotation.start();
      return () => rotation.stop();
    } else {
      rotateAnim.setValue(0);
    }
  }, [isSaving]);

  useEffect(() => {
    if (isSuccess) {
      // Trigger success haptic
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Pulse animation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Checkmark scale-in animation
      Animated.spring(checkmarkScale, {
        toValue: 1,
        tension: 200,
        friction: 6,
        useNativeDriver: true,
      }).start();

      // Reset after a delay
      setTimeout(() => {
        Animated.timing(checkmarkScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, 1500);
    }
  }, [isSuccess]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const backgroundColor = isSuccess
    ? theme.success || '#10B981'
    : theme.primary;

  return (
    <AnimatedButton
      onPress={onPress}
      disabled={isSaving}
      hapticFeedback="medium"
      style={[
        styles.button,
        { backgroundColor },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        {isSaving ? (
          <Animated.Text
            style={[
              styles.spinner,
              { transform: [{ rotate: spin }] },
            ]}
          >
            ⟳
          </Animated.Text>
        ) : isSuccess ? (
          <Animated.Text
            style={[
              styles.checkmark,
              {
                transform: [{ scale: checkmarkScale }],
              },
            ]}
          >
            ✓
          </Animated.Text>
        ) : null}
        <Text style={styles.label}>
          {isSaving ? 'Saving...' : isSuccess ? 'Saved!' : label}
        </Text>
      </Animated.View>
    </AnimatedButton>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  spinner: {
    fontSize: 18,
    color: '#fff',
  },
  checkmark: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
