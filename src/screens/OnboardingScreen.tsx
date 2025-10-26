import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AnimatedButton } from '../components/AnimatedButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../config/supabase';

interface OnboardingScreenProps {
  userId: string;
  onComplete: () => void;
}

type AIStyle = 'coach' | 'reflector';

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ userId, onComplete }) => {
  const { theme } = useTheme();
  const [selectedStyle, setSelectedStyle] = useState<AIStyle | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectStyle = async (style: AIStyle) => {
    setSelectedStyle(style);
    setLoading(true);

    try {
      // Save AI style to database
      const { error } = await supabase
        .from('users')
        .update({ ai_style: style })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Complete onboarding
      setTimeout(() => {
        onComplete();
      }, 300); // Small delay for visual feedback
    } catch (error) {
      console.error('Error saving AI style:', error);
      Alert.alert('Error', 'Failed to save your preference. Please try again.');
      setLoading(false);
      setSelectedStyle(null);
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Do you want a coach or a reflector?</Text>
        <Text style={styles.subtitle}>You can change this anytime in Settings</Text>

        <View style={styles.cardsContainer}>
          {/* Coach Card */}
          <AnimatedButton
            style={[
              styles.card,
              selectedStyle === 'coach' && styles.cardSelected,
            ]}
            onPress={() => !loading && handleSelectStyle('coach')}
            disabled={loading}
            hapticFeedback="medium"
          >
            <Text style={styles.cardEmoji}>🎯</Text>
            <Text style={styles.cardTitle}>Coach</Text>
            <Text style={styles.cardDescription}>
              Strategic and direct. Helps you spot patterns and take action.
            </Text>
            <View style={styles.exampleContainer}>
              <Text style={styles.exampleLabel}>Example:</Text>
              <Text style={styles.exampleText}>
                "This is the third time you've mentioned feeling overlooked. What would speaking up look like?"
              </Text>
            </View>
            {selectedStyle === 'coach' && loading && (
              <ActivityIndicator color={theme.white} style={styles.loader} />
            )}
          </AnimatedButton>

          {/* Reflector Card */}
          <AnimatedButton
            style={[
              styles.card,
              selectedStyle === 'reflector' && styles.cardSelected,
            ]}
            onPress={() => !loading && handleSelectStyle('reflector')}
            disabled={loading}
            hapticFeedback="medium"
          >
            <Text style={styles.cardEmoji}>🧘</Text>
            <Text style={styles.cardTitle}>Reflector</Text>
            <Text style={styles.cardDescription}>
              Thoughtful and curious. Gives you space to process and think clearly.
            </Text>
            <View style={styles.exampleContainer}>
              <Text style={styles.exampleLabel}>Example:</Text>
              <Text style={styles.exampleText}>
                "You're feeling stuck between two options. What part feels most important to sit with?"
              </Text>
            </View>
            {selectedStyle === 'reflector' && loading && (
              <ActivityIndicator color={theme.white} style={styles.loader} />
            )}
          </AnimatedButton>
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
    },
    title: {
      fontFamily: 'Yellowtail_400Regular',
      fontSize: 42,
      color: '#eab308',
      lineHeight: 56,
      paddingHorizontal: 8,
      textAlign: 'center',
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 40,
    },
    cardsContainer: {
      gap: 20,
    },
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 24,
      borderWidth: 3,
      borderColor: theme.cardBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    cardSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primary,
    },
    cardEmoji: {
      fontSize: 48,
      textAlign: 'center',
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: 12,
    },
    cardDescription: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 16,
    },
    exampleContainer: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 3,
      borderLeftColor: theme.primary,
    },
    exampleLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    exampleText: {
      fontSize: 14,
      color: theme.textPrimary,
      lineHeight: 20,
      fontStyle: 'italic',
    },
    loader: {
      marginTop: 16,
    },
  });
