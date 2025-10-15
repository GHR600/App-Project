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
  onNavigate: (screen: 'account' | 'settings' | 'export') => void;
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

  const handleNavigate = (screen: 'account' | 'settings' | 'export') => {
    onNavigate(screen);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const mainMenuItems = [
    { key: 'export' as const, icon: '↓', label: 'Export', onPress: () => handleNavigate('export') },
  ];

  const accountMenuItems = [
    { key: 'settings' as const, icon: '⚙', label: 'Settings', onPress: () => handleNavigate('settings') },
    { key: 'account' as const, icon: '◉', label: 'Account', onPress: () => handleNavigate('account') },
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
                <Text style={[styles.appTitle, { color: theme.primary }]}>✎ Journal</Text>
                {user && (
                  <Text style={[styles.userEmail, { color: theme.textSecondary }]} numberOfLines={1}>
                    {user.email}
                  </Text>
                )}
              </View>

              {/* Menu Items */}
              <View style={styles.menuItems}>
                {/* Main Menu Section */}
                {mainMenuItems.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.menuItem, { borderBottomColor: theme.cardBorder }]}
                    onPress={item.onPress}
                  >
                    <Text style={[styles.menuIcon, { color: theme.textPrimary }]}>{item.icon}</Text>
                    <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}

                {/* Separator */}
                <View style={[styles.separator, { backgroundColor: theme.cardBorder }]} />

                {/* Account Menu Section */}
                {accountMenuItems.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.menuItem, { borderBottomColor: theme.cardBorder }]}
                    onPress={item.onPress}
                  >
                    <Text style={[styles.menuIcon, { color: theme.textPrimary }]}>{item.icon}</Text>
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
    fontSize: 22,
    marginRight: 16,
    width: 28,
    textAlign: 'center',
    opacity: 0.85,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    marginVertical: 12,
    marginHorizontal: 20,
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