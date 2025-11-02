import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { DatabaseJournalEntry } from '../config/supabase';
import { spacing } from '../styles/designSystem';

interface InsightsPanelProps {
  entries: DatabaseJournalEntry[];
}

interface Insight {
  text: string;
  icon: string;
  category: 'pattern' | 'mood' | 'content' | 'timing';
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ entries }) => {
  const { theme } = useTheme();

  const insights = useMemo(() => {
    if (entries.length === 0) {
      return [];
    }

    const generatedInsights: Insight[] = [];

    // Analyze day of week patterns
    const dayOfWeekCounts = new Map<string, number>();
    const dayOfWeekWords = new Map<string, number>();

    entries.forEach(entry => {
      const date = new Date(entry.created_at);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

      dayOfWeekCounts.set(dayName, (dayOfWeekCounts.get(dayName) || 0) + 1);
      dayOfWeekWords.set(
        dayName,
        (dayOfWeekWords.get(dayName) || 0) + entry.word_count
      );
    });

    // Find most productive day
    const sortedDays = Array.from(dayOfWeekCounts.entries()).sort((a, b) => b[1] - a[1]);
    if (sortedDays.length > 1 && sortedDays[0][1] > sortedDays[1][1] * 1.5) {
      const ratio = Math.round(sortedDays[0][1] / sortedDays[1][1]);
      generatedInsights.push({
        text: `You write ${ratio}× more on ${sortedDays[0][0]}s`,
        icon: '📅',
        category: 'pattern',
      });
    }

    // Analyze time of day patterns
    const morningEntries = entries.filter(e => {
      const hour = new Date(e.created_at).getHours();
      return hour >= 5 && hour < 12;
    });

    const eveningEntries = entries.filter(e => {
      const hour = new Date(e.created_at).getHours();
      return hour >= 17 && hour < 22;
    });

    if (morningEntries.length > eveningEntries.length * 1.5) {
      generatedInsights.push({
        text: 'You prefer journaling in the morning',
        icon: '🌅',
        category: 'timing',
      });
    } else if (eveningEntries.length > morningEntries.length * 1.5) {
      generatedInsights.push({
        text: 'You prefer journaling in the evening',
        icon: '🌆',
        category: 'timing',
      });
    }

    // Analyze mood patterns
    const entriesWithMood = entries.filter(e => e.mood_rating && e.mood_rating > 0);
    if (entriesWithMood.length > 5) {
      const avgMood =
        entriesWithMood.reduce((sum, e) => sum + (e.mood_rating || 0), 0) /
        entriesWithMood.length;

      const morningMood = morningEntries
        .filter(e => e.mood_rating)
        .reduce((sum, e) => sum + (e.mood_rating || 0), 0) / (morningEntries.filter(e => e.mood_rating).length || 1);

      const eveningMood = eveningEntries
        .filter(e => e.mood_rating)
        .reduce((sum, e) => sum + (e.mood_rating || 0), 0) / (eveningEntries.filter(e => e.mood_rating).length || 1);

      if (morningMood > eveningMood + 0.5) {
        generatedInsights.push({
          text: 'Your mood tends to be better in the morning',
          icon: '😊',
          category: 'mood',
        });
      } else if (eveningMood > morningMood + 0.5) {
        generatedInsights.push({
          text: 'Your mood tends to improve throughout the day',
          icon: '📈',
          category: 'mood',
        });
      }

      if (avgMood >= 4) {
        generatedInsights.push({
          text: 'You maintain a consistently positive mood',
          icon: '✨',
          category: 'mood',
        });
      }
    }

    // Analyze word count patterns
    const totalWords = entries.reduce((sum, e) => sum + e.word_count, 0);
    const avgWords = totalWords / entries.length;

    if (avgWords > 300) {
      generatedInsights.push({
        text: `You write an average of ${Math.round(avgWords)} words per entry`,
        icon: '✍️',
        category: 'content',
      });
    }

    // Analyze recent streak
    const sortedEntries = [...entries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const uniqueDates = new Set(
      sortedEntries.map(e => new Date(e.created_at).toDateString())
    );

    let currentStreak = 0;
    const today = new Date();
    let checkDate = new Date(today);

    for (let i = 0; i < 30; i++) {
      const dateStr = checkDate.toDateString();
      if (uniqueDates.has(dateStr)) {
        currentStreak++;
      } else if (currentStreak > 0) {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    if (currentStreak >= 7) {
      generatedInsights.push({
        text: `You're on a ${currentStreak}-day streak! Keep it up!`,
        icon: '🔥',
        category: 'pattern',
      });
    }

    // Analyze content themes (simple word frequency)
    const wordFreq = new Map<string, number>();
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'must', 'can', 'a', 'an', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    ]);

    entries.forEach(entry => {
      const words = entry.content
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word));

      words.forEach(word => {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      });
    });

    const topWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (topWords.length > 0 && topWords[0][1] >= 5) {
      generatedInsights.push({
        text: `Most mentioned: "${topWords[0][0]}" (${topWords[0][1]} times)`,
        icon: '🔍',
        category: 'content',
      });
    }

    // Return top 5 insights
    return generatedInsights.slice(0, 5);
  }, [entries]);

  if (insights.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          💡 Insights
        </Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Keep journaling to unlock insights about your patterns!
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        💡 Patterns
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Behavioural patterns discovered from your journaling
      </Text>

      <View style={styles.insightsList}>
        {insights.map((insight, index) => (
          <View
            key={index}
            style={[
              styles.insightCard,
              {
                backgroundColor: theme.primary + '10',
                borderColor: theme.primary + '20',
              },
            ]}
          >
            <Text style={styles.insightIcon}>{insight.icon}</Text>
            <Text style={[styles.insightText, { color: theme.textPrimary }]}>
              {insight.text}
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
  insightsList: {
    gap: spacing.sm,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    gap: spacing.sm,
  },
  insightIcon: {
    fontSize: 20,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
