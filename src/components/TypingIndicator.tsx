import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing
} from 'react-native';
import { colors } from '../styles/designSystem';

interface TypingIndicatorProps {
  isVisible: boolean;
  message?: string;
  style?: any;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isVisible,
  message = 'AI is thinking...',
  style
}) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Fade in the indicator
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Create the bouncing dots animation
      const createDotAnimation = (dot: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              easing: Easing.bezier(0.2, 0.68, 0.18, 1.08),
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              easing: Easing.bezier(0.2, 0.68, 0.18, 1.08),
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animations = [
        createDotAnimation(dot1, 0),
        createDotAnimation(dot2, 200),
        createDotAnimation(dot3, 400),
      ];

      animations.forEach(animation => animation.start());

      return () => {
        animations.forEach(animation => animation.stop());
      };
    } else {
      // Fade out the indicator
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Reset dots
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
    }
  }, [isVisible, dot1, dot2, dot3, opacity]);

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity }, style]}>
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>{message}</Text>
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                transform: [{
                  translateY: dot1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8],
                  }),
                }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                transform: [{
                  translateY: dot2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8],
                  }),
                }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                transform: [{
                  translateY: dot3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8],
                  }),
                }],
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 14,
    color: colors.gray600,
    marginRight: 8,
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
});