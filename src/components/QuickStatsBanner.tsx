import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { spacing } from '../styles/designSystem';
import { FileTextIcon, FlameIcon } from './icons/AppIcons';
import { MessageSquare, BarChart3 } from 'lucide-react-native';

interface QuickStat {
  iconType: 'entries' | 'words' | 'average' | 'streak';
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
    { iconType: 'entries', value: totalEntries, label: 'Entries' },
    { iconType: 'words', value: totalWords.toLocaleString(), label: 'Words' },
    { iconType: 'average', value: Math.round(avgWordsPerEntry), label: 'Avg/Entry' },
    { iconType: 'streak', value: currentStreak, label: 'Day Streak' },
  ];

  const renderIcon = (iconType: QuickStat['iconType']) => {
    const iconSize = 20;
    const iconColor = theme.primary;

    switch (iconType) {
      case 'entries':
        return <FileTextIcon size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'words':
        return <MessageSquare size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'average':
        return <BarChart3 size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'streak':
        return <FlameIcon size={iconSize} color={iconColor} fill={iconColor} strokeWidth={2} />;
      default:
        return null;
    }
  };

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
          <View style={styles.iconContainer}>
            {renderIcon(stat.iconType)}
          </View>
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
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
