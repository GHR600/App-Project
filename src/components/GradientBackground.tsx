import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientBackgroundProps {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  colors?: readonly [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  style,
  colors = ['#eab308', '#ca8a04', '#a16207'] as const, // yellow-500, yellow-600, yellow-700
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 }, // Diagonal gradient (top-left to bottom-right)
}) => {
  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
