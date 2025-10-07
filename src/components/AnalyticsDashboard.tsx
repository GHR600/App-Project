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
import { colors } from '../styles/designSystem';
import { AnalyticsService, AdvancedAnalytics, ExportOptions } from '../services/analyticsService';
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

  const handleExport = async (format: 'json' | 'csv' | 'txt') => {
    try {
      const options: ExportOptions = {
        format,
        dateRange: dateRange || {
          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        includeInsights: true,
        includeAnalytics: true,
        includeImages: false,
      };

      const { data, filename, error } = await AnalyticsService.exportData(userId, options);

      if (error) {
        Alert.alert('Export Error', 'Failed to export data');
      } else {
        // In a real app, you'd use a file sharing library to save/share the file
        Alert.alert('Export Complete', `Data exported as ${filename}`);
        console.log('Exported data:', data.substring(0, 200) + '...');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
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
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{analytics?.contentAnalysis.totalWords || 0}</Text>
          <Text style={styles.statLabel}>Total Words</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{analytics?.streakAnalysis.currentStreak || 0}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {Math.round((analytics?.contentAnalysis.averageWordsPerEntry || 0))}
          </Text>
          <Text style={styles.statLabel}>Avg Words/Entry</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {Math.round((analytics?.contentAnalysis.readingTime || 0))}m
          </Text>
          <Text style={styles.statLabel}>Reading Time</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Writing Patterns</Text>
        <Text style={styles.sectionSubtitle}>
          Most productive day: {analytics?.contentAnalysis.mostProductiveDay || 'N/A'}
        </Text>
        {analytics?.writingPatterns.map((pattern, index) => (
          <View key={index} style={styles.patternItem}>
            <Text style={styles.patternDay}>{pattern.dayOfWeek}</Text>
            <Text style={styles.patternStats}>
              {pattern.entryCount} entries • {Math.round(pattern.averageWordCount)} words avg
            </Text>
            <Text style={styles.patternTime}>{pattern.preferredTime}</Text>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emotional Insights</Text>
        {analytics?.emotionalInsights.slice(0, 5).map((insight, index) => (
          <View key={index} style={styles.emotionItem}>
            <Text style={styles.emotionName}>{insight.emotion}</Text>
            <Text style={styles.emotionFreq}>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Streak Analysis</Text>
        <View style={styles.streakCard}>
          <Text style={styles.streakTitle}>Current Streak</Text>
          <Text style={styles.streakNumber}>
            {analytics?.streakAnalysis.currentStreak || 0} days
          </Text>
          <Text style={styles.streakSubtext}>
            Longest: {analytics?.streakAnalysis.longestStreak || 0} days
          </Text>
        </View>
        <View style={styles.consistencyCard}>
          <Text style={styles.consistencyLabel}>Consistency Score</Text>
          <View style={styles.consistencyBar}>
            <View
              style={[
                styles.consistencyProgress,
                { width: `${(analytics?.streakAnalysis.consistency || 0) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.consistencyValue}>
            {Math.round((analytics?.streakAnalysis.consistency || 0) * 100)}%
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Words</Text>
        <View style={styles.wordCloud}>
          {analytics?.wordCloud.slice(0, 15).map((word, index) => (
            <View
              key={index}
              style={[
                styles.wordBubble,
                {
                  backgroundColor: word.sentiment === 'positive'
                    ? colors.green600 + '20'
                    : word.sentiment === 'negative'
                    ? colors.red600 + '20'
                    : colors.gray200
                }
              ]}
            >
              <Text style={styles.wordText}>{word.word}</Text>
              <Text style={styles.wordFreq}>{word.frequency}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderGrowthTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Growth Metrics</Text>
        <View style={styles.growthMetrics}>
          <View style={styles.growthItem}>
            <Text style={styles.growthLabel}>Reflection Depth</Text>
            <View style={styles.growthBar}>
              <View
                style={[
                  styles.growthProgress,
                  { width: `${(analytics?.growthMetrics.reflectionDepth || 0) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.growthValue}>
              {Math.round((analytics?.growthMetrics.reflectionDepth || 0) * 100)}%
            </Text>
          </View>

          <View style={styles.growthItem}>
            <Text style={styles.growthLabel}>Self-Awareness Growth</Text>
            <Text style={styles.growthTrend}>
              +{Math.round((analytics?.growthMetrics.selfAwarenessGrowth || 0) * 100)}%
            </Text>
          </View>

          <View style={styles.growthItem}>
            <Text style={styles.growthLabel}>Problem-Solving Progress</Text>
            <Text style={styles.growthTrend}>
              +{Math.round((analytics?.growthMetrics.problemSolvingProgress || 0) * 100)}%
            </Text>
          </View>

          <View style={styles.growthItem}>
            <Text style={styles.growthLabel}>Emotional Regulation</Text>
            <Text style={styles.growthTrend}>
              +{Math.round((analytics?.growthMetrics.emotionalRegulation || 0) * 100)}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Generating insights...</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load analytics</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAnalytics}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <View style={styles.exportButtons}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => handleExport('csv')}
          >
            <Text style={styles.exportButtonText}>CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => handleExport('json')}
          >
            <Text style={styles.exportButtonText}>JSON</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabBar}>
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
              selectedTab === tab.key && styles.activeTab
            ]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Text style={[
              styles.tabText,
              selectedTab === tab.key && styles.activeTabText
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
    backgroundColor: colors.gray100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray900,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  exportButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.gray600,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (Dimensions.get('window').width - 56) / 2,
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
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 16,
  },
  patternItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  patternDay: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray800,
    flex: 1,
  },
  patternStats: {
    fontSize: 12,
    color: colors.gray600,
    flex: 2,
  },
  patternTime: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  moodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  moodDate: {
    fontSize: 12,
    color: colors.gray600,
    width: 80,
  },
  moodBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  moodProgress: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  moodValue: {
    fontSize: 12,
    color: colors.gray700,
    fontWeight: '500',
    width: 40,
    textAlign: 'right',
  },
  emotionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  emotionName: {
    fontSize: 14,
    color: colors.gray800,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emotionFreq: {
    fontSize: 12,
    color: colors.gray600,
  },
  streakCard: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  streakTitle: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  streakSubtext: {
    fontSize: 12,
    color: colors.gray500,
  },
  consistencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  consistencyLabel: {
    fontSize: 14,
    color: colors.gray700,
    width: 100,
  },
  consistencyBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  consistencyProgress: {
    height: '100%',
    backgroundColor: colors.success,
  },
  consistencyValue: {
    fontSize: 14,
    color: colors.gray700,
    fontWeight: '500',
    width: 40,
    textAlign: 'right',
  },
  wordCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordBubble: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  wordText: {
    fontSize: 12,
    color: colors.gray700,
    fontWeight: '500',
  },
  wordFreq: {
    fontSize: 10,
    color: colors.gray500,
  },
  growthMetrics: {
    gap: 16,
  },
  growthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  growthLabel: {
    fontSize: 14,
    color: colors.gray700,
    flex: 1,
  },
  growthBar: {
    width: 100,
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  growthProgress: {
    height: '100%',
    backgroundColor: colors.success,
  },
  growthValue: {
    fontSize: 14,
    color: colors.gray700,
    fontWeight: '500',
    width: 40,
    textAlign: 'right',
  },
  growthTrend: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray100,
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray600,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.gray600,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    fontSize: 14,
    color: colors.gray500,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});