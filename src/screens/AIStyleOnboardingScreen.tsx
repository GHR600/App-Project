import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { updateUserAIStyle } from '../services/aiService';
import { supabase } from '../config/supabase';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width > 600 ? 280 : width * 0.42;

type AIStyle = 'coach' | 'reflector';

interface StyleOption {
  id: AIStyle;
  emoji: string;
  title: string;
  description: string;
  example: string;
}

const styleOptions: StyleOption[] = [
  {
    id: 'coach',
    emoji: '🎯',
    title: 'Coach',
    description: 'Strategic and direct. Helps you spot patterns and take action.',
    example: 'This is the third time you\'ve mentioned feeling overlooked. What would speaking up look like?',
  },
  {
    id: 'reflector',
    emoji: '🧘',
    title: 'Reflector',
    description: 'Thoughtful and curious. Gives you space to process and think clearly.',
    example: 'You\'re feeling stuck between two options. What part feels most important to sit with?',
  },
];

export default function AIStyleOnboardingScreen() {
  const navigation = useNavigation();
  const [selectedStyle, setSelectedStyle] = useState<AIStyle | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectStyle = async (style: AIStyle) => {
    setSelectedStyle(style);
    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      // Update AI style in backend
      const result = await updateUserAIStyle(style);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update AI style');
      }

      // Navigate to home screen after successful save
      // @ts-ignore - navigation types
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error saving AI style:', error);
      alert('Failed to save your preference. Please try again.');
      setSelectedStyle(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>How should I help you journal?</Text>
        <Text style={styles.subtitle}>You can change this anytime in Settings</Text>
      </View>

      <View style={styles.cardsContainer}>
        {styleOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.card,
              selectedStyle === option.id && styles.cardSelected,
            ]}
            onPress={() => handleSelectStyle(option.id)}
            disabled={loading}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <Text style={styles.emoji}>{option.emoji}</Text>
              <Text style={styles.cardTitle}>{option.title}</Text>
              <Text style={styles.cardDescription}>{option.description}</Text>
              <View style={styles.exampleContainer}>
                <Text style={styles.exampleLabel}>Example:</Text>
                <Text style={styles.exampleText}>"{option.example}"</Text>
              </View>
            </View>

            {loading && selectedStyle === option.id && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#4A90E2" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#3A3A3A',
  },
  cardSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#2A3A4A',
  },
  cardContent: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 15,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  exampleContainer: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  exampleLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 8,
    fontWeight: '600',
  },
  exampleText: {
    fontSize: 14,
    color: '#AAAAAA',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
