import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { spacing } from '../styles/designSystem';
import { AnalyticsService, AdvancedAnalytics } from '../services/analyticsService';
import { CalendarHeatmap } from './CalendarHeatmap';
import { MonthSummaryCard } from './MonthSummaryCard';
import { AchievementsBanner } from './AchievementsBanner';
import { WordCountTrendsChart } from './WordCountTrendsChart';
import { BestWritingTimesChart } from './BestWritingTimesChart';
import { MoodLineChart } from './MoodLineChart';
import { MoodDistributionChart } from './MoodDistributionChart';
import { InsightsPanel } from './InsightsPanel';
import { supabase, DatabaseJournalEntry } from '../config/supabase';

interface AnalyticsDashboardProps {
  userId: string;
  dateRange?: { start: Date; end: Date };
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userId,
  dateRange
}) => {
  const { theme } = useTheme();
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [entries, setEntries] = useState<DatabaseJournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'mood' | 'patterns' | 'growth'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, [userId, dateRange]);

  const loadAnalytics = async () => {
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
      const { analytics: data, error } = await AnalyticsService.generateAdvancedAnalytics(
        userId,
        dateRange
      );

      if (error) {
        console.error('Error loading analytics:', error);
        Alert.alert('Error', 'Failed to load analytics');
      } else {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Unexpected error loading analytics:', error);
      Alert.alert('Error', 'Something went wrong loading analytics');
    } finally {
      setIsLoading(false);
    }
  };


  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Month Summary Card */}
      <MonthSummaryCard entries={entries} />

      {/* Calendar Heatmap */}
      <CalendarHeatmap entries={entries} />

      {/* Achievements Banner */}
      <AchievementsBanner
        totalEntries={entries.length}
        totalWords={analytics?.contentAnalysis.totalWords || 0}
        longestStreak={analytics?.streakAnalysis.longestStreak || 0}
        currentStreak={analytics?.streakAnalysis.currentStreak || 0}
      />

      {/* Insights Panel */}
      <InsightsPanel entries={entries} />

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statNumber, { color: theme.textPrimary }]}>{analytics?.contentAnalysis.totalWords || 0}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Words</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statNumber, { color: theme.textPrimary }]}>{analytics?.streakAnalysis.currentStreak || 0}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Current Streak</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statNumber, { color: theme.textPrimary }]}>
            {Math.round((analytics?.contentAnalysis.averageWordsPerEntry || 0))}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Avg Words/Entry</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statNumber, { color: theme.textPrimary }]}>
            {Math.round((analytics?.contentAnalysis.readingTime || 0))}m
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Reading Time</Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Writing Patterns</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Most productive day: {analytics?.contentAnalysis.mostProductiveDay || 'N/A'}
        </Text>
        {analytics?.writingPatterns.map((pattern, index) => (
          <View key={index} style={[styles.patternItem, { borderBottomColor: theme.surface }]}>
            <Text style={[styles.patternDay, { color: theme.textPrimary }]}>{pattern.dayOfWeek}</Text>
            <Text style={[styles.patternStats, { color: theme.textSecondary }]}>
              {pattern.entryCount} entries • {Math.round(pattern.averageWordCount)} words avg
            </Text>
            <Text style={[styles.patternTime, { color: theme.primary }]}>{pattern.preferredTime}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderMoodTab = () => (
    <View style={styles.tabContent}>
      {/* Mood Line Chart */}
      <MoodLineChart entries={entries} />

      {/* Mood Distribution Chart */}
      <MoodDistributionChart entries={entries} />

      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Emotional Insights</Text>
        {analytics?.emotionalInsights.slice(0, 5).map((insight, index) => (
          <View key={index} style={styles.emotionItem}>
            <Text style={[styles.emotionName, { color: theme.textPrimary }]}>{insight.emotion}</Text>
            <Text style={[styles.emotionFreq, { color: theme.textSecondary }]}>
              {insight.frequency} mentions • {insight.trend}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPatternsTab = () => (
    <View style={styles.tabContent}>
      {/* Word Count Trends Chart */}
      <WordCountTrendsChart entries={entries} period="week" />

      {/* Best Writing Times Chart */}
      <BestWritingTimesChart entries={entries} />

      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Streak Analysis</Text>
        <View style={[styles.streakCard, { backgroundColor: theme.backgroundSecondary }]}>
          <Text style={[styles.streakTitle, { color: theme.textSecondary }]}>Current Streak</Text>
          <Text style={[styles.streakNumber, { color: theme.primary }]}>
            {analytics?.streakAnalysis.currentStreak || 0} days
          </Text>
          <Text style={[styles.streakSubtext, { color: theme.textMuted }]}>
            Longest: {analytics?.streakAnalysis.longestStreak || 0} days
          </Text>
        </View>
        <View style={styles.consistencyCard}>
          <Text style={[styles.consistencyLabel, { color: theme.textPrimary }]}>Consistency Score</Text>
          <View style={[styles.consistencyBar, { backgroundColor: theme.backgroundSecondary }]}>
            <View
              style={[
                styles.consistencyProgress,
                {
                  width: `${(analytics?.streakAnalysis.consistency || 0) * 100}%`,
                  backgroundColor: theme.success
                }
              ]}
            />
          </View>
          <Text style={[styles.consistencyValue, { color: theme.textPrimary }]}>
            {Math.round((analytics?.streakAnalysis.consistency || 0) * 100)}%
          </Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Top Words</Text>
        <View style={styles.wordCloud}>
          {analytics?.wordCloud.slice(0, 15).map((word, index) => (
            <View
              key={index}
              style={[
                styles.wordBubble,
                {
                  backgroundColor: word.sentiment === 'positive'
                    ? theme.success + '20'
                    : word.sentiment === 'negative'
                    ? theme.error + '20'
                    : theme.surface
                }
              ]}
            >
              <Text style={[styles.wordText, { color: theme.textPrimary }]}>{word.word}</Text>
              <Text style={[styles.wordFreq, { color: theme.textSecondary }]}>{word.frequency}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderGrowthTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Growth Metrics</Text>
        <View style={styles.growthMetrics}>
          <View style={styles.growthItem}>
            <Text style={[styles.growthLabel, { color: theme.textPrimary }]}>Reflection Depth</Text>
            <View style={[styles.growthBar, { backgroundColor: theme.backgroundSecondary }]}>
              <View
                style={[
                  styles.growthProgress,
                  {
                    width: `${(analytics?.growthMetrics.reflectionDepth || 0) * 100}%`,
                    backgroundColor: theme.success
                  }
                ]}
              />
            </View>
            <Text style={[styles.growthValue, { color: theme.textPrimary }]}>
              {Math.round((analytics?.growthMetrics.reflectionDepth || 0) * 100)}%
            </Text>
          </View>

          <View style={styles.growthItem}>
            <Text style={[styles.growthLabel, { color: theme.textPrimary }]}>Self-Awareness Growth</Text>
            <Text style={[styles.growthTrend, { color: theme.success }]}>
              +{Math.round((analytics?.growthMetrics.selfAwarenessGrowth || 0) * 100)}%
            </Text>
          </View>

          <View style={styles.growthItem}>
            <Text style={[styles.growthLabel, { color: theme.textPrimary }]}>Problem-Solving Progress</Text>
            <Text style={[styles.growthTrend, { color: theme.success }]}>
              +{Math.round((analytics?.growthMetrics.problemSolvingProgress || 0) * 100)}%
            </Text>
          </View>

          <View style={styles.growthItem}>
            <Text style={[styles.growthLabel, { color: theme.textPrimary }]}>Emotional Regulation</Text>
            <Text style={[styles.growthTrend, { color: theme.success }]}>
              +{Math.round((analytics?.growthMetrics.emotionalRegulation || 0) * 100)}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Generating insights...</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>Unable to load analytics</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={loadAnalytics}>
          <Text style={[styles.retryButtonText, { color: theme.textInverse }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Analytics Dashboard</Text>
      </View>

      <View style={[styles.tabBar, { backgroundColor: theme.surface, borderBottomColor: theme.cardBorder }]}>
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'mood', label: 'Mood' },
          { key: 'patterns', label: 'Patterns' },
          { key: 'growth', label: 'Growth' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && { borderBottomColor: theme.primary }
            ]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Text style={[
              styles.tabText,
              { color: selectedTab === tab.key ? theme.primary : theme.textSecondary }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'mood' && renderMoodTab()}
        {selectedTab === 'patterns' && renderPatternsTab()}
        {selectedTab === 'growth' && renderGrowthTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    width: (Dimensions.get('window').width - 56) / 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
  patternItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
  },
  patternDay: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  patternStats: {
    fontSize: 12,
    flex: 2,
  },
  patternTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  moodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  moodDate: {
    fontSize: 12,
    width: 80,
  },
  moodBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  moodProgress: {
    height: '100%',
  },
  moodValue: {
    fontSize: 12,
    fontWeight: '500',
    width: 40,
    textAlign: 'right',
  },
  emotionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  emotionName: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emotionFreq: {
    fontSize: 12,
  },
  streakCard: {
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  streakTitle: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  streakSubtext: {
    fontSize: 12,
  },
  consistencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  consistencyLabel: {
    fontSize: 14,
    width: 100,
  },
  consistencyBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  consistencyProgress: {
    height: '100%',
  },
  consistencyValue: {
    fontSize: 14,
    fontWeight: '500',
    width: 40,
    textAlign: 'right',
  },
  wordCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  wordBubble: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  wordText: {
    fontSize: 12,
    fontWeight: '500',
  },
  wordFreq: {
    fontSize: 10,
  },
  growthMetrics: {
    gap: spacing.md,
  },
  growthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  growthLabel: {
    fontSize: 14,
    flex: 1,
  },
  growthBar: {
    width: 100,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  growthProgress: {
    height: '100%',
  },
  growthValue: {
    fontSize: 14,
    fontWeight: '500',
    width: 40,
    textAlign: 'right',
  },
  growthTrend: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
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
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: spacing.lg,
  },
});