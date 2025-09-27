import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  BlurView
} from 'react-native';
import { colors } from '../styles/designSystem';

interface PrivacyOverlayProps {
  isVisible: boolean;
  onUnlock: () => void;
  children: React.ReactNode;
}

export const PrivacyOverlay: React.FC<PrivacyOverlayProps> = ({
  isVisible,
  onUnlock,
  children
}) => {
  const { width, height } = Dimensions.get('window');

  if (!isVisible) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {/* Blurred content */}
      <View style={[styles.blurredContent, { opacity: 0.3 }]}>
        {children}
      </View>

      {/* Privacy overlay */}
      <View style={[styles.overlay, { width, height }]}>
        <View style={styles.overlayContent}>
          <View style={styles.iconContainer}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>

          <Text style={styles.title}>Privacy Mode Active</Text>
          <Text style={styles.description}>
            Your journal content is protected. Tap to unlock and continue reading.
          </Text>

          <TouchableOpacity
            style={styles.unlockButton}
            onPress={onUnlock}
            activeOpacity={0.8}
          >
            <Text style={styles.unlockButtonText}>🔓 Unlock Content</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Your content will auto-lock again after 5 minutes of inactivity
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  blurredContent: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  overlayContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  lockIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  unlockButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginBottom: 16,
  },
  unlockButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 20,
  },
});