import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { DatabaseJournalEntry } from '../config/supabase';
import { spacing } from '../styles/designSystem';

interface WordCountTrendsChartProps {
  entries: DatabaseJournalEntry[];
  period?: 'week' | 'month';
}

interface TrendData {
  label: string;
  avgWords: number;
  entryCount: number;
}

export const WordCountTrendsChart: React.FC<WordCountTrendsChartProps> = ({
  entries,
  period = 'week',
}) => {
  const { theme } = useTheme();

  const { trendData, overallAverage } = useMemo(() => {
    if (entries.length === 0) {
      return { trendData: [], overallAverage: 0 };
    }

    // Calculate overall average
    const totalWords = entries.reduce((sum, e) => sum + e.word_count, 0);
    const avg = totalWords / entries.length;

    // Group by period
    const grouped = new Map<string, DatabaseJournalEntry[]>();

    entries.forEach(entry => {
      const date = new Date(entry.created_at);
      let key: string;

      if (period === 'week') {
        // Get week number and year
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        // Get month and year
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(entry);
    });

    // Convert to trend data
    const trends: TrendData[] = Array.from(grouped.entries())
      .map(([key, groupEntries]) => {
        const totalWords = groupEntries.reduce((sum, e) => sum + e.word_count, 0);
        const avgWords = totalWords / groupEntries.length;

        let label: string;
        if (period === 'week') {
          const date = new Date(key);
          label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          const [year, month] = key.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          label = date.toLocaleDateString('en-US', { month: 'short' });
        }

        return {
          label,
          avgWords,
          entryCount: groupEntries.length,
        };
      })
      .sort((a, b) => {
        // Sort chronologically
        return 0; // Already sorted by key
      })
      .slice(-12); // Last 12 periods

    return { trendData: trends, overallAverage: avg };
  }, [entries, period]);

  const maxValue = Math.max(
    ...trendData.map(d => d.avgWords),
    overallAverage
  );

  const getBarHeight = (value: number) => {
    return (value / maxValue) * 120;
  };

  if (trendData.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Word Count Trends
        </Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Not enough data to show trends
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        Word Count Trends
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Average words per entry {period === 'week' ? 'by week' : 'by month'}
      </Text>

      <View style={styles.chartContainer}>
        {/* Average line */}
        <View
          style={[
            styles.averageLine,
            {
              bottom: getBarHeight(overallAverage),
              backgroundColor: theme.textSecondary + '40',
            },
          ]}
        >
          <Text style={[styles.averageLabel, { color: theme.textSecondary }]}>
            Avg: {Math.round(overallAverage)}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {trendData.map((data, index) => (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: getBarHeight(data.avgWords),
                      backgroundColor:
                        data.avgWords > overallAverage
                          ? theme.primary
                          : theme.primary + '60',
                    },
                  ]}
                >
                  <Text style={[styles.barValue, { color: theme.background }]}>
                    {Math.round(data.avgWords)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.barLabel, { color: theme.textSecondary }]}>
                {data.label}
              </Text>
              <Text style={[styles.barSubLabel, { color: theme.textSecondary }]}>
                {data.entryCount} {data.entryCount === 1 ? 'entry' : 'entries'}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.primary }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            Above average
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.primary + '60' }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            Below average
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  chartContainer: {
    position: 'relative',
    height: 160,
    marginBottom: spacing.md,
  },
  averageLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  averageLabel: {
    fontSize: 10,
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingTop: 20,
    gap: 8,
    alignItems: 'flex-end',
  },
  barContainer: {
    alignItems: 'center',
    width: 60,
  },
  barWrapper: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  bar: {
    width: 40,
    borderRadius: 4,
    minHeight: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
  },
  barLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  barSubLabel: {
    fontSize: 8,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
  },
});
