import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
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

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={[styles.navBar, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
        {/* Calendar Button */}
        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === 'calendar' && { backgroundColor: theme.primaryLight }
          ]}
          onPress={() => onTabPress('calendar')}
        >
          <Text style={[styles.icon, { color: activeTab === 'calendar' ? theme.primary : theme.textSecondary }]}>
            ☷
          </Text>
          <Text style={[styles.label, { color: activeTab === 'calendar' ? theme.primary : theme.textSecondary }]}>
            Calendar
          </Text>
        </TouchableOpacity>

        {/* New Entry Button (Center) */}
        <View style={styles.centerButtonContainer}>
          <TouchableOpacity
            style={[styles.centerButton, { backgroundColor: theme.primary }]}
            onPress={onNewEntry}
          >
            <Text style={[styles.plusIcon, { color: theme.white }]}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Button */}
        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === 'stats' && { backgroundColor: theme.primaryLight }
          ]}
          onPress={() => onTabPress('stats')}
        >
          <Text style={[styles.icon, { color: activeTab === 'stats' ? theme.primary : theme.textSecondary }]}>
            ⚊
          </Text>
          <Text style={[styles.label, { color: activeTab === 'stats' ? theme.primary : theme.textSecondary }]}>
            Stats
          </Text>
        </TouchableOpacity>
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
    paddingBottom: 34, // Increased padding to avoid Android system buttons
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  centerButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
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