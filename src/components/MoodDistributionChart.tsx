import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { DatabaseJournalEntry } from '../config/supabase';
import { spacing } from '../styles/designSystem';

interface MoodDistributionChartProps {
  entries: DatabaseJournalEntry[];
}

interface MoodDistribution {
  rating: number;
  count: number;
  percentage: number;
  emoji: string;
  label: string;
  color: string;
}

export const MoodDistributionChart: React.FC<MoodDistributionChartProps> = ({ entries }) => {
  const { theme } = useTheme();

  const { distribution, dominantMood } = useMemo(() => {
    const entriesWithMood = entries.filter(e => e.mood_rating && e.mood_rating > 0);

    if (entriesWithMood.length === 0) {
      return { distribution: [], dominantMood: null };
    }

    // Count each mood rating
    const counts = [0, 0, 0, 0, 0]; // indices 0-4 for ratings 1-5
    entriesWithMood.forEach(entry => {
      const rating = entry.mood_rating!;
      if (rating >= 1 && rating <= 5) {
        counts[rating - 1]++;
      }
    });

    const total = entriesWithMood.length;

    // Create distribution data
    const dist: MoodDistribution[] = [
      {
        rating: 1,
        count: counts[0],
        percentage: (counts[0] / total) * 100,
        emoji: '😢',
        label: 'Very Bad',
        color: '#ef4444',
      },
      {
        rating: 2,
        count: counts[1],
        percentage: (counts[1] / total) * 100,
        emoji: '😕',
        label: 'Bad',
        color: '#f59e0b',
      },
      {
        rating: 3,
        count: counts[2],
        percentage: (counts[2] / total) * 100,
        emoji: '😐',
        label: 'Okay',
        color: '#fbbf24',
      },
      {
        rating: 4,
        count: counts[3],
        percentage: (counts[3] / total) * 100,
        emoji: '😊',
        label: 'Good',
        color: '#84cc16',
      },
      {
        rating: 5,
        count: counts[4],
        percentage: (counts[4] / total) * 100,
        emoji: '😄',
        label: 'Great',
        color: '#10b981',
      },
    ].filter(d => d.count > 0); // Only include moods that were logged

    // Find dominant mood
    const maxCount = Math.max(...counts);
    const dominantIndex = counts.indexOf(maxCount);
    const dominant = maxCount > 0 ? dist.find(d => d.rating === dominantIndex + 1) : null;

    return { distribution: dist, dominantMood: dominant };
  }, [entries]);

  if (distribution.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Mood Distribution
        </Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No mood data available
        </Text>
      </View>
    );
  }

  // Calculate donut segments
  let currentAngle = -90; // Start from top
  const segments = distribution.map(mood => {
    const angle = (mood.percentage / 100) * 360;
    const segment = {
      ...mood,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
    };
    currentAngle += angle;
    return segment;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        Mood Distribution
      </Text>

      <View style={styles.chartContainer}>
        {/* Simple bar representation instead of donut */}
        <View style={styles.barChart}>
          {distribution.map((mood, index) => (
            <View
              key={index}
              style={[
                styles.barSegment,
                {
                  flex: mood.percentage,
                  backgroundColor: mood.color,
                },
              ]}
            />
          ))}
        </View>

        {dominantMood && (
          <View style={styles.dominantMood}>
            <Text style={styles.dominantEmoji}>{dominantMood.emoji}</Text>
            <Text style={[styles.dominantLabel, { color: theme.textPrimary }]}>
              Most Common
            </Text>
            <Text style={[styles.dominantValue, { color: dominantMood.color }]}>
              {dominantMood.label} ({Math.round(dominantMood.percentage)}%)
            </Text>
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {distribution.map((mood, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: mood.color }]} />
            <Text style={styles.legendEmoji}>{mood.emoji}</Text>
            <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>
              {mood.label}
            </Text>
            <Text style={[styles.legendPercentage, { color: theme.textPrimary }]}>
              {Math.round(mood.percentage)}%
            </Text>
            <Text style={[styles.legendCount, { color: theme.textSecondary }]}>
              ({mood.count})
            </Text>
          </View>
        ))}
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
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  chartContainer: {
    marginBottom: spacing.lg,
  },
  barChart: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  barSegment: {
    height: '100%',
  },
  dominantMood: {
    alignItems: 'center',
    padding: spacing.md,
  },
  dominantEmoji: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  dominantLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  dominantValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  legend: {
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendEmoji: {
    fontSize: 16,
  },
  legendLabel: {
    fontSize: 13,
    flex: 1,
  },
  legendPercentage: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  legendCount: {
    fontSize: 11,
    minWidth: 30,
  },
});
