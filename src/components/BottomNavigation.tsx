import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { AnimatedButton } from './AnimatedButton';

interface BottomNavigationProps {
  activeTab: 'calendar' | 'home' | 'stats';
  onTabPress: (tab: 'calendar' | 'home' | 'stats') => void;
  onNewEntry: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabPress,
  onNewEntry,
}) => {
  const { theme } = useTheme();
  const [pressedButton, setPressedButton] = useState<'calendar' | 'stats' | null>(null);

  // Pulsating animation for center button halo
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {/* Calendar Button */}
        <AnimatedButton
          style={[
            styles.sideButton,
            { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
          ]}
          onPress={() => onTabPress('calendar')}
          hapticFeedback="light"
          scaleMin={0.92}
        >
          <Text style={[styles.icon, { color: theme.white }]}>
            ☷
          </Text>
          <Text style={[styles.label, { color: theme.white }]}>
            Calendar
          </Text>
        </AnimatedButton>

        {/* New Entry Button (Center) with Pulsating Halo */}
        <View style={styles.centerButtonContainer}>
          <Animated.View
            style={[
              styles.halo,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.3],
                  outputRange: [0.4, 0],
                }),
              },
            ]}
          />
          <AnimatedButton
            style={[styles.centerButton, { backgroundColor: theme.primary }]}
            onPress={onNewEntry}
            hapticFeedback="medium"
            scaleMin={0.92}
          >
            <Text style={[styles.plusIcon, { color: theme.white }]}>+</Text>
          </AnimatedButton>
        </View>

        {/* Stats Button */}
        <AnimatedButton
          style={[
            styles.sideButton,
            { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
          ]}
          onPress={() => onTabPress('stats')}
          hapticFeedback="light"
          scaleMin={0.92}
        >
          <Text style={[styles.icon, { color: theme.white }]}>
            ⚊
          </Text>
          <Text style={[styles.label, { color: theme.white }]}>
            Stats
          </Text>
        </AnimatedButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 74,
    paddingTop: 8,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
  },
  sideButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  icon: {
    fontSize: 16,
    marginBottom: 2,
  },
  label: {
    fontSize: 8,
    fontWeight: '500',
  },
  centerButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  halo: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 12,
  },
  plusIcon: {
    fontSize: 36,
    fontWeight: '300',
    lineHeight: 36,
  },
});