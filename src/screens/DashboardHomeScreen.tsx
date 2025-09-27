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
        <View style={styles.moodContainer}>
          <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood_rating)}</Text>
          {entry.mood_rating && (
            <Text style={styles.moodText}>{entry.mood_rating}/5</Text>
          )}
        </View>
      </View>
      <Text style={styles.entryPreview} numberOfLines={2}>
        {getPreviewText(entry.content)}
      </Text>

      {entry.ai_insights && entry.ai_insights.length > 0 && (
        <View style={styles.insightPreview}>
          <View style={styles.insightHeader}>
            <Text style={styles.insightIcon}>🧠</Text>
            <Text style={styles.insightLabel}>AI Insight</Text>
          </View>
          <Text style={styles.insightText} numberOfLines={1}>
            {entry.ai_insights[0].insight_text}
          </Text>
        </View>
      )}

      <View style={styles.entryCardFooter}>
        <View style={styles.footerLeft}>
          <Text style={styles.wordCount}>
            {entry.word_count || entry.content.split(' ').length} words
          </Text>
          {entry.ai_insights && entry.ai_insights.length > 0 && (
            <Text style={styles.insightCount}>• {entry.ai_insights.length} insight{entry.ai_insights.length !== 1 ? 's' : ''}</Text>
          )}
        </View>
        <Text style={styles.readMore}>Tap to read more →</Text>
      </View>
    </TouchableOpacity>
  );
};

const StatsHeader: React.FC<{ stats: UserStats; isLoading: boolean }> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          {[1, 2, 3, 4].map(i => (
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
      <Text style={styles.statsTitle}>Your Journey</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statNumber}>{stats.currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📔</Text>
          <Text style={styles.statNumber}>{stats.totalEntries}</Text>
          <Text style={styles.statLabel}>Total Entries</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>😊</Text>
          <Text style={styles.statNumber}>{stats.averageMood.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avg Mood</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📝</Text>
          <Text style={styles.statNumber}>{stats.entriesThisMonth}</Text>
          <Text style={styles.statLabel}>This Month</Text>
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
      {onBack && (
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={styles.headerSpacer} />
        </View>
      )}

      <View style={styles.content}>
        <StatsHeader stats={stats} isLoading={isLoading} />

        <DiaryView
          entries={entries}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onNewEntry={onNewEntry}
          onEntryPress={onEntryPress}
          onEditEntry={handleEditEntry}
          onChatMessage={handleChatMessage}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray900,
  },
  headerSpacer: {
    width: 50,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray600,
    textAlign: 'center',
  },
  entriesSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    minHeight: 400,
  },
  entriesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  entriesSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray900,
  },
  newEntryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  newEntryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  entriesList: {
    gap: 16,
  },
  entryCard: {
    backgroundColor: colors.white,
    borderRadius: components.card.borderRadius,
    padding: 16,
    ...components.card,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  entryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodText: {
    fontSize: 12,
    color: colors.gray600,
  },
  entryPreview: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray800,
    marginBottom: 12,
  },
  insightPreview: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  insightIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  insightLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  insightText: {
    fontSize: 14,
    color: colors.gray700,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  entryCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordCount: {
    fontSize: 12,
    color: colors.gray500,
  },
  insightCount: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 8,
  },
  readMore: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 280,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: components.button.borderRadius,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  viewMoreButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    gap: 16,
  },
  loadingCard: {
    backgroundColor: colors.gray100,
  },
  loadingText: {
    height: 20,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    marginBottom: 8,
  },
});