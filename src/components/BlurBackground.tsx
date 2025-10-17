import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';

interface BlurBackgroundProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  overlayOpacity?: number;
}

export const BlurBackground: React.FC<BlurBackgroundProps> = ({
  children,
  style,
  intensity = 50,
  tint,
  overlayOpacity = 0.3,
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
      <View style={[styles.overlay, { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }]}>
        {children}
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
