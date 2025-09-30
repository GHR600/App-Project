import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

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

  // Animated values for pulsating halo
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Create pulsating animation
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.3,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.7,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [pulseScale, pulseOpacity]);

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      {/* Calendar Button (LEFT) */}
      <TouchableOpacity
        style={styles.sideButton}
        onPress={() => onTabPress('calendar')}
      >
        <Text style={[styles.sideIcon, { color: activeTab === 'calendar' ? theme.primary : '#FFFFFF' }]}>
          ☷
        </Text>
      </TouchableOpacity>

      {/* New Entry Button (CENTER) with Pulsating Halo */}
      <View style={styles.centerButtonContainer}>
        <Animated.View
          style={[
            styles.halo,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />
        <TouchableOpacity
          style={[styles.centerButton, { backgroundColor: theme.primary }]}
          onPress={onNewEntry}
        >
          <Text style={[styles.plusIcon, { color: theme.white }]}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Button (RIGHT) */}
      <TouchableOpacity
        style={styles.sideButton}
        onPress={() => onTabPress('stats')}
      >
        <Text style={[styles.sideIcon, { color: activeTab === 'stats' ? theme.primary : '#FFFFFF' }]}>
          ⚊
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 75,
    paddingTop: 8,
    paddingHorizontal: 30,
  },
  sideButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sideIcon: {
    fontSize: 22,
    fontWeight: '600',
  },
  centerButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
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