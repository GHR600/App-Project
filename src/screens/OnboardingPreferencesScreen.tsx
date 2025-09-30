import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography, components } from '../styles/designSystem';

interface OnboardingPreferencesScreenProps {
  onComplete: (preferences: OnboardingPreferences) => void;
}

export interface OnboardingPreferences {
  focusAreas: string[];
  preferredTime: string;
  personalityType?: string;
}

export const OnboardingPreferencesScreen: React.FC<OnboardingPreferencesScreenProps> = ({
  onComplete
}) => {
  const { theme } = useTheme();
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [preferredTime, setPreferredTime] = useState('');
  const [personalityType, setPersonalityType] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const focusAreaOptions = [
    { id: 'career', label: 'Career & Work', icon: '💼', description: 'Professional growth and workplace experiences' },
    { id: 'relationships', label: 'Relationships', icon: '❤️', description: 'Family, friends, and romantic connections' },
    { id: 'health', label: 'Health & Wellness', icon: '🏃', description: 'Physical and mental wellbeing' },
    { id: 'personal-growth', label: 'Personal Growth', icon: '🌱', description: 'Self-improvement and learning' },
    { id: 'creativity', label: 'Creativity', icon: '🎨', description: 'Creative projects and artistic expression' },
    { id: 'spirituality', label: 'Spirituality', icon: '🧘', description: 'Spiritual practice and mindfulness' },
    { id: 'finances', label: 'Finances', icon: '💰', description: 'Money management and financial goals' },
    { id: 'hobbies', label: 'Hobbies & Interests', icon: '🎯', description: 'Leisure activities and passions' }
  ];

  const timeOptions = [
    { id: 'morning', label: 'Morning', icon: '🌅', description: 'Start your day with reflection' },
    { id: 'afternoon', label: 'Afternoon', icon: '☀️', description: 'Midday check-in with yourself' },
    { id: 'evening', label: 'Evening', icon: '🌙', description: 'End your day with gratitude' },
    { id: 'flexible', label: 'Flexible', icon: '⏰', description: 'Journal whenever feels right' }
  ];

  const personalityOptions = [
    { id: 'analytical', label: 'Analytical Thinker', icon: '🧮', description: 'You love data and logical reasoning' },
    { id: 'creative', label: 'Creative Explorer', icon: '🎨', description: 'You thrive on imagination and innovation' },
    { id: 'social', label: 'Social Connector', icon: '🤝', description: 'You draw energy from relationships' },
    { id: 'reflective', label: 'Reflective Observer', icon: '🤔', description: 'You prefer deep thought and introspection' },
    { id: 'action-oriented', label: 'Action-Oriented', icon: '⚡', description: 'You prefer doing over thinking' },
    { id: 'balanced', label: 'Balanced Approach', icon: '⚖️', description: 'You like a mix of everything' }
  ];

  const handleFocusAreaToggle = (areaId: string) => {
    setFocusAreas(prev =>
      prev.includes(areaId)
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete({
        focusAreas,
        preferredTime,
        personalityType
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return focusAreas.length > 0;
      case 2:
        return preferredTime !== '';
      case 3:
        return personalityType !== '';
      default:
        return false;
    }
  };

  const renderStep1 = () => (
    <View style={[styles.stepContainer, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>What would you like to focus on?</Text>
        <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
          Choose the areas of your life you'd like to explore through journaling.
          Select as many as feel relevant to you.
        </Text>
      </View>

      <View style={styles.optionsGrid}>
        {focusAreaOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => handleFocusAreaToggle(option.id)}
            style={[
              styles.optionCard,
              {
                backgroundColor: focusAreas.includes(option.id) ? theme.primary : theme.surface,
                borderColor: focusAreas.includes(option.id) ? theme.primary : theme.cardBorder
              }
            ]}
          >
            <Text style={styles.optionIcon}>{option.icon}</Text>
            <Text style={[styles.optionLabel, { color: focusAreas.includes(option.id) ? theme.white : theme.textPrimary }]}>{option.label}</Text>
            <Text style={[styles.optionDescription, { color: focusAreas.includes(option.id) ? theme.white : theme.textSecondary }]}>{option.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {focusAreas.length > 0 && (
        <View style={[styles.selectedCount, { backgroundColor: theme.primary + '20' }]}>
          <Text style={[styles.selectedText, { color: theme.primary }]}>
            {focusAreas.length} area{focusAreas.length !== 1 ? 's' : ''} selected
          </Text>
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={[styles.stepContainer, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>When do you prefer to journal?</Text>
        <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
          Choose the time of day when you're most likely to reflect and write.
          We'll send gentle reminders to help you build a consistent habit.
        </Text>
      </View>

      <View style={styles.optionsColumn}>
        {timeOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => setPreferredTime(option.id)}
            style={[
              styles.timeOptionCard,
              {
                backgroundColor: preferredTime === option.id ? theme.primary : theme.surface,
                borderColor: preferredTime === option.id ? theme.primary : theme.cardBorder
              }
            ]}
          >
            <Text style={styles.timeOptionIcon}>{option.icon}</Text>
            <View style={styles.timeOptionContent}>
              <Text style={[styles.optionLabel, { color: preferredTime === option.id ? theme.white : theme.textPrimary }]}>{option.label}</Text>
              <Text style={[styles.optionDescription, { color: preferredTime === option.id ? theme.white : theme.textSecondary }]}>{option.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={[styles.stepContainer, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>How would you describe yourself?</Text>
        <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
          This helps us provide more personalized insights and prompts
          that match your thinking style and preferences.
        </Text>
      </View>

      <View style={styles.optionsColumn}>
        {personalityOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => setPersonalityType(option.id)}
            style={[
              styles.timeOptionCard,
              {
                backgroundColor: personalityType === option.id ? theme.primary : theme.surface,
                borderColor: personalityType === option.id ? theme.primary : theme.cardBorder
              }
            ]}
          >
            <Text style={styles.timeOptionIcon}>{option.icon}</Text>
            <View style={styles.timeOptionContent}>
              <Text style={[styles.optionLabel, { color: personalityType === option.id ? theme.white : theme.textPrimary }]}>{option.label}</Text>
              <Text style={[styles.optionDescription, { color: personalityType === option.id ? theme.white : theme.textSecondary }]}>{option.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: theme.cardBorder }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(currentStep / 3) * 100}%`, backgroundColor: theme.primary }
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.textMuted }]}>
              Step {currentStep} of 3
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </View>

        <View style={styles.actions}>
          {currentStep > 1 && (
            <TouchableOpacity onPress={handleBack} style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
              <Text style={[styles.backButtonText, { color: theme.textSecondary }]}>← Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleNext}
            disabled={!canProceed()}
            style={[
              styles.nextButton,
              { backgroundColor: canProceed() ? theme.primary : theme.cardBorder }
            ]}
          >
            <Text style={[styles.nextButtonText, { color: theme.white }]}>
              {currentStep === 3 ? 'Complete Setup' : 'Next →'}
            </Text>
          </TouchableOpacity>
        </View>
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
  progressContainer: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: typography.caption.fontSize,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  stepContainer: {
    borderRadius: components.card.borderRadius,
    padding: 40,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stepTitle: {
    fontWeight: typography.heading.fontWeight as any,
    fontSize: typography.heading.fontSize,
    marginBottom: 12,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: typography.body.fontSize,
    lineHeight: 24,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  optionsColumn: {
    gap: 12,
  },
  optionCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    width: '48%',
    marginBottom: 16,
  },
  timeOptionCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 12,
    textAlign: 'center',
  },
  timeOptionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  timeOptionContent: {
    flex: 1,
  },
  optionLabel: {
    fontWeight: 'bold',
    fontSize: typography.body.fontSize,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
  },
  selectedCount: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  selectedText: {
    fontSize: typography.caption.fontSize,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    gap: 16,
    paddingTop: 20,
  },
  backButton: {
    borderWidth: 1,
    borderRadius: components.button.borderRadius,
    height: components.button.height,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: typography.body.fontSize,
  },
  nextButton: {
    borderRadius: components.button.borderRadius,
    height: components.button.height,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    maxWidth: 200,
  },
  nextButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: 'bold',
  },
});