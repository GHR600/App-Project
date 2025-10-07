import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { spacing } from '../styles/designSystem';

interface QuickStat {
  icon: string;
  value: number | string;
  label: string;
}

interface QuickStatsBannerProps {
  totalEntries: number;
  totalWords: number;
  avgWordsPerEntry: number;
  currentStreak: number;
}

export const QuickStatsBanner: React.FC<QuickStatsBannerProps> = ({
  totalEntries,
  totalWords,
  avgWordsPerEntry,
  currentStreak,
}) => {
  const { theme } = useTheme();

  const quickStats: QuickStat[] = [
    { icon: '📝', value: totalEntries, label: 'Entries' },
    { icon: '💬', value: totalWords.toLocaleString(), label: 'Words' },
    { icon: '📊', value: Math.round(avgWordsPerEntry), label: 'Avg/Entry' },
    { icon: '🔥', value: currentStreak, label: 'Day Streak' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
    >
      {quickStats.map((stat, index) => (
        <View
          key={index}
          style={[
            styles.statCard,
            { backgroundColor: theme.surface },
          ]}
        >
          <Text style={styles.icon}>{stat.icon}</Text>
          <Text style={[styles.value, { color: theme.textPrimary }]}>
            {stat.value}
          </Text>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            {stat.label}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 90,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 10,
    position: 'absolute',
    bottom: 4,
    right: 8,
  },
});
