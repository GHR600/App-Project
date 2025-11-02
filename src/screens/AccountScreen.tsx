import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { spacing, borderRadius } from '../styles/designSystem';
import { AccountService, UserProfile, UsageStats } from '../services/accountService';
import {
  MenuIcon,
  UserIcon,
  ImageIcon,
  UploadIcon,
  SparklesIcon,
  LockIcon,
  LogOutIcon,
  Trash2Icon,
  ArrowRightIcon,
} from '../components/icons/AppIcons';

interface AccountScreenProps {
  onBack?: () => void;
  onMenuPress?: () => void;
  onManageSubscription?: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  onBack,
  onMenuPress,
  onManageSubscription
}) => {
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const { status, isPremium, isLoading: subscriptionLoading } = useSubscription();

  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Display name editing
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [savingDisplayName, setSavingDisplayName] = useState(false);

  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Load profile data
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [profileResult, statsResult] = await Promise.all([
        AccountService.getUserProfile(),
        AccountService.getUsageStats()
      ]);

      if (profileResult.error) {
        throw new Error('Failed to load profile');
      }

      if (profileResult.data) {
        setProfile(profileResult.data);
        setDisplayName(profileResult.data.display_name || '');
      }

      if (statsResult.data) {
        setUsageStats(statsResult.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load account data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }

    setSavingDisplayName(true);
    const { error } = await AccountService.updateDisplayName(displayName.trim());
    setSavingDisplayName(false);

    if (error) {
      Alert.alert('Error', 'Failed to update display name');
    } else {
      setEditingDisplayName(false);
      loadProfileData(); // Reload to get updated data
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setChangingPassword(true);
    const { error } = await AccountService.updatePassword(newPassword);
    setChangingPassword(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert('Success', 'Password updated successfully');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure? This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDeleteAccount
        }
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    setDeletingAccount(true);
    const { error } = await AccountService.deleteAccount();
    setDeletingAccount(false);

    if (error) {
      Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
    }
    // If successful, user will be signed out automatically
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'default',
          onPress: async () => {
            await signOut();
          }
        }
      ]
    );
  };

  const handleProfilePictureUpload = () => {
    Alert.alert(
      'Profile Picture',
      'Profile picture upload requires installing expo-image-picker. This feature will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.buttonPrimary }]}
            onPress={loadProfileData}
          >
            <Text style={[styles.retryButtonText, { color: theme.textInverse }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const usagePercentage = usageStats
    ? (usageStats.free_insights_used / usageStats.free_insights_limit) * 100
    : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
          <MenuIcon size={28} color={theme.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.menuButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Profile</Text>

          {/* Profile Picture */}
          <TouchableOpacity
            style={[styles.profilePictureContainer, { borderColor: theme.primary }]}
            onPress={handleProfilePictureUpload}
          >
            {profile?.profile_picture_url ? (
              <ImageIcon size={48} color={theme.primary} strokeWidth={2} />
            ) : (
              <UserIcon size={48} color={theme.primary} strokeWidth={2} />
            )}
          </TouchableOpacity>
          

          {/* Email */}
          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: theme.textSecondary }]}>Email</Text>
            <Text style={[styles.profileValue, { color: theme.textPrimary }]}>
              {profile?.email || user?.email}
            </Text>
          </View>

          {/* Join Date */}
          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: theme.textSecondary }]}>Member Since</Text>
            <Text style={[styles.profileValue, { color: theme.textPrimary }]}>
              {profile?.created_at ? formatDate(profile.created_at) : 'N/A'}
            </Text>
          </View>

          {/* Display Name */}
          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: theme.textSecondary }]}>Display Name</Text>
            {editingDisplayName ? (
              <View style={styles.displayNameEdit}>
                <TextInput
                  style={[
                    styles.displayNameInput,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.textPrimary
                    }
                  ]}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter display name"
                  placeholderTextColor={theme.placeholderText}
                  autoFocus
                />
                <View style={styles.displayNameActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.buttonPrimary }]}
                    onPress={handleSaveDisplayName}
                    disabled={savingDisplayName}
                  >
                    {savingDisplayName ? (
                      <ActivityIndicator size="small" color={theme.textInverse} />
                    ) : (
                      <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>
                        Save
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.buttonSecondary }]}
                    onPress={() => {
                      setEditingDisplayName(false);
                      setDisplayName(profile?.display_name || '');
                    }}
                  >
                    <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.displayNameView}>
                <Text style={[styles.profileValue, { color: theme.textPrimary }]}>
                  {displayName || 'Not set'}
                </Text>
                <TouchableOpacity onPress={() => setEditingDisplayName(true)}>
                  <Text style={[styles.editLink, { color: theme.primary }]}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Subscription Status Section */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Subscription Status
          </Text>

          {/* Plan Badge */}
          <View style={styles.planBadgeContainer}>
            <View
              style={[
                styles.planBadge,
                {
                  backgroundColor: isPremium ? theme.success : theme.backgroundTertiary,
                  borderColor: isPremium ? theme.success : theme.cardBorder
                }
              ]}
            >
              {isPremium ? (
                <View style={styles.planBadgeContent}>
                  <SparklesIcon size={20} color="#fff" strokeWidth={2} />
                  <Text style={[styles.planBadgeText, { color: '#fff' }]}>Premium</Text>
                </View>
              ) : (
                <Text style={[styles.planBadgeText, { color: theme.textPrimary }]}>Free Plan</Text>
              )}
            </View>
          </View>

          {/* Usage Progress Bar (only for free users) */}
          {!isPremium && usageStats && (
            <View style={styles.usageContainer}>
              <View style={styles.usageHeader}>
              

              </View>
              <View style={[styles.progressBarBackground, { backgroundColor: theme.backgroundTertiary }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(usagePercentage, 100)}%`,
                      backgroundColor: usagePercentage >= 100 ? theme.error : theme.primary
                    }
                  ]}
                />
              </View>
              <Text style={[styles.usageHint, { color: theme.textMuted }]}>
                {usagePercentage >= 100
                  ? 'Upgrade to premium for unlimited insights'
                  : `${Math.round(((usageStats.free_insights_limit - usageStats.free_insights_used) / usageStats.free_insights_limit) * 100)}% AI Usage Remaining`}
              </Text>
            </View>
          )}

          {/* Manage/Upgrade Button */}
          <TouchableOpacity
            style={[styles.subscriptionButton, { backgroundColor: theme.buttonPrimary }]}
            onPress={onManageSubscription}
          >
            <Text style={[styles.subscriptionButtonText, { color: theme.textInverse }]}>
              {isPremium ? 'Manage Subscription' : 'Upgrade to Premium'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account Actions Section */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Account Actions
          </Text>

          {/* Change Password */}
          <TouchableOpacity
            style={[styles.actionRow, { borderBottomColor: theme.cardBorder }]}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={styles.actionRowContent}>
              <LockIcon size={20} color={theme.textPrimary} strokeWidth={2} />
              <Text style={[styles.actionText, { color: theme.textPrimary }]}>
                Change Password
              </Text>
            </View>
            <ArrowRightIcon size={20} color={theme.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          {/* Sign Out */}
          <TouchableOpacity
            style={[styles.actionRow, { borderBottomColor: theme.cardBorder }]}
            onPress={handleSignOut}
          >
            <View style={styles.actionRowContent}>
              <LogOutIcon size={20} color={theme.textPrimary} strokeWidth={2} />
              <Text style={[styles.actionText, { color: theme.textPrimary }]}>
                Sign Out
              </Text>
            </View>
            <ArrowRightIcon size={20} color={theme.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          {/* Delete Account */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleDeleteAccount}
            disabled={deletingAccount}
          >
            {deletingAccount ? (
              <ActivityIndicator size="small" color={theme.error} />
            ) : (
              <>
                <View style={styles.actionRowContent}>
                  <Trash2Icon size={20} color={theme.error} strokeWidth={2} />
                  <Text style={[styles.actionText, { color: theme.error }]}>
                    Delete Account
                  </Text>
                </View>
                <ArrowRightIcon size={20} color={theme.error} strokeWidth={2} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Change Password
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.textPrimary
                }
              ]}
              placeholder="New Password"
              placeholderTextColor={theme.placeholderText}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.textPrimary
                }
              ]}
              placeholder="Confirm Password"
              placeholderTextColor={theme.placeholderText}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.buttonSecondary }]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.buttonPrimary }]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color={theme.textInverse} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: theme.textInverse }]}>
                    Update
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontFamily: 'Yellowtail_400Regular',
    fontSize: 32,
    color: '#eab308',
    lineHeight: 44,
    paddingHorizontal: 4,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 400,
    height: 400,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: spacing.md,
  },
  profilePictureContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  uploadButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  uploadButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  profileRow: {
    marginBottom: spacing.md,
  },
  profileLabel: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  displayNameView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  displayNameEdit: {
    marginTop: spacing.xs,
  },
  displayNameInput: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  displayNameActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  planBadgeContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
  },
  planBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  planBadgeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  usageContainer: {
    marginBottom: spacing.md,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  usageLabel: {
    fontSize: 14,
  },
  usageCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  usageHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  subscriptionButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  subscriptionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  actionRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
