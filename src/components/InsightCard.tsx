import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { colors, typography, components } from '../styles/designSystem';
import { AIInsight } from '../services/aiInsightService';

interface InsightCardProps {
  insight: AIInsight;
  compact?: boolean;
  onPress?: () => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  compact = false,
  onPress
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown Date';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const ContainerComponent = onPress ? TouchableOpacity : View;

  return (
    <ContainerComponent
      style={[
        styles.container,
        compact && styles.compactContainer
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✨</Text>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Personal Insight</Text>
            {insight.isPremium && (
              <Text style={styles.premiumBadge}>Premium</Text>
            )}
          </View>
          <Text style={styles.timestamp}>{formatDate(insight.createdAt)}</Text>
        </View>
        <View style={styles.confidenceIndicator}>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceProgress,
                { width: `${insight.confidence * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.confidenceText}>
            {Math.round(insight.confidence * 100)}%
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.insightText}>
          {compact
            ? truncateText(insight.insight, 120)
            : insight.insight
          }
        </Text>

        {!compact && (
          <View style={styles.followUpSection}>
            <Text style={styles.followUpTitle}>💭 Reflection</Text>
            <Text style={styles.followUpQuestion}>{insight.followUpQuestion}</Text>
          </View>
        )}
      </View>

      {compact && onPress && (
        <View style={styles.expandPrompt}>
          <Text style={styles.expandText}>Tap to view full insight</Text>
        </View>
      )}
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: components.card.borderRadius,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 20,
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
  compactContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  title: {
    fontFamily: typography.body.fontFamily,
    fontWeight: 'bold',
    fontSize: typography.body.fontSize,
    color: colors.gray900,
    marginRight: 8,
  },
  premiumBadge: {
    backgroundColor: colors.secondary,
    color: colors.white,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  timestamp: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.gray500,
  },
  confidenceIndicator: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  confidenceBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceProgress: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 2,
  },
  confidenceText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.gray500,
    fontWeight: 'bold',
  },
  content: {
    marginBottom: 0,
  },
  insightText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: 24,
    color: colors.gray800,
    marginBottom: 16,
  },
  followUpSection: {
    backgroundColor: colors.gray500 || '#f9fafb',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  followUpTitle: {
    fontFamily: typography.body.fontFamily,
    fontWeight: 'bold',
    fontSize: typography.caption.fontSize,
    color: colors.gray700,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  followUpQuestion: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.primary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  expandPrompt: {
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  expandText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.gray500,
    fontStyle: 'italic',
  },
});