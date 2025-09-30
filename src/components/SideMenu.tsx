import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');
const MENU_WIDTH = Math.min(280, width * 0.8);

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: 'account' | 'settings' | 'notes' | 'calendar' | 'stats') => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({
  visible,
  onClose,
  onNavigate,
}) => {
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const [slideAnim] = React.useState(new Animated.Value(-MENU_WIDTH));

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -MENU_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNavigate = (screen: 'account' | 'settings' | 'notes' | 'calendar' | 'stats') => {
    onNavigate(screen);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const menuItems = [
    { key: 'account' as const, icon: '👤', label: 'Account', onPress: () => handleNavigate('account') },
    { key: 'settings' as const, icon: '⚙️', label: 'Settings', onPress: () => handleNavigate('settings') },
    { key: 'notes' as const, icon: '📝', label: 'Notes', onPress: () => handleNavigate('notes') },
    { key: 'calendar' as const, icon: '📅', label: 'Calendar', onPress: () => handleNavigate('calendar') },
    { key: 'stats' as const, icon: '📊', label: 'Stats', onPress: () => handleNavigate('stats') },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.menuContainer,
                {
                  backgroundColor: theme.background,
                  width: MENU_WIDTH,
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
                <Text style={[styles.appTitle, { color: theme.primary }]}>📝 Journal</Text>
                {user && (
                  <Text style={[styles.userEmail, { color: theme.textSecondary }]} numberOfLines={1}>
                    {user.email}
                  </Text>
                )}
              </View>

              {/* Menu Items */}
              <View style={styles.menuItems}>
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.menuItem, { borderBottomColor: theme.cardBorder }]}
                    onPress={item.onPress}
                  >
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sign Out */}
              {user && (
                <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
                  <TouchableOpacity
                    style={[styles.signOutButton, { backgroundColor: theme.error }]}
                    onPress={handleSignOut}
                  >
                    <Text style={[styles.signOutText, { color: theme.white }]}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  menuContainer: {
    height: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 15,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  menuItems: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 28,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  signOutButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});