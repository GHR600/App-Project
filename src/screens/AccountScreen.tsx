import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { spacing } from '../styles/designSystem';

interface AccountScreenProps {
  onBack?: () => void;
  onMenuPress?: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({ onBack, onMenuPress }) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with menu button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onMenuPress}
        >
          <Text style={[styles.menuIcon, { color: theme.primary }]}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.menuButton} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 }]}>
        <Text style={[styles.icon, { color: theme.primary }]}>👤</Text>
        <Text style={styles.title}>Your Account</Text>
        {user && (
          <Text style={[styles.email, { color: theme.textSecondary }]}>{user.email}</Text>
        )}
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Coming soon: Manage your profile and account settings
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontFamily: 'Yellowtail_400Regular',
    fontSize: 32,
    color: '#eab308',
    lineHeight: 44,
    paddingHorizontal: 4,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: 'Yellowtail_400Regular',
    fontSize: 36,
    color: '#eab308',
    lineHeight: 48,
    paddingHorizontal: 4,
    marginBottom: spacing.sm,
  },
  email: {
    fontSize: 16,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});