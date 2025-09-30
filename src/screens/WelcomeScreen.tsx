import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { components } from '../styles/designSystem';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
  onSignIn
}) => {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <View style={styles.iconContainer}>
            <Text style={styles.mainIcon}>📔</Text>
          </View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Welcome to Mindful</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your personal AI-powered journaling companion that helps you understand your thoughts,
            track your mood, and discover meaningful insights about your daily life.
          </Text>
        </View>

        <View style={styles.features}>
          <View style={[styles.feature, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={styles.featureIcon}>🧠</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>Personalized Insights</Text>
              <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                Get thoughtful, AI-generated insights tailored to your writing and focus areas
              </Text>
            </View>
          </View>

          <View style={[styles.feature, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={styles.featureIcon}>📊</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>Mood Tracking</Text>
              <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                Track your emotional patterns and discover what influences your wellbeing
              </Text>
            </View>
          </View>

          <View style={[styles.feature, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={styles.featureIcon}>🎯</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>Daily Prompts</Text>
              <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                Receive personalized reflection questions based on your interests and goals
              </Text>
            </View>
          </View>

          <View style={[styles.feature, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={styles.featureIcon}>🔒</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>Privacy First</Text>
              <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                Your thoughts stay private and secure with end-to-end encryption
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={onGetStarted} style={[styles.primaryButton, { backgroundColor: theme.primary }]}>
            <Text style={[styles.primaryButtonText, { color: theme.white }]}>Get Started Free</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSignIn} style={[styles.secondaryButton, { borderColor: theme.primary, backgroundColor: theme.surface }]}>
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>I Already Have an Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            Start with 3 free AI insights • No credit card required
          </Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
    maxWidth: 600,
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  mainIcon: {
    fontSize: 64,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
  },
  features: {
    marginBottom: 48,
    width: '100%',
    maxWidth: 800,
  },
  feature: {
    borderRadius: components.card.borderRadius,
    borderWidth: 1,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: components.button.borderRadius,
    height: components.button.height,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderWidth: 2,
    borderRadius: components.button.borderRadius,
    height: components.button.height,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
});