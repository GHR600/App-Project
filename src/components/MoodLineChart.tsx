import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { DatabaseJournalEntry } from '../config/supabase';
import { spacing } from '../styles/designSystem';

interface MoodLineChartProps {
  entries: DatabaseJournalEntry[];
}

type TimePeriod = '7d' | '30d' | '90d' | 'all';

interface MoodDataPoint {
  date: Date;
  mood: number;
  label: string;
  entryCount: number;
}

export const MoodLineChart: React.FC<MoodLineChartProps> = ({ entries }) => {
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d');

  const { moodData, averageMood } = useMemo(() => {
    const entriesWithMood = entries.filter(e => e.mood_rating && e.mood_rating > 0);

    if (entriesWithMood.length === 0) {
      return { moodData: [], averageMood: 0 };
    }

    // Calculate cutoff date
    const now = new Date();
    let cutoffDate: Date;
    switch (selectedPeriod) {
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        cutoffDate = new Date(0);
        break;
    }

    // Filter entries by period
    const filteredEntries = entriesWithMood.filter(
      e => new Date(e.created_at) >= cutoffDate
    );

    // Group by date
    const grouped = new Map<string, DatabaseJournalEntry[]>();
    filteredEntries.forEach(entry => {
      const dateStr = new Date(entry.created_at).toISOString().split('T')[0];
      if (!grouped.has(dateStr)) {
        grouped.set(dateStr, []);
      }
      grouped.get(dateStr)!.push(entry);
    });

    // Create data points
    const points: MoodDataPoint[] = Array.from(grouped.entries())
      .map(([dateStr, dayEntries]) => {
        const avgMood =
          dayEntries.reduce((sum, e) => sum + (e.mood_rating || 0), 0) / dayEntries.length;
        const date = new Date(dateStr);

        return {
          date,
          mood: avgMood,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          entryCount: dayEntries.length,
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate average
    const avg = points.reduce((sum, p) => sum + p.mood, 0) / points.length;

    return { moodData: points, averageMood: avg };
  }, [entries, selectedPeriod]);

  const getYPosition = (mood: number) => {
    // Map mood (1-5) to Y position (0-100)
    return 100 - ((mood - 1) / 4) * 100;
  };

  const periods: { key: TimePeriod; label: string }[] = [
    { key: '7d', label: '7d' },
    { key: '30d', label: '30d' },
    { key: '90d', label: '90d' },
    { key: 'all', label: 'All' },
  ];

  if (moodData.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Mood Trends
        </Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No mood data available for this period
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Mood Trends
        </Text>
        <View style={styles.periodSelector}>
          {periods.map(period => (
            <TouchableOpacity
              key={period.key}
              onPress={() => setSelectedPeriod(period.key)}
              style={[
                styles.periodButton,
                {
                  backgroundColor:
                    selectedPeriod === period.key ? theme.primary : theme.surface,
                  borderColor: theme.primary + '40',
                },
              ]}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  {
                    color:
                      selectedPeriod === period.key ? theme.background : theme.textSecondary,
                  },
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Average Mood
          </Text>
          <Text style={[styles.statValue, { color: theme.primary }]}>
            {averageMood.toFixed(1)}/5
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Data Points
          </Text>
          <Text style={[styles.statValue, { color: theme.primary }]}>
            {moodData.length}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.chartContainer}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            {[5, 4, 3, 2, 1].map(value => (
              <Text key={value} style={[styles.yAxisLabel, { color: theme.textSecondary }]}>
                {value}
              </Text>
            ))}
          </View>

          {/* Chart area */}
          <View style={styles.chartArea}>
            {/* Average line */}
            <View
              style={[
                styles.averageLine,
                {
                  top: `${getYPosition(averageMood)}%`,
                  borderColor: theme.textSecondary + '60',
                },
              ]}
            />

            {/* Grid lines */}
            {[1, 2, 3, 4, 5].map(value => (
              <View
                key={value}
                style={[
                  styles.gridLine,
                  {
                    top: `${getYPosition(value)}%`,
                    borderColor: theme.surface,
                  },
                ]}
              />
            ))}

            {/* Data points and lines */}
            <View style={styles.dataContainer}>
              {moodData.map((point, index) => {
                const x = (index / (moodData.length - 1 || 1)) * 100;
                const y = getYPosition(point.mood);

                return (
                  <View
                    key={index}
                    style={[
                      styles.dataPoint,
                      {
                        left: `${x}%`,
                        top: `${y}%`,
                        backgroundColor: theme.primary,
                      },
                    ]}
                  />
                );
              })}

              {/* Note: Connecting lines would require react-native-svg library */}
            </View>
          </View>
        </View>

        {/* X-axis labels */}
        <View style={styles.xAxis}>
          {moodData
            .filter((_, index) => index % Math.ceil(moodData.length / 8) === 0)
            .map((point, index) => (
              <Text key={index} style={[styles.xAxisLabel, { color: theme.textSecondary }]}>
                {point.label}
              </Text>
            ))}
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: theme.textSecondary }]}>
          Higher values = better mood
        </Text>
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
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  periodButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  scrollContent: {
    minWidth: '100%',
  },
  chartContainer: {
    flexDirection: 'row',
    height: 120,
    marginBottom: spacing.sm,
  },
  yAxis: {
    width: 30,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  yAxisLabel: {
    fontSize: 10,
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    marginLeft: spacing.xs,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dotted',
  },
  averageLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    zIndex: 1,
  },
  dataContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -4,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 35,
  },
  xAxisLabel: {
    fontSize: 9,
  },
  legend: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  legendText: {
    fontSize: 10,
  },
});
