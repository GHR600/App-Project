import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../contexts/ThemeContext';
import { typography, spacing, borderRadius } from '../styles/designSystem';
import { BottomNavigation } from '../components/BottomNavigation';
import { DayCard } from '../components/DayCard';
import { JournalService, JournalEntryWithInsights } from '../services/journalService';
import { EntryService } from '../services/entryService';
import { DayCardData } from '../types';

interface DashboardHomeScreenProps {
  userId: string;
  onNewEntry: () => void;
  onEntryPress: (entry: any) => void;
  onBack?: () => void;
  onMenuPress?: () => void;
  onNavigateToCalendar?: () => void;
  onNavigateToStats?: () => void;
  navigation: any;
}

interface UserStats {
  totalEntries: number;
  currentStreak: number;
  averageMood: number;
  totalWords: number;
  entriesThisMonth: number;
}

const StatsHeader: React.FC<{ stats: UserStats; isLoading: boolean }> = ({ stats, isLoading }) => {
  const { theme } = useTheme();

  const getStreakEmoji = (streak: number) => {
    if (streak === 0) return '📝';
    if (streak < 3) return '🔥';
    if (streak < 7) return '🔥🔥';
    if (streak < 14) return '🔥🔥🔥';
    if (streak < 30) return '⭐';
    if (streak < 100) return '🏆';
    return '👑';
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return 'Start your streak!';
    if (streak === 1) return 'Great start!';
    if (streak < 3) return 'Keep it up!';
    if (streak < 7) return 'On fire!';
    if (streak < 14) return 'Impressive!';
    if (streak < 30) return 'Amazing streak!';
    if (streak < 100) return 'Legendary!';
    return 'Master journaler!';
  };

  if (isLoading) {
    return (
      <View style={[styles.statsContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <View style={styles.streakBanner}>
          <View style={[styles.loadingText, { backgroundColor: theme.backgroundTertiary, width: '60%', height: 24 }]} />
        </View>
        <View style={styles.statsRow}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.statCard, styles.loadingCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.loadingText, { backgroundColor: theme.backgroundTertiary }]} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.statsContainer, { backgroundColor: theme.backgroundSecondary }]}>
      {/* Streak Banner */}
      <View style={[styles.streakBanner, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
        <Text style={[styles.streakEmoji]}>{getStreakEmoji(stats.currentStreak)}</Text>
        <View style={styles.streakInfo}>
          <Text style={[styles.streakNumber, { color: theme.primary }]}>
            {stats.currentStreak} Day Streak
          </Text>
          <Text style={[styles.streakMessage, { color: theme.textSecondary }]}>
            {getStreakMessage(stats.currentStreak)}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statNumber, { color: theme.textPrimary }]}>{stats.totalEntries}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Entries</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statNumber, { color: theme.textPrimary }]}>{stats.entriesThisMonth}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>This Month</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statNumber, { color: theme.textPrimary }]}>{stats.averageMood.toFixed(1)}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Avg Mood</Text>
        </View>
      </View>
    </View>
  );
};

export const DashboardHomeScreen: React.FC<DashboardHomeScreenProps> = ({
  userId,
  onNewEntry,
  onEntryPress,
  onBack,
  onMenuPress,
  onNavigateToCalendar,
  onNavigateToStats,
  navigation
}) => {
  const { theme } = useTheme();
  const [dayCards, setDayCards] = useState<DayCardData[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalEntries: 0,
    currentStreak: 0,
    averageMood: 0,
    totalWords: 0,
    entriesThisMonth: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMoreDays, setShowMoreDays] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Load user stats (keep existing functionality)
      const { stats: userStats, error: statsError } = await JournalService.getUserStats(userId);
      if (statsError) {
        console.error('Error loading stats:', statsError);
      } else {
        setStats(userStats);
      }

      // Load day-based entries
      const limit = showMoreDays ? 14 : 7; // Show 7 initially, 14 when "Show More" is pressed
      const { dayCards: userDayCards, error: dayCardsError } = await EntryService.getEntriesGroupedByDay(userId, limit);

      if (dayCardsError) {
        console.error('Error loading day cards:', dayCardsError);
        Alert.alert('Error', 'Failed to load your journal entries. Please try again.');
      } else {
        setDayCards(userDayCards);
      }
    } catch (error) {
      console.error('Unexpected error loading dashboard data:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, showMoreDays]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  const handleDayPress = (dayData: DayCardData) => {
    // Navigate directly to the journal entry for that day
    // If there's an existing entry, open it in edit mode
    // If no entry exists, create a new one for that date
    const hasJournalEntry = dayData.journalEntry !== null && dayData.journalEntry !== undefined;

    navigation.navigate('JournalEntry', {
      mode: hasJournalEntry ? 'edit' : 'create',
      entryId: hasJournalEntry && dayData.journalEntry ? dayData.journalEntry.id : undefined,
      initialDate: dayData.date,
      fromScreen: 'Dashboard'
    });
  };

  const handleNewEntry = () => {
    navigation.navigate('JournalEntry', {
      mode: 'create',
      fromScreen: 'Dashboard'
    });
  };

  const handleShowMore = () => {
    setShowMoreDays(true);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderDayCards = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.dayCardLoading, { backgroundColor: theme.surface }]}>
              <View style={[styles.loadingText, { backgroundColor: theme.backgroundTertiary }]} />
              <View style={[styles.loadingText, { width: '60%', marginTop: 8, backgroundColor: theme.backgroundTertiary }]} />
            </View>
          ))}
        </View>
      );
    }

    if (dayCards.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📝</Text>
          <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>Start Your Journey</Text>
          <Text style={[styles.emptyStateDescription, { color: theme.textSecondary }]}>
            Write your first journal entry to begin tracking your thoughts and growth.
          </Text>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={handleNewEntry}>
            <Text style={[styles.primaryButtonText, { color: theme.white }]}>Create First Entry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        {dayCards.map((dayData) => (
          <DayCard
            key={dayData.date}
            dayData={dayData}
            onPress={() => handleDayPress(dayData)}
          />
        ))}

        {!showMoreDays && dayCards.length >= 7 && (
          <TouchableOpacity style={[styles.showMoreButton, { borderColor: theme.primary }]} onPress={handleShowMore}>
            <Text style={[styles.showMoreText, { color: theme.primary }]}>Show More</Text>
          </TouchableOpacity>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <View style={styles.content}>
        {/* Header with menu button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={onMenuPress}
          >
            <Text style={[styles.menuIcon, { color: theme.primary }]}>☰</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Dashboard</Text>
          <View style={styles.menuButton} />
        </View>

        <StatsHeader stats={stats} isLoading={isLoading} />

        <ScrollView
          style={styles.entriesContainer}
          contentContainerStyle={[styles.entriesContent, { paddingBottom: 100 }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.entriesHeader}>
            <Text style={[styles.entriesTitle, { color: theme.textPrimary }]}>Recent Days</Text>
          </View>

          {renderDayCards()}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
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

  // Compact Stats Header (MyDiary Style)
  statsContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  streakEmoji: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  streakMessage: {
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
    padding: spacing.sm,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },

  // Entries Section
  entriesContainer: {
    flex: 1,
  },
  entriesContent: {
    padding: spacing.md,
    paddingBottom: 100, // Space for FAB
  },
  entriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  entriesTitle: {
    ...typography.h3,
    fontWeight: '600',
  },
  newEntryButton: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  newEntryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Show More Button
  showMoreButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  showMoreText: {
    ...typography.body,
    fontWeight: '600',
  },

  // Empty State & Loading
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    ...typography.h2,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  emptyStateDescription: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
    maxWidth: 280,
  },
  primaryButton: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    gap: spacing.sm,
  },
  dayCardLoading: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  loadingCard: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
  },
  loadingText: {
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
});