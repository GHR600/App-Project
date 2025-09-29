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
import { colors, typography, spacing, borderRadius } from '../styles/designSystem';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { DayCard } from '../components/DayCard';
import { JournalService, JournalEntryWithInsights } from '../services/journalService';
import { EntryService } from '../services/entryService';
import { DayCardData } from '../types';

interface DashboardHomeScreenProps {
  userId: string;
  onNewEntry: () => void;
  onEntryPress: (entry: any) => void;
  onBack?: () => void;
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
  if (isLoading) {
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.statCard, styles.loadingCard]}>
              <View style={styles.loadingText} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalEntries}</Text>
          <Text style={styles.statLabel}>Entries</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.averageMood.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avg Mood</Text>
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
  navigation
}) => {
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
    navigation.navigate('DayDetail', {
      date: dayData.date,
      dayData,
      userId
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
            <View key={i} style={[styles.dayCardLoading]}>
              <View style={styles.loadingText} />
              <View style={[styles.loadingText, { width: '60%', marginTop: 8 }]} />
            </View>
          ))}
        </View>
      );
    }

    if (dayCards.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📝</Text>
          <Text style={styles.emptyStateTitle}>Start Your Journey</Text>
          <Text style={styles.emptyStateDescription}>
            Write your first journal entry to begin tracking your thoughts and growth.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleNewEntry}>
            <Text style={styles.primaryButtonText}>Create First Entry</Text>
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
          <TouchableOpacity style={styles.showMoreButton} onPress={handleShowMore}>
            <Text style={styles.showMoreText}>Show More</Text>
          </TouchableOpacity>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.background} />

      <View style={styles.content}>
        <StatsHeader stats={stats} isLoading={isLoading} />

        <ScrollView
          style={styles.entriesContainer}
          contentContainerStyle={styles.entriesContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.entriesHeader}>
            <Text style={styles.entriesTitle}>Recent Days</Text>
            <TouchableOpacity style={styles.newEntryButton} onPress={handleNewEntry}>
              <Text style={styles.newEntryButtonText}>+ New</Text>
            </TouchableOpacity>
          </View>

          {renderDayCards()}
        </ScrollView>
      </View>

      <FloatingActionButton onPress={handleNewEntry} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },

  // Compact Stats Header (MyDiary Style)
  statsContainer: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, // Made more compact
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18, // Slightly smaller
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
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
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  newEntryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // Show More Button
  showMoreButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  showMoreText: {
    ...typography.body,
    color: colors.primary,
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
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
    maxWidth: 280,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    gap: spacing.sm,
  },
  dayCardLoading: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.backgroundTertiary,
  },
  loadingText: {
    height: 16,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 4,
    marginBottom: 8,
  },
});