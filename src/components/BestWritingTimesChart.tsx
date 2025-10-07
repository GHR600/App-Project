import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { DatabaseJournalEntry } from '../config/supabase';
import { spacing } from '../styles/designSystem';

interface BestWritingTimesChartProps {
  entries: DatabaseJournalEntry[];
}

interface HourData {
  hour: number;
  count: number;
  label: string;
}

export const BestWritingTimesChart: React.FC<BestWritingTimesChartProps> = ({ entries }) => {
  const { theme } = useTheme();

  const { hourData, peakHours, insight } = useMemo(() => {
    if (entries.length === 0) {
      return { hourData: [], peakHours: [], insight: '' };
    }

    // Count entries by hour
    const hourCounts = new Array(24).fill(0);

    entries.forEach(entry => {
      const date = new Date(entry.created_at);
      const hour = date.getHours();
      hourCounts[hour]++;
    });

    // Create hour data
    const data: HourData[] = hourCounts.map((count, hour) => ({
      hour,
      count,
      label: formatHour(hour),
    }));

    // Find peak hours (top 3)
    const sortedByCount = [...data].sort((a, b) => b.count - a.count);
    const peaks = sortedByCount.slice(0, 3).filter(d => d.count > 0);

    // Generate insight
    let insightText = '';
    if (peaks.length > 0) {
      const topHour = peaks[0];
      const timeOfDay = getTimeOfDay(topHour.hour);
      insightText = `You write most often at ${topHour.label} (${timeOfDay})`;
    }

    return { hourData: data, peakHours: peaks, insight: insightText };
  }, [entries]);

  const maxCount = Math.max(...hourData.map(d => d.count), 1);

  const getBarWidth = (count: number) => {
    return (count / maxCount) * 100;
  };

  const isPeakHour = (hour: number) => {
    return peakHours.some(p => p.hour === hour);
  };

  if (hourData.length === 0 || hourData.every(d => d.count === 0)) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Best Writing Times
        </Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Not enough data to show writing times
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        Best Writing Times
      </Text>
      {insight && (
        <View style={[styles.insightBox, { backgroundColor: theme.primary + '15' }]}>
          <Text style={[styles.insightText, { color: theme.primary }]}>
            💡 {insight}
          </Text>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {hourData
          .filter(d => d.count > 0) // Only show hours with entries
          .map((data, index) => {
            const isPeak = isPeakHour(data.hour);
            const barWidth = getBarWidth(data.count);

            return (
              <View key={index} style={styles.barRow}>
                <Text style={[styles.hourLabel, { color: theme.textSecondary }]}>
                  {data.label}
                </Text>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${barWidth}%`,
                        backgroundColor: isPeak ? theme.primary : theme.primary + '60',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.countLabel,
                      {
                        color: isPeak ? theme.primary : theme.textSecondary,
                        fontWeight: isPeak ? '600' : '400',
                      },
                    ]}
                  >
                    {data.count} {data.count === 1 ? 'entry' : 'entries'}
                  </Text>
                </View>
              </View>
            );
          })}
      </ScrollView>

      {peakHours.length > 0 && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: theme.primary }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>
              Peak hours
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function getTimeOfDay(hour: number): string {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  insightBox: {
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  insightText: {
    fontSize: 13,
    fontWeight: '500',
  },
  scrollView: {
    maxHeight: 300,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  hourLabel: {
    fontSize: 11,
    width: 50,
    textAlign: 'right',
    marginRight: spacing.sm,
  },
  barContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    height: 20,
    borderRadius: 4,
    minWidth: 2,
  },
  countLabel: {
    fontSize: 10,
    marginLeft: spacing.xs,
  },
  legend: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
    flexDirection: 'row',
    justifyContent: 'center',
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
