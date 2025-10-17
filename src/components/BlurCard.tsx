import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';

interface BlurCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

export const BlurCard: React.FC<BlurCardProps> = ({
  children,
  style,
  intensity = 80,
  tint,
}) => {
  const { theme } = useTheme();

  // Auto-detect tint based on theme if not specified
  const blurTint = tint || (theme.background === '#000000' || theme.background.startsWith('#1') ? 'dark' : 'light');

  return (
    <BlurView
      intensity={intensity}
      tint={blurTint}
      style={[styles.container, style]}
    >
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});
