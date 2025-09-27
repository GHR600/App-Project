import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { colors, typography, components } from '../styles/designSystem';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
  onSignIn
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <View style={styles.iconContainer}>
            <Text style={styles.mainIcon}>📔</Text>
          </View>
          <Text style={styles.title}>Welcome to Mindful</Text>
          <Text style={styles.subtitle}>
            Your personal AI-powered journaling companion that helps you understand your thoughts,
            track your mood, and discover meaningful insights about your daily life.
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🧠</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Personalized Insights</Text>
              <Text style={styles.featureDescription}>
                Get thoughtful, AI-generated insights tailored to your writing and focus areas
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📊</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Mood Tracking</Text>
              <Text style={styles.featureDescription}>
                Track your emotional patterns and discover what influences your wellbeing
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🎯</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Daily Prompts</Text>
              <Text style={styles.featureDescription}>
                Receive personalized reflection questions based on your interests and goals
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🔒</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Privacy First</Text>
              <Text style={styles.featureDescription}>
                Your thoughts stay private and secure with end-to-end encryption
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={onGetStarted} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Get Started Free</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSignIn} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>I Already Have an Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
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
    backgroundColor: colors.gray500 || '#f9fafb',
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
    fontFamily: typography.heading.fontFamily,
    fontWeight: typography.heading.fontWeight as any,
    fontSize: 32,
    color: colors.gray900,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 18,
    lineHeight: 28,
    color: colors.gray600,
    textAlign: 'center',
  },
  features: {
    marginBottom: 48,
    width: '100%',
    maxWidth: 800,
  },
  feature: {
    backgroundColor: colors.white,
    borderRadius: components.card.borderRadius,
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
    fontFamily: typography.body.fontFamily,
    fontWeight: 'bold',
    fontSize: typography.body.fontSize,
    color: colors.gray900,
    marginBottom: 8,
  },
  featureDescription: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.gray600,
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: components.button.borderRadius,
    height: components.button.height,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: 'bold',
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
    borderWidth: 2,
    borderRadius: components.button.borderRadius,
    height: components.button.height,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: 'bold',
    color: colors.primary,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.gray500,
    textAlign: 'center',
  },
});