import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { colors, shadows } from '../styles/designSystem';
import { AnimatedButton } from './AnimatedButton';

interface FloatingActionButtonProps {
  onPress: () => void;
  style?: any;
  size?: 'small' | 'medium' | 'large';
  icon?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  style,
  size = 'medium',
  icon = '+'
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 48, height: 48, borderRadius: 24 };
      case 'large':
        return { width: 64, height: 64, borderRadius: 32 };
      default:
        return { width: 56, height: 56, borderRadius: 28 };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 28;
      default:
        return 24;
    }
  };

  return (
    <AnimatedButton
      style={[
        styles.container,
        getSizeStyles(),
        { backgroundColor: colors.floatingButton },
        shadows.medium,
        style
      ]}
      onPress={onPress}
      hapticFeedback="medium"
    >
      <Text style={[styles.icon, { fontSize: getIconSize() }]}>
        {icon}
      </Text>
    </AnimatedButton>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.floatingButtonShadow,
  },
  icon: {
    color: colors.white,
    fontWeight: 'bold',
  },
});