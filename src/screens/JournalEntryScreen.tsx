import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, components } from '../styles/designSystem';
import { JournalService, CreateJournalEntryData } from '../services/journalService';
import { AIInsightService, AIInsight, JournalEntry, UserContext } from '../services/aiInsightService';
import { AIInsightDisplay } from '../components/AIInsightDisplay';

interface JournalEntryScreenProps {
  userId: string;
  onPaywallRequired?: () => void;
  onEntryComplete?: (entry: any, insight?: any) => void;
  onBack?: () => void;
}

type FlowState = 'writing' | 'saving' | 'generating_insight' | 'showing_insight' | 'success';

export const JournalEntryScreen: React.FC<JournalEntryScreenProps> = ({
  userId,
  onPaywallRequired,
  onEntryComplete,
  onBack
}) => {
  const [entryText, setEntryText] = useState('');
  const [moodRating, setMoodRating] = useState<number | null>(null);
  const [flowState, setFlowState] = useState<FlowState>('writing');
  const [savedEntry, setSavedEntry] = useState<any>(null);
  const [generatedInsight, setGeneratedInsight] = useState<AIInsight | null>(null);
  const [fadeAnim] = useState(new Animated.Value(1));

  // Mock user context - in production this would come from user preferences
  const mockUserContext: UserContext = {
    focusAreas: ['general'],
    recentMoodTrend: 'neutral',
    subscriptionStatus: 'free'
  };

  const handleContinue = () => {
    setFlowState('success');
    setTimeout(() => {
      if (onEntryComplete) {
        onEntryComplete(savedEntry, generatedInsight);
      }
    }, 1500);
  };

  const handleSaveEntry = async () => {
    if (!entryText.trim()) {
      Alert.alert('Empty Entry', 'Please write something before saving your entry.');
      return;
    }

    setFlowState('saving');

    try {
      // Save entry to database
      const { entry, error } = await JournalService.createEntry(userId, {
        content: entryText.trim(),
        moodRating: moodRating ?? undefined
      });

      if (error) {
        Alert.alert('Error', 'Failed to save your entry. Please try again.');
        setFlowState('writing');
        return;
      }

      setSavedEntry(entry);
      setFlowState('generating_insight');

      // Convert to AIInsight format
      const journalEntry: JournalEntry = {
        id: entry!.id,
        content: entry!.content,
        moodRating: entry!.mood_rating,
        createdAt: entry!.created_at,
        userId: entry!.user_id
      };

      // Auto-generate AI insight
      try {
        const insight = await AIInsightService.generateInsight(
          journalEntry,
          mockUserContext,
          []
        );

        setGeneratedInsight(insight);

        // Save insight to database
        try {
          await AIInsightService.saveInsightToDatabase(userId, entry!.id, insight);
        } catch (saveError) {
          console.error('Failed to save insight to database:', saveError);
          // Continue with flow even if save fails
        }

        setFlowState('showing_insight');

      } catch (insightError) {
        // If insight generation fails (e.g., paywall), still show success
        console.log('Insight generation failed:', insightError);
        if (insightError instanceof Error && insightError.message.includes('Premium subscription required')) {
          onPaywallRequired?.();
          return;
        }

        setFlowState('success');
      }

    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setFlowState('writing');
    }
  };

  const getMoodEmoji = (rating: number) => {
    switch (rating) {
      case 1: return '😢';
      case 2: return '😕';
      case 3: return '😐';
      case 4: return '😊';
      case 5: return '😄';
      default: return '😐';
    }
  };

  const getMoodLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Very Low';
      case 2: return 'Low';
      case 3: return 'Neutral';
      case 4: return 'Good';
      case 5: return 'Great';
      default: return 'Neutral';
    }
  };

  const renderMoodSelector = () => (
    <View style={styles.moodSection}>
      <Text style={styles.sectionTitle}>How are you feeling? (Optional)</Text>
      <View style={styles.moodGrid}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <TouchableOpacity
            key={rating}
            style={[
              styles.moodButton,
              moodRating === rating && styles.moodButtonSelected
            ]}
            onPress={() => setMoodRating(rating)}
          >
            <Text style={styles.moodEmoji}>{getMoodEmoji(rating)}</Text>
            <Text style={[
              styles.moodLabel,
              moodRating === rating && styles.moodLabelSelected
            ]}>
              {getMoodLabel(rating)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderWritingState = () => (
    <>
      <Text style={styles.promptText}>What's on your mind today?</Text>

      <TextInput
        style={styles.journalInput}
        multiline
        placeholder="Share your thoughts, feelings, and experiences..."
        value={entryText}
        onChangeText={setEntryText}
        textAlignVertical="top"
        editable={flowState === 'writing'}
      />

      {renderMoodSelector()}

      <TouchableOpacity
        style={[styles.saveButton, { opacity: entryText.trim() ? 1 : 0.5 }]}
        onPress={handleSaveEntry}
        disabled={!entryText.trim()}
      >
        <Text style={styles.saveButtonText}>📝 Save & Get Insight</Text>
      </TouchableOpacity>
    </>
  );

  const renderSavingState = () => (
    <View style={styles.statusContainer}>
      <Text style={styles.statusIcon}>💾</Text>
      <Text style={styles.statusTitle}>Saving your entry...</Text>
      <Text style={styles.statusSubtitle}>Your thoughts are being saved securely</Text>
    </View>
  );

  const renderGeneratingInsightState = () => (
    <View style={styles.statusContainer}>
      <Text style={styles.statusIcon}>🧠</Text>
      <Text style={styles.statusTitle}>Generating your insight...</Text>
      <Text style={styles.statusSubtitle}>AI is analyzing your entry</Text>
    </View>
  );

  const renderShowingInsightState = () => (
    <>
      <View style={styles.completedEntry}>
        <Text style={styles.completedTitle}>✅ Entry Saved!</Text>
        <Text style={styles.completedContent}>{entryText}</Text>
        {moodRating && (
          <Text style={styles.completedMood}>
            Mood: {getMoodEmoji(moodRating)} {getMoodLabel(moodRating)}
          </Text>
        )}
      </View>

      {generatedInsight && savedEntry && (
        <AIInsightDisplay
          journalEntry={{
            id: savedEntry.id,
            content: savedEntry.content,
            moodRating: savedEntry.mood_rating,
            createdAt: savedEntry.created_at,
            userId: savedEntry.user_id
          }}
          userContext={mockUserContext}
          onPaywallRequired={onPaywallRequired}
        />
      )}

      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinue}
      >
        <Text style={styles.continueButtonText}>Continue to Dashboard</Text>
      </TouchableOpacity>
    </>
  );

  const renderSuccessState = () => (
    <Animated.View style={[styles.successContainer, { opacity: fadeAnim }]}>
      <Text style={styles.successIcon}>🎉</Text>
      <Text style={styles.successTitle}>Entry Saved Successfully!</Text>
      <Text style={styles.successSubtitle}>Great job journaling today</Text>
    </Animated.View>
  );

  const renderCurrentState = () => {
    switch (flowState) {
      case 'saving':
        return renderSavingState();
      case 'generating_insight':
        return renderGeneratingInsightState();
      case 'showing_insight':
        return renderShowingInsightState();
      case 'success':
        return renderSuccessState();
      default:
        return renderWritingState();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            disabled={flowState === 'saving' || flowState === 'generating_insight'}
          >
            <Text style={[
              styles.backButtonText,
              (flowState === 'saving' || flowState === 'generating_insight') && styles.backButtonDisabled
            ]}>
              ← Back
            </Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>
            {flowState === 'writing' ? 'New Entry' :
             flowState === 'saving' ? 'Saving...' :
             flowState === 'generating_insight' ? 'Analyzing...' :
             flowState === 'showing_insight' ? 'Your Insight' :
             'Complete!'}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          {renderCurrentState()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    marginRight: 15,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  backButtonDisabled: {
    color: colors.gray400,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray900,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  promptText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 20,
    textAlign: 'center',
  },
  journalInput: {
    backgroundColor: colors.white,
    padding: 20,
    minHeight: 200,
    fontSize: 16,
    lineHeight: 24,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: 24,
    textAlignVertical: 'top',
    fontFamily: typography.body.fontFamily,
    ...components.card,
  },
  moodSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 16,
    textAlign: 'center',
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: components.button.borderRadius,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray200,
    minHeight: 80,
  },
  moodButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    color: colors.gray600,
    fontWeight: '500',
    textAlign: 'center',
  },
  moodLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: components.button.borderRadius,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  statusIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
  },
  completedEntry: {
    backgroundColor: colors.white,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.success,
    ...components.card,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 12,
    textAlign: 'center',
  },
  completedContent: {
    fontSize: 16,
    color: colors.gray800,
    lineHeight: 24,
    marginBottom: 12,
  },
  completedMood: {
    fontSize: 14,
    color: colors.gray600,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: components.button.borderRadius,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 18,
    color: colors.gray600,
    textAlign: 'center',
  },
});
