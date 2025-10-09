import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
} from '../services/subscriptionService';
import type { PurchasesPackage } from 'react-native-purchases';

interface SubscriptionPaywallScreenProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

export const SubscriptionPaywallScreen: React.FC<SubscriptionPaywallScreenProps> = ({
  onBack,
  onSuccess
}) => {
  const { theme } = useTheme();
  const { refresh: refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [packages, setPackages] = useState<{
    monthly?: PurchasesPackage;
    annual?: PurchasesPackage;
  }>({});

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      setLoading(true);
      const offerings = await getOfferings();

      if (offerings?.current) {
        const availablePackages = offerings.current.availablePackages;

        // Find monthly and annual packages
        const monthly = availablePackages.find(
          (pkg) => pkg.identifier === '$rc_monthly' || pkg.packageType === 'MONTHLY'
        );
        const annual = availablePackages.find(
          (pkg) => pkg.identifier === '$rc_annual' || pkg.packageType === 'ANNUAL'
        );

        setPackages({ monthly, annual });
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
      Alert.alert(
        'Error',
        'Failed to load subscription options. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    try {
      setPurchasing(true);

      const result = await purchasePackage(pkg);

      if (result.success) {
        // Refresh subscription status
        await refreshSubscription();

        Alert.alert(
          'Success!',
          'Welcome to Premium! You now have unlimited AI access.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (onSuccess) {
                  onSuccess();
                } else if (onBack) {
                  onBack();
                }
              },
            },
          ]
        );
      } else if (result.error !== 'Purchase cancelled') {
        Alert.alert('Purchase Failed', result.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Failed to complete purchase. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setPurchasing(true);

      const result = await restorePurchases();

      if (result.success) {
        await refreshSubscription();

        Alert.alert(
          'Restored!',
          'Your purchases have been restored successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (onBack) onBack();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any previous purchases to restore.'
        );
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (pkg?: PurchasesPackage) => {
    if (!pkg) return '...';
    return pkg.product.priceString;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={[styles.backButtonText, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Premium Subscription</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>💎 Unlock Premium</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Get unlimited AI access and advanced features
        </Text>

        <View style={styles.featuresContainer}>
          <View style={[styles.feature, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={styles.featureIcon}>💬</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>Unlimited AI Chat</Text>
              <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                Have unlimited conversations with your AI journaling companion
              </Text>
            </View>
          </View>

          <View style={[styles.feature, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={styles.featureIcon}>🧠</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>Advanced Pattern Recognition</Text>
              <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                Deep analysis of your journal patterns and personalized insights
              </Text>
            </View>
          </View>

          <View style={[styles.feature, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={styles.featureIcon}>📊</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>Detailed Analytics</Text>
              <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                Track mood trends, writing patterns, and emotional growth over time
              </Text>
            </View>
          </View>

          <View style={[styles.feature, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={styles.featureIcon}>⚡</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>Faster AI Responses</Text>
              <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                Premium users get access to our most advanced AI model (Claude Sonnet)
              </Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading subscription options...
            </Text>
          </View>
        ) : (
          <View style={styles.pricingContainer}>
            {packages.annual && (
              <View style={[styles.planCard, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}>
                <View style={[styles.popularBadge, { backgroundColor: theme.primary }]}>
                  <Text style={[styles.popularText, { color: theme.white }]}>Best Value</Text>
                </View>
                <Text style={[styles.planTitle, { color: theme.textPrimary }]}>Annual Plan</Text>
                <Text style={[styles.price, { color: theme.textPrimary }]}>
                  {formatPrice(packages.annual)}
                </Text>
                <Text style={[styles.savings, { color: theme.success }]}>Save 33%</Text>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                  onPress={() => handlePurchase(packages.annual!)}
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <ActivityIndicator color={theme.white} />
                  ) : (
                    <Text style={[styles.primaryButtonText, { color: theme.white }]}>
                      Start Annual Plan
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {packages.monthly && (
              <View style={[styles.planCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                <Text style={[styles.planTitle, { color: theme.textPrimary }]}>Monthly Plan</Text>
                <Text style={[styles.price, { color: theme.textPrimary }]}>
                  {formatPrice(packages.monthly)}
                </Text>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: theme.primary, backgroundColor: 'transparent' }]}
                  onPress={() => handlePurchase(packages.monthly!)}
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <ActivityIndicator color={theme.primary} />
                  ) : (
                    <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
                      Start Monthly Plan
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <Text style={[styles.trialInfo, { color: theme.textSecondary }]}>
          Cancel anytime • No commitments
        </Text>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={purchasing}
        >
          <Text style={[styles.restoreText, { color: theme.primary }]}>Restore Purchases</Text>
        </TouchableOpacity>

        {onBack && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onBack}
            disabled={purchasing}
          >
            <Text style={[styles.continueText, { color: theme.textSecondary }]}>
              Continue with free version
            </Text>
          </TouchableOpacity>
        )}
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
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  continueButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  continueText: {
    fontSize: 14,
  },
});
