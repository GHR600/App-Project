import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { spacing } from '../styles/designSystem';
import { QuickStatsBanner } from '../components/QuickStatsBanner';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { supabase, DatabaseJournalEntry } from '../config/supabase';
import { AnalyticsService, AdvancedAnalytics } from '../services/analyticsService';

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

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setIsLoading(true);
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
    }
  };

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
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Statistics</Text>
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
        <ScrollView style={styles.scrollView}>
          {/* Quick Stats Banner - Always visible at top */}
          <QuickStatsBanner
            totalEntries={entries.length}
            totalWords={analytics.contentAnalysis.totalWords}
            avgWordsPerEntry={analytics.contentAnalysis.averageWordsPerEntry}
            currentStreak={analytics.streakAnalysis.currentStreak}
          />

          {/* Analytics Dashboard with tabs */}
          <AnalyticsDashboard userId={userId} />
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.icon, { color: theme.primary }]}>📊</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>No Data Yet</Text>
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
  menuIcon: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
