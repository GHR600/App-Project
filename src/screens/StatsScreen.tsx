import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedButton } from '../components/AnimatedButton';
import { useTheme } from '../contexts/ThemeContext';
import { spacing } from '../styles/designSystem';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { supabase, DatabaseJournalEntry } from '../config/supabase';
import { AnalyticsService, AdvancedAnalytics } from '../services/analyticsService';
import { MenuIcon, StatsIcon } from '../components/icons/AppIcons';

interface StatsScreenProps {
  userId: string;
  onBack?: () => void;
  onMenuPress?: () => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ userId, onBack, onMenuPress }) => {
  const { theme } = useTheme();
  const [entries, setEntries] = useState<DatabaseJournalEntry[]>([]);
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = useCallback(async () => {
    if (isRefreshing) {
      // Don't show loading spinner when refreshing
    } else {
      setIsLoading(true);
    }
    try {
      // Fetch journal entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (entriesError) {
        console.error('Error loading entries:', entriesError);
      } else {
        setEntries(entriesData || []);
      }

      // Generate analytics
      const { analytics: analyticsData, error: analyticsError } = await AnalyticsService.generateAdvancedAnalytics(userId);

      if (!analyticsError && analyticsData) {
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Error loading stats data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId, isRefreshing]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
  }, [loadData]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with menu button */}
      <View style={styles.header}>
        <AnimatedButton
          style={styles.menuButton}
          onPress={onMenuPress}
          hapticFeedback="light"
        >
          <MenuIcon size={24} color={theme.primary} strokeWidth={2.5} />
        </AnimatedButton>
        <Text style={styles.headerTitle}>Statistics</Text>
        <View style={styles.menuButton} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading your stats...
          </Text>
        </View>
      ) : analytics ? (
        <ScrollView
          style={styles.scrollView}
          bounces={true}
          alwaysBounceVertical={true}
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        >
          {/* Analytics Dashboard with tabs */}
          <AnalyticsDashboard userId={userId} />
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <StatsIcon size={64} color={theme.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>No Data Yet</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Start writing journal entries to see your stats!
          </Text>
        </View>
      )}
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyIconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 36,
    fontWeight: '600',
    color: '#eab308',
    lineHeight: 48,
    paddingHorizontal: 4,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
