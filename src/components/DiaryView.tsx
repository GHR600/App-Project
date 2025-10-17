import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl
} from 'react-native';
import { AnimatedButton } from './AnimatedButton';
import { colors, typography, components } from '../styles/designSystem';
import { JournalEntryWithInsights } from '../services/journalService';
import { DailyCard } from './DailyCard';

interface DiaryViewProps {
  entries: JournalEntryWithInsights[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onNewEntry: () => void;
  onEntryPress: (entry: JournalEntryWithInsights) => void;
  onEditEntry?: (entryId: string, newContent: string) => void;
  onChatMessage?: (entryId: string, message: string) => void;
}

interface GroupedEntries {
  [key: string]: {
    date: Date;
    entries: JournalEntryWithInsights[];
    label: string;
  };
}

export const DiaryView: React.FC<DiaryViewProps> = ({
  entries,
  isLoading,
  isRefreshing,
  onRefresh,
  onNewEntry,
  onEntryPress,
  onEditEntry,
  onChatMessage
}) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCardExpansion = useCallback((entryId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  }, []);

  const groupedEntries = useMemo(() => {
    const groups: GroupedEntries = {};

    entries.forEach(entry => {
      const entryDate = new Date(entry.created_at);
      const dateKey = entryDate.toDateString();

      if (!groups[dateKey]) {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        let label: string;
        if (entryDate.toDateString() === today.toDateString()) {
          label = 'Today';
        } else if (entryDate.toDateString() === yesterday.toDateString()) {
          label = 'Yesterday';
        } else {
          const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 7) {
            label = entryDate.toLocaleDateString('en-US', { weekday: 'long' });
          } else {
            label = entryDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: entryDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
          }
        }

        groups[dateKey] = {
          date: entryDate,
          entries: [],
          label
        };
      }

      groups[dateKey].entries.push(entry);
    });

    // Sort entries within each group by time (newest first)
    Object.values(groups).forEach(group => {
      group.entries.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return groups;
  }, [entries]);

  const sortedGroupKeys = useMemo(() => {
    return Object.keys(groupedEntries).sort((a, b) =>
      groupedEntries[b].date.getTime() - groupedEntries[a].date.getTime()
    );
  }, [groupedEntries]);

  const getDateStats = (entries: JournalEntryWithInsights[]) => {
    const totalWords = entries.reduce((sum, entry) =>
      sum + (entry.word_count || entry.content.split(' ').filter(word => word.length > 0).length), 0
    );
    const avgMood = entries.length > 0
      ? entries.reduce((sum, entry) => sum + (entry.mood_rating || 0), 0) / entries.length
      : 0;
    const insightsCount = entries.reduce((sum, entry) =>
      sum + (entry.ai_insights?.length || 0), 0
    );

    return { totalWords, avgMood, insightsCount };
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        {[1, 2, 3].map(i => (
          <View key={i} style={styles.loadingGroup}>
            <View style={styles.loadingDateHeader} />
            <View style={styles.loadingCard} />
          </View>
        ))}
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>📔</Text>
        <Text style={styles.emptyStateTitle}>Your Diary Awaits</Text>
        <Text style={styles.emptyStateDescription}>
          Start your journaling journey by writing your first entry. Capture your thoughts, feelings, and experiences.
        </Text>
        <AnimatedButton onPress={onNewEntry} style={styles.primaryButton} hapticFeedback="medium">
          <Text style={styles.primaryButtonText}>Write First Entry</Text>
        </AnimatedButton>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.diaryHeader}>
        <Text style={styles.diaryTitle}>Your Journey</Text>
        <AnimatedButton onPress={onNewEntry} style={styles.newEntryButton} hapticFeedback="medium">
          <Text style={styles.newEntryButtonText}>+ New Entry</Text>
        </AnimatedButton>
      </View>

      {sortedGroupKeys.map(dateKey => {
        const group = groupedEntries[dateKey];
        const stats = getDateStats(group.entries);

        return (
          <View key={dateKey} style={styles.dateGroup}>
            <View style={styles.dateHeader}>
              <View style={styles.dateHeaderLeft}>
                <Text style={styles.dateLabel}>{group.label}</Text>
                <Text style={styles.dateSubtext}>
                  {group.entries.length} entr{group.entries.length === 1 ? 'y' : 'ies'}
                </Text>
              </View>
              <View style={styles.dateStats}>
                {stats.totalWords > 0 && (
                  <Text style={styles.statText}>{stats.totalWords} words</Text>
                )}
                {stats.avgMood > 0 && (
                  <Text style={styles.statText}>
                    {stats.avgMood.toFixed(1)} avg mood
                  </Text>
                )}
                {stats.insightsCount > 0 && (
                  <Text style={styles.statText}>
                    {stats.insightsCount} insight{stats.insightsCount !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.entriesContainer}>
              {group.entries.map((entry, index) => (
                <DailyCard
                  key={entry.id}
                  entry={entry}
                  isExpanded={expandedCards.has(entry.id)}
                  onExpandToggle={toggleCardExpansion}
                  onPress={() => onEntryPress(entry)}
                  onEdit={onEditEntry}
                  onChatMessage={onChatMessage}
                />
              ))}
            </View>
          </View>
        );
      })}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  scrollContent: {
    padding: 16,
  },
  diaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  diaryTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray900,
    fontFamily: typography.heading.fontFamily,
  },
  newEntryButton: {
    backgroundColor: colors.primary,
    borderRadius: components.button.borderRadius,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  newEntryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  dateGroup: {
    marginBottom: 32,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  dateHeaderLeft: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray800,
    marginBottom: 2,
  },
  dateSubtext: {
    fontSize: 14,
    color: colors.gray600,
  },
  dateStats: {
    alignItems: 'flex-end',
  },
  statText: {
    fontSize: 12,
    color: colors.gray500,
    marginBottom: 2,
  },
  entriesContainer: {
    gap: 0,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 320,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: components.button.borderRadius,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 16,
  },
  loadingGroup: {
    marginBottom: 32,
  },
  loadingDateHeader: {
    height: 24,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    marginBottom: 16,
    width: '40%',
  },
  loadingCard: {
    height: 120,
    backgroundColor: colors.gray200,
    borderRadius: components.card.borderRadius,
    marginBottom: 16,
  },
  bottomSpacer: {
    height: 32,
  },
});