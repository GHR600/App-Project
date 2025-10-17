import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
  TextInput
} from 'react-native';
import { AnimatedButton } from '../components/AnimatedButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  MenuIcon,
  SearchIcon,
  CloseIcon,
  FlameIcon,
  TrophyIcon,
  CrownIcon,
  FileTextIcon,
  getMoodEmoji,
} from '../components/icons/AppIcons';
import { useTheme } from '../contexts/ThemeContext';
import { typography, spacing, borderRadius } from '../styles/designSystem';
import { BottomNavigation } from '../components/BottomNavigation';
import { JournalService, JournalEntryWithInsights } from '../services/journalService';
import { JournalEntry } from '../types';

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

  const getStreakIcon = (streak: number): { type: 'fileText' | 'flame' | 'trophy' | 'crown'; size: number } => {
    if (streak === 0) return { type: 'fileText', size: 32 };
    if (streak < 30) return { type: 'flame', size: streak < 3 ? 28 : streak < 7 ? 32 : streak < 14 ? 36 : 40 };
    if (streak < 100) return { type: 'trophy', size: 32 };
    return { type: 'crown', size: 32 };
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

  const streakIcon = getStreakIcon(stats.currentStreak);

  return (
    <View style={styles.statsContainer}>
      {/* Streak Banner */}
      <View style={[styles.streakBanner, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
        <View style={styles.streakIconContainer}>
          {streakIcon.type === 'flame' && (
            <FlameIcon size={streakIcon.size} color={theme.primary} fill={theme.primary} />
          )}
          {streakIcon.type === 'trophy' && (
            <TrophyIcon size={streakIcon.size} color={theme.primary} strokeWidth={2} />
          )}
          {streakIcon.type === 'crown' && (
            <CrownIcon size={streakIcon.size} color={theme.primary} strokeWidth={2} />
          )}
          {streakIcon.type === 'fileText' && (
            <FileTextIcon size={streakIcon.size} color={theme.primary} strokeWidth={2} />
          )}
        </View>
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
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalEntries: 0,
    currentStreak: 0,
    averageMood: 0,
    totalWords: 0,
    entriesThisMonth: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ENTRIES_PER_PAGE = 20;

  const loadData = useCallback(async () => {
    try {
      // Load user stats
      const { stats: userStats, error: statsError } = await JournalService.getUserStats(userId);
      if (statsError) {
        console.error('Error loading stats:', statsError);
      } else {
        setStats(userStats);
      }

      // Load all entries (sorted by created_at, most recent first)
      const { entries: userEntries, error: entriesError } = await JournalService.getUserEntries(userId, {
        limit: 100, // Load more entries
        offset: 0,
        orderBy: 'created_at',
        ascending: false
      });

      if (entriesError) {
        console.error('Error loading entries:', entriesError);
        Alert.alert('Error', 'Failed to load your journal entries. Please try again.');
      } else {
        setEntries(userEntries);
        setFilteredEntries(userEntries);
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

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Combined filter effect (search + tag filter)
  useEffect(() => {
    let filtered = entries;

    // Apply tag filter
    if (selectedTagFilter) {
      filtered = filtered.filter(entry =>
        entry.tags?.includes(selectedTagFilter)
      );
    }

    // Apply search filter
    if (debouncedSearchQuery.trim() !== '') {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(entry => {
        const contentMatch = entry.content.toLowerCase().includes(query);
        const titleMatch = entry.title?.toLowerCase().includes(query);
        const tagsMatch = entry.tags?.some(tag => tag.toLowerCase().includes(query));
        return contentMatch || titleMatch || tagsMatch;
      });
    }

    setFilteredEntries(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [debouncedSearchQuery, selectedTagFilter, entries]);

  const handleTagClick = (tag: string) => {
    if (selectedTagFilter === tag) {
      setSelectedTagFilter(null); // Deselect if clicking same tag
    } else {
      setSelectedTagFilter(tag);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedTagFilter(null);
  };

  const hasActiveFilters = debouncedSearchQuery.trim() !== '' || selectedTagFilter !== null;

  const handleEntryPress = (entry: JournalEntry) => {
    navigation.navigate('JournalEntry', {
      mode: 'edit',
      entryId: entry.id,
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
    setCurrentPage(prev => prev + 1);
  };

  // Mood emojis are imported from AppIcons
  // const getMoodEmoji is now imported from AppIcons

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const getTagColor = (tag: string): string => {
    const colors: { [key: string]: string } = {
      'journal': '#8B5CF6',
      'note': '#10B981',
      'thought': '#3B82F6',
      'idea': '#F59E0B',
      'goal': '#EF4444',
      'gratitude': '#EC4899'
    };
    return colors[tag.toLowerCase()] || '#6B7280';
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderEntries = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.entryCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.loadingText, { backgroundColor: theme.backgroundTertiary, width: '40%' }]} />
              <View style={[styles.loadingText, { backgroundColor: theme.backgroundTertiary, marginTop: 8 }]} />
              <View style={[styles.loadingText, { width: '60%', marginTop: 8, backgroundColor: theme.backgroundTertiary }]} />
            </View>
          ))}
        </View>
      );
    }

    if (filteredEntries.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIconContainer}>
            {searchQuery ? (
              <SearchIcon size={48} color={theme.textMuted} strokeWidth={1.5} />
            ) : (
              <FileTextIcon size={48} color={theme.textMuted} strokeWidth={1.5} />
            )}
          </View>
          <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
            {searchQuery ? 'No Results Found' : 'Start Your Journey'}
          </Text>
          <Text style={[styles.emptyStateDescription, { color: theme.textSecondary }]}>
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'Write your first journal entry to begin tracking your thoughts and growth.'}
          </Text>
          {!searchQuery && (
            <AnimatedButton style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={handleNewEntry} hapticFeedback="medium">
              <Text style={[styles.primaryButtonText, { color: theme.white }]}>Create First Entry</Text>
            </AnimatedButton>
          )}
        </View>
      );
    }

    const displayedEntries = filteredEntries.slice(0, currentPage * ENTRIES_PER_PAGE);
    const hasMore = filteredEntries.length > displayedEntries.length;

    return (
      <>
        {displayedEntries.map((entry) => (
          <AnimatedButton
            key={entry.id}
            style={[styles.entryCard, { backgroundColor: theme.surface }]}
            onPress={() => handleEntryPress(entry)}
            hapticFeedback="light"
          >
            {/* Header: Timestamp and Mood */}
            <View style={styles.entryHeader}>
              <Text style={[styles.entryTimestamp, { color: theme.textSecondary }]}>
                {formatTimestamp(entry.created_at)}
              </Text>
              {entry.mood_rating && (
                <Text style={styles.entryMood}>{getMoodEmoji(entry.mood_rating)}</Text>
              )}
            </View>

            {/* Title (if exists) */}
            {entry.title && (
              <Text style={[styles.entryTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                {entry.title}
              </Text>
            )}

            {/* Content Preview */}
            <Text style={[styles.entryContent, { color: theme.textSecondary }]} numberOfLines={3}>
              {entry.content}
            </Text>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <View style={styles.entryTags}>
                {entry.tags.map((tag, index) => (
                  <AnimatedButton
                    key={index}
                    style={[
                      styles.tagChip,
                      {
                        backgroundColor: getTagColor(tag) + (selectedTagFilter === tag ? '40' : '20'),
                        borderWidth: selectedTagFilter === tag ? 2 : 0,
                        borderColor: getTagColor(tag)
                      }
                    ]}
                    onPress={(e) => {
                      e.stopPropagation(); // Prevent entry card from being clicked
                      handleTagClick(tag);
                    }}
                    hapticFeedback="light"
                  >
                    <Text style={[styles.tagText, { color: getTagColor(tag) }]}>
                      {tag}
                    </Text>
                  </AnimatedButton>
                ))}
              </View>
            )}
          </AnimatedButton>
        ))}

        {hasMore && (
          <AnimatedButton style={[styles.showMoreButton, { borderColor: theme.primary }]} onPress={handleShowMore} hapticFeedback="light">
            <Text style={[styles.showMoreText, { color: theme.primary }]}>Show More</Text>
          </AnimatedButton>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <View style={styles.content}>
        {/* Top Bar with Menu and Search */}
        <View style={styles.topBar}>
          <AnimatedButton
            style={styles.menuButton}
            onPress={onMenuPress}
            hapticFeedback="light"
          >
            <MenuIcon size={24} color={theme.primary} strokeWidth={2.5} />
          </AnimatedButton>

          <View style={[styles.searchBar, { backgroundColor: theme.surface }]}>
            <View style={styles.searchIconContainer}>
              <SearchIcon size={18} color={theme.textSecondary} strokeWidth={2} />
            </View>
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search all entries..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <AnimatedButton onPress={() => setSearchQuery('')} style={styles.clearButton} hapticFeedback="light">
                <CloseIcon size={18} color={theme.textSecondary} strokeWidth={2} />
              </AnimatedButton>
            )}
          </View>
        </View>

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <View style={[styles.filtersContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.filtersBar}>
              {selectedTagFilter && (
                <View style={[styles.activeFilterChip, { backgroundColor: getTagColor(selectedTagFilter) + '30' }]}>
                  <Text style={[styles.activeFilterText, { color: getTagColor(selectedTagFilter) }]}>
                    {selectedTagFilter}
                  </Text>
                  <AnimatedButton onPress={() => setSelectedTagFilter(null)} style={styles.removeFilterButton} hapticFeedback="light">
                    <CloseIcon size={14} color={getTagColor(selectedTagFilter)} strokeWidth={2.5} />
                  </AnimatedButton>
                </View>
              )}
              <AnimatedButton onPress={handleClearFilters} style={[styles.clearFiltersButton, { backgroundColor: theme.error + '15' }]} hapticFeedback="medium">
                <Text style={[styles.clearFiltersText, { color: theme.error }]}>Clear all filters</Text>
              </AnimatedButton>
            </View>
          </View>
        )}

        <ScrollView
          style={styles.entriesContainer}
          contentContainerStyle={styles.entriesContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          bounces={true}
          alwaysBounceVertical={true}
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          scrollEventThrottle={16}
        >
          <StatsHeader stats={stats} isLoading={isLoading} />
          {renderEntries()}
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

  // Top Bar with Menu and Search
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
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
  streakIconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
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

  // Search Bar
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchIconContainer: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing.xs,
  },
  clearButton: {
    padding: spacing.xs,
  },

  // Filters Container
  filtersContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  filtersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeFilterButton: {
    marginLeft: 2,
    padding: 2,
  },
  clearFiltersButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Entry Cards
  entryCard: {
    borderRadius: 0,
    padding: spacing.md,
    marginBottom: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  entryTimestamp: {
    fontSize: 12,
    fontWeight: '500',
  },
  entryMood: {
    fontSize: 20,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  entryContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  entryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tagChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Entries Section
  entriesContainer: {
    flex: 1,
  },
  entriesContent: {
    paddingTop: 0,
    paddingBottom: 80,
  },

  // Show More Button
  showMoreButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
  },
  showMoreText: {
    ...typography.body,
    fontWeight: '600',
  },

  // Empty State & Loading
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.md,
  },
  emptyStateIconContainer: {
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
    gap: 1,
  },
  loadingText: {
    height: 16,
    borderRadius: 4,
  },
});