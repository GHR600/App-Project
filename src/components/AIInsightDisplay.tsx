import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing
} from 'react-native';
import { colors, typography, components } from '../styles/designSystem';
import { AIInsightService, AIInsight, JournalEntry, UserContext } from '../services/aiInsightService';

interface AIInsightDisplayProps {
  journalEntry: JournalEntry;
  userContext: UserContext;
  recentEntries?: JournalEntry[];
  onInsightGenerated?: (insight: AIInsight) => void;
  onPaywallRequired?: () => void;
}

export const AIInsightDisplay: React.FC<AIInsightDisplayProps> = ({
  journalEntry,
  userContext,
  recentEntries = [],
  onInsightGenerated,
  onPaywallRequired
}) => {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateInsight();
  }, [journalEntry.id]);

  const generateInsight = async () => {
    setLoading(true);
    setError(null);

    try {
      const generatedInsight = await AIInsightService.generateInsight(
        journalEntry,
        userContext,
        recentEntries
      );

      setInsight(generatedInsight);

      // Increment free insight count for non-premium users
      if (userContext.subscriptionStatus === 'free') {
        AIInsightService.incrementFreeInsightCount();
      }

      onInsightGenerated?.(generatedInsight);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate insight';

      if (errorMessage.includes('Premium subscription required')) {
        onPaywallRequired?.();
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateInsight = () => {
    generateInsight();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.loadingIcon}>🧠</Text>
          </View>
          <Text style={styles.title}>Generating Your Insight...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBar}>
            <View style={styles.loadingProgress} />
          </View>
          <Text style={styles.loadingText}>Analyzing your journal entry</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRegenerateInsight} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!insight) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.insightIcon}>✨</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Your Personal Insight</Text>
          {insight.isPremium && (
            <Text style={styles.premiumBadge}>Premium</Text>
          )}
        </View>
      </View>

      <View style={styles.insightContent}>
        <Text style={styles.insightText}>{insight.insight}</Text>
      </View>

      <View style={styles.followUpSection}>
        <Text style={styles.followUpTitle}>Reflection Question</Text>
        <Text style={styles.followUpQuestion}>{insight.followUpQuestion}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceLabel}>Insight confidence:</Text>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceProgress,
                { width: `${insight.confidence * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.confidenceValue}>{Math.round(insight.confidence * 100)}%</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={handleRegenerateInsight} style={styles.regenerateButton}>
            <Text style={styles.regenerateButtonText}>🔄 New Insight</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!insight.isPremium && (
        <View style={styles.upgradePrompt}>
          <Text style={styles.upgradeText}>
            Want deeper insights with pattern analysis?{' '}
            <Text onPress={onPaywallRequired} style={styles.upgradeLink}>
              Upgrade to Premium
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: components.card.borderRadius,
    backgroundColor: colors.white,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  insightIcon: {
    fontSize: 24,
  },
  loadingIcon: {
    fontSize: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontFamily: typography.heading.fontFamily,
    fontWeight: typography.heading.fontWeight as any,
    fontSize: typography.heading.fontSize,
    color: colors.gray900,
    marginRight: 12,
  },
  premiumBadge: {
    backgroundColor: colors.secondary,
    color: colors.white,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    fontSize: typography.caption.fontSize,
    fontWeight: 'bold',
  },
  insightContent: {
    backgroundColor: colors.gray100,
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  insightText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: 24,
    color: colors.gray800,
  },
  followUpSection: {
    marginBottom: 24,
  },
  followUpTitle: {
    fontFamily: typography.body.fontFamily,
    fontWeight: 'bold',
    fontSize: typography.body.fontSize,
    color: colors.gray900,
    marginBottom: 8,
  },
  followUpQuestion: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.primary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: 16,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  confidenceLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.gray600,
    marginRight: 8,
  },
  confidenceBar: {
    width: 80,
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  confidenceProgress: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  confidenceValue: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.gray600,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  regenerateButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: components.button.borderRadius,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  regenerateButtonText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.gray700,
  },
  upgradePrompt: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.gray100,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.gray600,
    textAlign: 'center',
  },
  upgradeLink: {
    color: colors.primary,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  loadingProgress: {
    width: '60%',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  loadingText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.gray600,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: components.button.borderRadius,
    height: components.button.height,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: 'bold',
    color: colors.white,
  },
});