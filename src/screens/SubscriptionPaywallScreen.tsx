import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';

interface SubscriptionPaywallScreenProps {
  onBack?: () => void;
}

export const SubscriptionPaywallScreen: React.FC<SubscriptionPaywallScreenProps> = ({ onBack }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Premium Subscription</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>💎 Unlock Premium Features</Text>
        <Text style={styles.subtitle}>
          Get personalized AI insights and advanced pattern recognition
        </Text>

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🧠</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Advanced AI Insights</Text>
              <Text style={styles.featureDescription}>
                Deep analysis of your journal patterns and personalized recommendations
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📊</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Mood Pattern Recognition</Text>
              <Text style={styles.featureDescription}>
                Track emotional trends and identify triggers over time
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🎯</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Personalized Prompts</Text>
              <Text style={styles.featureDescription}>
                Tailored reflection questions based on your focus areas
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.pricingContainer}>
          <View style={styles.planCard}>
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>Most Popular</Text>
            </View>
            <Text style={styles.planTitle}>Yearly Plan</Text>
            <Text style={styles.price}>$99/year</Text>
            <Text style={styles.savings}>Save 62%</Text>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Start Free Trial</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.planCard}>
            <Text style={styles.planTitle}>Weekly Plan</Text>
            <Text style={styles.price}>$4.99/week</Text>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Try Premium</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.trialInfo}>7-day free trial • Cancel anytime</Text>
        <TouchableOpacity style={styles.restoreButton}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    color: '#2563eb',
    fontWeight: '500',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
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
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
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
    color: '#1f2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  pricingContainer: {
    gap: 16,
    marginBottom: 32,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 12,
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
    backgroundColor: '#2563eb',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  popularText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    marginTop: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  savings: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#2563eb',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  trialInfo: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  restoreButton: {
    alignItems: 'center',
    padding: 16,
  },
  restoreText: {
    color: '#2563eb',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
