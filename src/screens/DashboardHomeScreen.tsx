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
import { colors, typography, components } from '../styles/designSystem';
import { JournalService, JournalEntryWithInsights } from '../services/journalService';
import { DatabaseJournalEntry } from '../config/supabase';
import { DiaryView } from '../components/DiaryView';

interface DashboardHomeScreenProps {
  userId: string;
  onNewEntry: () => void;
  onEntryPress: (entry: DatabaseJournalEntry) => void;
  onBack?: () => void;
}

interface UserStats {
  totalEntries: number;
  currentStreak: number;
  averageMood: number;
  totalWords: number;
  entriesThisMonth: number;
}

interface EntryCardProps {
  entry: JournalEntryWithInsights;
  onPress: () => void;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, onPress }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const getMoodEmoji = (rating: number | null) => {
    if (!rating) return '😐';
    switch (rating) {
      case 1: return '😢';
      case 2: return '😕';
      case 3: return '😐';
      case 4: return '😊';
      case 5: return '😄';
      default: return '😐';
    }
  };

  const getPreviewText = (content: string) => {
    const lines = content.split('\n');
    const firstTwoLines = lines.slice(0, 2).join(' ');
    return firstTwoLines.length > 120
      ? `${firstTwoLines.substring(0, 120)}...`
      : firstTwoLines;
  };

  return (
    <TouchableOpacity style={styles.entryCard} onPress={onPress}>
      <View style={styles.entryCardHeader}>
        <Text style={styles.entryDate}>{formatDate(entry.created_at)}</Text>
        <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood_rating ?? null)}</Text>
      </View>

      <Text style={styles.entryPreview} numberOfLines={3}>
        {getPreviewText(entry.content)}
      </Text>

      <View style={styles.entryCardFooter}>
        <Text style={styles.wordCount}>
          {entry.word_count || entry.content.split(' ').length} words
        </Text>
      </View>
    </TouchableOpacity>
  );
};

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
  onBack
}) => {
  const [entries, setEntries] = useState<JournalEntryWithInsights[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalEntries: 0,
    currentStreak: 0,
    averageMood: 0,
    totalWords: 0,
    entriesThisMonth: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Load user stats
      const { stats: userStats, error: statsError } = await JournalService.getUserStats(userId);
      if (statsError) {
        console.error('Error loading stats:', statsError);
      } else {
        setStats(userStats);
      }

      // Load recent entries with insights
      const { entries: userEntries, error: entriesError } = await JournalService.getUserEntriesWithInsights(userId, {
        limit: 10,
        orderBy: 'created_at',
        ascending: false
      });

      if (entriesError) {
        console.error('Error loading entries:', entriesError);
        Alert.alert('Error', 'Failed to load your journal entries. Please try again.');
      } else {
        setEntries(userEntries);
      }
    } catch (error) {
      console.error('Unexpected error loading dashboard data:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  const handleEditEntry = useCallback(async (entryId: string, newContent: string) => {
    try {
      const { error } = await JournalService.updateEntry(userId, entryId, { content: newContent });
      if (error) {
        Alert.alert('Error', 'Failed to update entry. Please try again.');
      } else {
        // Refresh the entries to show the updated content
        await loadData();
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  }, [userId, loadData]);

  const handleChatMessage = useCallback(async (entryId: string, message: string) => {
    try {
      // TODO: Implement chat functionality with AI
      console.log('Chat message for entry', entryId, ':', message);
      Alert.alert('Coming Soon', 'Chat functionality will be available in a future update.');
    } catch (error) {
      console.error('Error sending chat message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
            <Text style={styles.entriesTitle}>Recent Entries</Text>
            <TouchableOpacity style={styles.newEntryButton} onPress={onNewEntry}>
              <Text style={styles.newEntryButtonText}>+ New</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              {[1, 2, 3].map(i => (
                <View key={i} style={[styles.entryCard, styles.loadingCard]}>
                  <View style={styles.loadingText} />
                </View>
              ))}
            </View>
          ) : entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📝</Text>
              <Text style={styles.emptyStateTitle}>Start Your Journey</Text>
              <Text style={styles.emptyStateDescription}>
                Write your first journal entry to begin tracking your thoughts and growth.
              </Text>
              <TouchableOpacity style={styles.primaryButton} onPress={onNewEntry}>
                <Text style={styles.primaryButtonText}>Create First Entry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onPress={() => onEntryPress(entry)}
              />
            ))
          )}
        </ScrollView>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Entries Section
  entriesContainer: {
    flex: 1,
  },
  entriesContent: {
    padding: 16,
  },
  entriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  entriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  newEntryButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  newEntryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // Dark Entry Cards (MyDiary Style)
  entryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: 16,
    marginBottom: 12,
  },
  entryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 12,
    color: colors.primaryLight,
    fontWeight: '500',
  },
  moodEmoji: {
    fontSize: 16,
  },
  entryPreview: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  entryCardFooter: {
    alignItems: 'flex-start',
  },
  wordCount: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Empty State & Loading
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 280,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    gap: 12,
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