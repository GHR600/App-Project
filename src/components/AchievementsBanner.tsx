import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { spacing } from '../styles/designSystem';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  currentProgress: number;
  type: 'streak' | 'entries' | 'words' | 'special';
  unlocked: boolean;
}

interface AchievementsBannerProps {
  totalEntries: number;
  totalWords: number;
  longestStreak: number;
  currentStreak: number;
}

export const AchievementsBanner: React.FC<AchievementsBannerProps> = ({
  totalEntries,
  totalWords,
  longestStreak,
  currentStreak,
}) => {
  const { theme } = useTheme();

  const achievements = useMemo(() => {
    const allAchievements: Achievement[] = [
      // Special achievements
      {
        id: 'first-entry',
        title: 'First Steps',
        description: 'Write your first entry',
        icon: '✨',
        requirement: 1,
        currentProgress: totalEntries,
        type: 'special',
        unlocked: totalEntries >= 1,
      },

      // Entry-based achievements
      {
        id: 'entries-10',
        title: 'Getting Started',
        description: '10 entries',
        icon: '📝',
        requirement: 10,
        currentProgress: totalEntries,
        type: 'entries',
        unlocked: totalEntries >= 10,
      },
      {
        id: 'entries-50',
        title: 'Dedicated Writer',
        description: '50 entries',
        icon: '📖',
        requirement: 50,
        currentProgress: totalEntries,
        type: 'entries',
        unlocked: totalEntries >= 50,
      },
      {
        id: 'entries-100',
        title: 'Century Club',
        description: '100 entries',
        icon: '💯',
        requirement: 100,
        currentProgress: totalEntries,
        type: 'entries',
        unlocked: totalEntries >= 100,
      },
      {
        id: 'entries-250',
        title: 'Prolific Journaler',
        description: '250 entries',
        icon: '🏅',
        requirement: 250,
        currentProgress: totalEntries,
        type: 'entries',
        unlocked: totalEntries >= 250,
      },
      {
        id: 'entries-500',
        title: 'Master Chronicler',
        description: '500 entries',
        icon: '🏆',
        requirement: 500,
        currentProgress: totalEntries,
        type: 'entries',
        unlocked: totalEntries >= 500,
      },
      {
        id: 'entries-1000',
        title: 'Legend',
        description: '1000 entries',
        icon: '👑',
        requirement: 1000,
        currentProgress: totalEntries,
        type: 'entries',
        unlocked: totalEntries >= 1000,
      },

      // Streak-based achievements
      {
        id: 'streak-3',
        title: 'On a Roll',
        description: '3-day streak',
        icon: '🔥',
        requirement: 3,
        currentProgress: Math.max(currentStreak, longestStreak),
        type: 'streak',
        unlocked: longestStreak >= 3,
      },
      {
        id: 'streak-7',
        title: 'Week Warrior',
        description: '7-day streak',
        icon: '⚡',
        requirement: 7,
        currentProgress: Math.max(currentStreak, longestStreak),
        type: 'streak',
        unlocked: longestStreak >= 7,
      },
      {
        id: 'streak-14',
        title: 'Fortnight Focus',
        description: '14-day streak',
        icon: '🌟',
        requirement: 14,
        currentProgress: Math.max(currentStreak, longestStreak),
        type: 'streak',
        unlocked: longestStreak >= 14,
      },
      {
        id: 'streak-30',
        title: 'Monthly Master',
        description: '30-day streak',
        icon: '💪',
        requirement: 30,
        currentProgress: Math.max(currentStreak, longestStreak),
        type: 'streak',
        unlocked: longestStreak >= 30,
      },
      {
        id: 'streak-60',
        title: 'Unstoppable',
        description: '60-day streak',
        icon: '🚀',
        requirement: 60,
        currentProgress: Math.max(currentStreak, longestStreak),
        type: 'streak',
        unlocked: longestStreak >= 60,
      },
      {
        id: 'streak-100',
        title: 'Centurion',
        description: '100-day streak',
        icon: '💎',
        requirement: 100,
        currentProgress: Math.max(currentStreak, longestStreak),
        type: 'streak',
        unlocked: longestStreak >= 100,
      },
      {
        id: 'streak-365',
        title: 'Year of Reflection',
        description: '365-day streak',
        icon: '🎯',
        requirement: 365,
        currentProgress: Math.max(currentStreak, longestStreak),
        type: 'streak',
        unlocked: longestStreak >= 365,
      },

      // Word-based achievements
      {
        id: 'words-10k',
        title: 'Wordsmith',
        description: '10,000 words',
        icon: '✍️',
        requirement: 10000,
        currentProgress: totalWords,
        type: 'words',
        unlocked: totalWords >= 10000,
      },
      {
        id: 'words-50k',
        title: 'Novelist',
        description: '50,000 words',
        icon: '📚',
        requirement: 50000,
        currentProgress: totalWords,
        type: 'words',
        unlocked: totalWords >= 50000,
      },
      {
        id: 'words-100k',
        title: 'Author',
        description: '100,000 words',
        icon: '🎓',
        requirement: 100000,
        currentProgress: totalWords,
        type: 'words',
        unlocked: totalWords >= 100000,
      },
      {
        id: 'words-250k',
        title: 'Epic Scribe',
        description: '250,000 words',
        icon: '📜',
        requirement: 250000,
        currentProgress: totalWords,
        type: 'words',
        unlocked: totalWords >= 250000,
      },
      {
        id: 'words-500k',
        title: 'Literary Legend',
        description: '500,000 words',
        icon: '🌠',
        requirement: 500000,
        currentProgress: totalWords,
        type: 'words',
        unlocked: totalWords >= 500000,
      },
    ];

    // Sort: unlocked first, then by progress percentage
    return allAchievements.sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      const aProgress = a.currentProgress / a.requirement;
      const bProgress = b.currentProgress / b.requirement;
      return bProgress - aProgress;
    });
  }, [totalEntries, totalWords, longestStreak, currentStreak]);

  const renderAchievement = (achievement: Achievement) => {
    const progress = Math.min(100, (achievement.currentProgress / achievement.requirement) * 100);
    const isUnlocked = achievement.unlocked;

    return (
      <View
        key={achievement.id}
        style={[
          styles.achievementCard,
          {
            backgroundColor: isUnlocked ? theme.primary + '15' : theme.surface,
            borderColor: isUnlocked ? theme.primary + '40' : theme.surface,
          },
        ]}
      >
        <Text style={[styles.achievementIcon, { opacity: isUnlocked ? 1 : 0.3 }]}>
          {isUnlocked ? achievement.icon : '🔒'}
        </Text>
        <Text
          style={[
            styles.achievementTitle,
            { color: isUnlocked ? theme.primary : theme.textSecondary },
          ]}
        >
          {achievement.title}
        </Text>
        <Text
          style={[
            styles.achievementDescription,
            { color: isUnlocked ? theme.textSecondary : theme.textSecondary },
          ]}
        >
          {achievement.description}
        </Text>

        {!isUnlocked && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: theme.surface }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: theme.primary + '60',
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              {Math.round(progress)}%
            </Text>
          </View>
        )}

        {isUnlocked && (
          <Text style={[styles.unlockedText, { color: theme.primary }]}>
            Unlocked! ✓
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        Achievements
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {achievements.map(renderAchievement)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  achievementCard: {
    width: 140,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  achievementDescription: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  progressContainer: {
    width: '100%',
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    textAlign: 'center',
  },
  unlockedText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});
