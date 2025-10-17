import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AnimatedButton } from './AnimatedButton';
import { colors, typography, shadows, borderRadius, spacing } from '../styles/designSystem';
import { DayCardData } from '../types';

interface DayCardProps {
  dayData: DayCardData;
  onPress: () => void;
}

export const DayCard: React.FC<DayCardProps> = ({ dayData, onPress }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown Date';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const renderEntrySummary = () => {
    const summaries: string[] = [];

    // Show first entry with icon
    if (dayData.entries.length > 0) {
      const firstEntry = dayData.entries[0];
      const icon = '📝';
      const title = firstEntry.title || 'Entry';
      summaries.push(`${icon} ${title}`);
    }

    // Show additional entries count
    if (dayData.entries.length > 1) {
      summaries.push(`+ ${dayData.entries.length - 1} more ${dayData.entries.length - 1 === 1 ? 'entry' : 'entries'}`);
    }

    return summaries;
  };

  return (
    <AnimatedButton style={styles.container} onPress={onPress} hapticFeedback="light">
      <View style={styles.header}>
        <Text style={styles.dateText}>{formatDate(dayData.date)}</Text>
        <Text style={styles.moodEmoji}>{dayData.dominantMood}</Text>
      </View>

      <Text style={styles.previewText} numberOfLines={2}>
        {dayData.previewText}
      </Text>

      <View style={styles.separator} />

      <View style={styles.tagsContainer}>
        {renderEntrySummary().map((summary, index) => (
          <Text key={index} style={styles.tagText} numberOfLines={1}>
            {summary}
          </Text>
        ))}
      </View>
    </AnimatedButton>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dateText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  moodEmoji: {
    fontSize: 24,
  },
  previewText: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  additionalText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'column',
    gap: spacing.xs,
  },
  tagText: {
    ...typography.small,
    color: colors.textSecondary,
    flex: 1,
  },
});