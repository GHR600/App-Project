import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { DatabaseJournalEntry } from '../config/supabase';
import { spacing } from '../styles/designSystem';

interface MonthSummaryCardProps {
  entries: DatabaseJournalEntry[];
}

interface MonthStats {
  month: string;
  year: number;
  entryCount: number;
  avgMood: number;
  comparisonToPrevious: number;
  longestStreak: number;
}

export const MonthSummaryCard: React.FC<MonthSummaryCardProps> = ({ entries }) => {
  const { theme } = useTheme();

  const monthStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get current month entries
    const currentMonthEntries = entries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    });

    // Get previous month entries
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const previousMonthEntries = entries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      return entryDate.getMonth() === prevMonth && entryDate.getFullYear() === prevYear;
    });

    // Calculate current month stats
    const entryCount = currentMonthEntries.length;
    const avgMood = currentMonthEntries.length > 0
      ? currentMonthEntries.reduce((sum, e) => sum + (e.mood_rating || 0), 0) / currentMonthEntries.length
      : 0;

    // Calculate comparison
    const previousCount = previousMonthEntries.length;
    const comparisonToPrevious = previousCount > 0
      ? ((entryCount - previousCount) / previousCount) * 100
      : entryCount > 0 ? 100 : 0;

    // Calculate longest streak this month
    const dates = currentMonthEntries
      .map(e => new Date(e.created_at).toDateString())
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort();

    let longestStreak = 0;
    let currentStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (dayDiff === 1) {
        currentStreak++;
      } else {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    const monthName = now.toLocaleDateString('en-US', { month: 'long' });

    return {
      month: monthName,
      year: currentYear,
      entryCount,
      avgMood,
      comparisonToPrevious,
      longestStreak,
    };
  }, [entries]);

  const getComparisonColor = (comparison: number) => {
    if (comparison > 0) return '#10b981'; // green
    if (comparison < 0) return '#ef4444'; // red
    return theme.textSecondary;
  };

  const getComparisonIcon = (comparison: number) => {
    if (comparison > 0) return '📈';
    if (comparison < 0) return '📉';
    return '➡️';
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.primary + '20',
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📅</Text>
        <Text style={[styles.headerText, { color: theme.textPrimary }]}>
          {monthStats.month} {monthStats.year}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statRow}>
          <Text style={styles.statIcon}>✍️</Text>
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>
              {monthStats.entryCount} {monthStats.entryCount === 1 ? 'entry' : 'entries'}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              This month
            </Text>
          </View>
        </View>

        {monthStats.avgMood > 0 && (
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>😊</Text>
            <View style={styles.statInfo}>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {monthStats.avgMood.toFixed(1)}/5
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Average mood
              </Text>
            </View>
          </View>
        )}

        <View style={styles.statRow}>
          <Text style={styles.statIcon}>{getComparisonIcon(monthStats.comparisonToPrevious)}</Text>
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, { color: getComparisonColor(monthStats.comparisonToPrevious) }]}>
              {monthStats.comparisonToPrevious > 0 ? '+' : ''}
              {Math.round(monthStats.comparisonToPrevious)}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              vs last month
            </Text>
          </View>
        </View>

        {monthStats.longestStreak > 1 && (
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>🔥</Text>
            <View style={styles.statInfo}>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {monthStats.longestStreak} days
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Longest streak
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsGrid: {
    gap: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statIcon: {
    fontSize: 20,
    width: 28,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
  },
});
