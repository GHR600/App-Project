import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.backgroundTertiary || '#E5E7EB',
          opacity,
        },
        style,
      ]}
    />
  );
};

interface SkeletonCardProps {
  style?: StyleProp<ViewStyle>;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ style }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }, style]}>
      <SkeletonLoader width="40%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="100%" height={20} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="80%" height={20} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="60%" height={16} />
    </View>
  );
};

interface FadeInViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  duration = 300,
  delay = 0,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, [fadeAnim, scaleAnim, duration, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
});
