import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface SubscriptionPaywallScreenProps {
  onBack?: () => void;
}

export const SubscriptionPaywallScreen: React.FC<SubscriptionPaywallScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={[styles.backButtonText, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Premium Subscription</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>💎 Unlock Premium Features</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Get personalized AI insights and advanced pattern recognition
        </Text>

        <View style={styles.featuresContainer}>
          <View style={[styles.feature, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={styles.featureIcon}>🧠</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>Advanced AI Insights</Text>
              <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                Deep analysis of your journal patterns and personalized recommendations
              </Text>
            </View>
          </View>

          <View style={[styles.feature, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={styles.featureIcon}>📊</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>Mood Pattern Recognition</Text>
              <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                Track emotional trends and identify triggers over time
              </Text>
            </View>
          </View>

          <View style={[styles.feature, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={styles.featureIcon}>🎯</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>Personalized Prompts</Text>
              <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                Tailored reflection questions based on your focus areas
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.pricingContainer}>
          <View style={[styles.planCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={[styles.popularBadge, { backgroundColor: theme.primary }]}>
              <Text style={[styles.popularText, { color: theme.white }]}>Most Popular</Text>
            </View>
            <Text style={[styles.planTitle, { color: theme.textPrimary }]}>Yearly Plan</Text>
            <Text style={[styles.price, { color: theme.textPrimary }]}>$99/year</Text>
            <Text style={[styles.savings, { color: theme.success }]}>Save 62%</Text>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary }]}>
              <Text style={[styles.primaryButtonText, { color: theme.white }]}>Start Free Trial</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.planCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.planTitle, { color: theme.textPrimary }]}>Weekly Plan</Text>
            <Text style={[styles.price, { color: theme.textPrimary }]}>$4.99/week</Text>
            <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.primary, backgroundColor: 'transparent' }]}>
              <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Try Premium</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.trialInfo, { color: theme.textSecondary }]}>7-day free trial • Cancel anytime</Text>
        <TouchableOpacity style={styles.restoreButton}>
          <Text style={[styles.restoreText, { color: theme.primary }]}>Restore Purchases</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  pricingContainer: {
    gap: 16,
    marginBottom: 32,
  },
  planCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  popularText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  savings: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  primaryButton: {
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  trialInfo: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  restoreButton: {
    alignItems: 'center',
    padding: 16,
  },
  restoreText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
