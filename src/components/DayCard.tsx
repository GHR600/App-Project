import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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

  const getEntryTypeIcon = (entryType: 'journal' | 'note') => {
    return entryType === 'journal' ? '📝' : '🗒️';
  };

  const renderEntryTags = () => {
    const tags: string[] = [];

    if (dayData.journalEntry) {
      tags.push('📝 Main Journal');
    }

    dayData.notes.forEach((note, index) => {
      if (index < 2) { // Show max 2 note titles
        const title = note.title || `Note ${index + 1}`;
        tags.push(`🗒️ ${title}`);
      }
    });

    return tags.slice(0, 3); // Max 3 tags total
  };

  const getAdditionalEntriesText = () => {
    const additionalCount = dayData.totalEntries - 1; // Excluding the main one shown
    if (additionalCount > 0) {
      return `+ ${additionalCount} more ${additionalCount === 1 ? 'entry' : 'entries'}`;
    }
    return null;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.dateText}>{formatDate(dayData.date)}</Text>
        <Text style={styles.moodEmoji}>{dayData.dominantMood}</Text>
      </View>

      <Text style={styles.previewText} numberOfLines={2}>
        {dayData.previewText}
      </Text>

      {getAdditionalEntriesText() && (
        <Text style={styles.additionalText}>
          {getAdditionalEntriesText()}
        </Text>
      )}

      <View style={styles.separator} />

      <View style={styles.tagsContainer}>
        {renderEntryTags().map((tag, index) => (
          <Text key={index} style={styles.tagText} numberOfLines={1}>
            {tag}
          </Text>
        ))}
      </View>
    </TouchableOpacity>
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