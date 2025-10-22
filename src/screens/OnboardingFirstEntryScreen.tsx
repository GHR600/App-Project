import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography, components } from '../styles/designSystem';
import { AIInsightDisplay } from '../components/AIInsightDisplay';
import { JournalService } from '../services/journalService';
import { UserPreferencesService } from '../services/userPreferencesService';
import { AIInsight, JournalEntry, UserContext } from '../services/aiInsightService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';


interface OnboardingFirstEntryScreenProps {
  userPreferences: {
    focusAreas: string[];
    preferredTime: string;
    personalityType?: string;
  };
  onComplete: () => void;
}

export const OnboardingFirstEntryScreen: React.FC<OnboardingFirstEntryScreenProps> = ({
  userPreferences,
  onComplete
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [entryText, setEntryText] = useState('');
  const [moodRating, setMoodRating] = useState<number | null>(null);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [showInsight, setShowInsight] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [insight, setInsight] = useState<AIInsight | null>(null);

  const getOnboardingPrompt = () => {
    const prompts = {
      career: "What's one professional goal you're excited about right now, and what small step could you take toward it this week?",
      relationships: "Think about someone who made you smile recently. What was it about that interaction that brought you joy?",
      health: "How has your body felt today, and what's one thing you could do tomorrow to take care of yourself?",
      'personal-growth': "What's something new you've learned about yourself lately, even if it's small?",
      creativity: "If you could spend an hour today on any creative activity, what would it be and why?",
      spirituality: "What moment today, however brief, made you feel most present and connected?",
      finances: "What does financial peace of mind look like for you, and what's one step toward that vision?",
      hobbies: "What activity or interest always manages to lift your spirits when you're feeling down?"
    };

    const primaryFocus = userPreferences.focusAreas[0];
    return prompts[primaryFocus as keyof typeof prompts] ||
           "What's on your mind today? Share whatever feels important to you right now.";
  };

  const getMoodEmoji = (rating: number) => {
    const emojis = ['😢', '😔', '😐', '😊', '😄'];
    return emojis[rating - 1] || '😐';
  };

  const handleSaveEntry = async () => {
    if (!entryText.trim() || !user) return;

    setIsSaving(true);

    try {
      // Create the journal entry
      const { entry, error } = await JournalService.createEntry(user.id, {
        content: entryText,
        moodRating: moodRating || undefined
      });

      if (error || !entry) {
        console.error('Failed to save entry:', error);
        return;
      }

      // Convert to the format expected by AI service
      const journalEntry: JournalEntry = {
        id: entry.id,
        content: entry.content,
        moodRating: entry.mood_rating || undefined,
        createdAt: entry.created_at,
        userId: entry.user_id
      };

      setCurrentEntry(journalEntry);
      setShowInsight(true);
    } catch (error) {
      console.error('Failed to save entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInsightGenerated = (generatedInsight: AIInsight) => {
    setInsight(generatedInsight);
  };

  const handleComplete = async () => {
    if (!user) return;

    try {
      // Save user preferences to database
      await UserPreferencesService.createPreferences(user.id, {
        focusAreas: userPreferences.focusAreas,
        personalityType: userPreferences.personalityType,
        preferredTime: userPreferences.preferredTime,
        reminderEnabled: true
      });

      // Mark onboarding as complete
      await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Still proceed to complete onboarding even if there's an error
      onComplete();
    }
  };

  // Create user context for AI insights
  const userContext: UserContext = {
    focusAreas: userPreferences.focusAreas,
    recentMoodTrend: 'neutral', // First entry, so neutral
    subscriptionStatus: 'free'
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeIcon}>🎉</Text>
            <Text style={[styles.title, { color: theme.textPrimary }]}>You're almost ready!</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Let's start with your first journal entry.
            </Text>
          </View>
        </View>

        {!showInsight ? (
          <View style={styles.entrySection}>
            <View style={[styles.promptCard, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
              <Text style={[styles.promptTitle, { color: theme.primary }]}>Today's Reflection</Text>
              <Text style={[styles.promptText, { color: theme.textPrimary }]}>{getOnboardingPrompt()}</Text>
            </View>

            <View style={[styles.entryForm, { backgroundColor: theme.cardBackground }]}>
              <View style={styles.textareaContainer}>
                <TextInput
                  value={entryText}
                  onChangeText={setEntryText}
                  placeholder="Take your time and write whatever comes to mind. There's no right or wrong answer..."
                  placeholderTextColor={theme.textMuted}
                  style={[styles.textarea, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.textPrimary }]}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.moodSection}>
                <Text style={[styles.moodTitle, { color: theme.textPrimary }]}>How are you feeling right now? (1-5)</Text>
                <View style={styles.moodButtons}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      onPress={() => setMoodRating(rating)}
                      style={[
                        styles.moodButton,
                        {
                          backgroundColor: moodRating === rating ? theme.primary + '20' : theme.surface,
                          borderColor: moodRating === rating ? theme.primary : theme.cardBorder
                        }
                      ]}
                    >
                      <Text style={styles.moodEmoji}>{getMoodEmoji(rating)}</Text>
                      <Text style={[styles.moodLabel, { color: theme.textMuted }]}>{rating}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={handleSaveEntry}
                  disabled={!entryText.trim() || isSaving}
                  style={[
                    styles.saveButton,
                    { backgroundColor: (!entryText.trim() || isSaving) ? theme.cardBorder : theme.primary }
                  ]}
                >
                  <Text style={[styles.saveButtonText, { color: theme.white }]}>
                    {isSaving ? 'Saving...' : 'Get My First Insight ✨'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.insightSection}>
            <View style={styles.insightHeader}>
              <Text style={[styles.insightTitle, { color: theme.textPrimary }]}>Here's your personalized insight!</Text>
              <Text style={[styles.insightSubtitle, { color: theme.textSecondary }]}>
              </Text>
            </View>

          {currentEntry && (
            <AIInsightDisplay
              journalEntry={currentEntry}
              userContext={userContext}
              recentEntries={[]}
              onInsightGenerated={handleInsightGenerated}
            />
          )}

            {insight && (
              <View style={styles.completionSection}>
                <View style={[styles.completionCard, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}>
                  <Text style={styles.completionIcon}>🎯</Text>
                  <Text style={[styles.completionTitle, { color: theme.textPrimary }]}>You're all set!</Text>
                  <Text style={[styles.completionText, { color: theme.textSecondary }]}>
            
                  </Text>
                  <TouchableOpacity onPress={handleComplete} style={[styles.completeButton, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.completeButtonText, { color: theme.white }]}>Start Journaling</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Entry Preview */}
            {currentEntry && (
              <View style={[styles.entryPreview, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.previewTitle, { color: theme.textPrimary }]}>Your First Entry</Text>
                <View style={[styles.previewContent, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.previewText, { color: theme.textSecondary }]}>{currentEntry.content}</Text>
                  {currentEntry.moodRating && (
                    <View style={styles.previewMood}>
                      <Text style={styles.previewMoodEmoji}>
                        {getMoodEmoji(currentEntry.moodRating)}
                      </Text>
                      <Text style={[styles.previewMoodText, { color: theme.textMuted }]}>
                        Mood: {currentEntry.moodRating}/5
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  welcomeSection: {
    alignItems: 'center',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  welcomeIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: typography.heading.fontWeight as any,
    fontSize: typography.heading.fontSize,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    lineHeight: 24,
    textAlign: 'center',
  },
  entrySection: {
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
  },
  promptCard: {
    borderWidth: 1,
    borderRadius: components.card.borderRadius,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  promptTitle: {
    fontWeight: 'bold',
    fontSize: typography.body.fontSize,
    marginBottom: 12,
  },
  promptText: {
    fontSize: typography.body.fontSize,
    lineHeight: 24,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  entryForm: {
    borderRadius: components.card.borderRadius,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textareaContainer: {
    marginBottom: 24,
  },
  textarea: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: typography.body.fontSize,
    lineHeight: 24,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  moodSection: {
    marginBottom: 32,
  },
  moodTitle: {
    fontWeight: 'bold',
    fontSize: typography.body.fontSize,
    marginBottom: 16,
    textAlign: 'center',
  },
  moodButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderRadius: 8,
    minWidth: 60,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: 'bold',
  },
  actions: {
    alignItems: 'center',
  },
  saveButton: {
    borderRadius: components.button.borderRadius,
    height: components.button.height,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: 'bold',
  },
  insightSection: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  insightHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  insightTitle: {
    fontFamily: typography.heading.fontFamily,
    fontWeight: typography.heading.fontWeight as any,
    fontSize: typography.heading.fontSize,
    marginBottom: 8,
    textAlign: 'center',
  },
  insightSubtitle: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
  completionSection: {
    marginTop: 32,
  },
  completionCard: {
    borderRadius: components.card.borderRadius,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  completionIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  completionTitle: {
    fontFamily: typography.heading.fontFamily,
    fontWeight: typography.heading.fontWeight as any,
    fontSize: typography.body.fontSize,
    marginBottom: 12,
  },
  completionText: {
    fontSize: typography.body.fontSize,
    marginBottom: 24,
    lineHeight: 24,
    textAlign: 'center',
  },
  completeButton: {
    borderRadius: components.button.borderRadius,
    height: components.button.height,
    minWidth: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: 'bold',
  },
  entryPreview: {
    borderRadius: components.card.borderRadius,
    padding: 20,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  previewTitle: {
    fontWeight: 'bold',
    fontSize: typography.body.fontSize,
    marginBottom: 12,
  },
  previewContent: {
    padding: 16,
    borderRadius: 8,
  },
  previewText: {
    fontSize: typography.body.fontSize,
    marginBottom: 12,
    lineHeight: 24,
  },
  previewMood: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewMoodEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  previewMoodText: {
    fontSize: typography.caption.fontSize,
    fontWeight: 'bold',
  },
});