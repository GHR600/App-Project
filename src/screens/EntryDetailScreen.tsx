import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { colors, typography, components } from '../styles/designSystem';
import { DatabaseJournalEntry } from '../config/supabase';
import { AIInsightService, AIInsight } from '../services/aiInsightService';

interface EntryDetailScreenProps {
  entry: DatabaseJournalEntry;
  userId: string;
  onBack: () => void;
  onEdit?: () => void;
}

export const EntryDetailScreen: React.FC<EntryDetailScreenProps> = ({
  entry,
  userId,
  onBack,
  onEdit
}) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        console.log('EntryDetailScreen entry object:', { id: entry.id, hasId: !!entry.id, entryKeys: Object.keys(entry) });
        if (!entry?.id) {
          console.warn('Entry ID is undefined, skipping insights fetch');
          return;
        }
        const { insights: entryInsights, error } = await AIInsightService.getInsightsForEntry(userId, entry.id);
        if (!error) {
          setInsights(entryInsights);
        }
      } catch (error) {
        console.error('Error loading insights:', error);
      } finally {
        setLoadingInsights(false);
      }
    };

    loadInsights();
  }, [userId, entry?.id]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Time';

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getMoodText = (rating: number | null | undefined) => {
    if (!rating) return 'No mood recorded';
    switch (rating) {
      case 1: return 'Very Low 😢';
      case 2: return 'Low 😕';
      case 3: return 'Neutral 😐';
      case 4: return 'Good 😊';
      case 5: return 'Great 😄';
      default: return 'Unknown';
    }
  };

  const getMoodColor = (rating: number | null | undefined) => {
    if (!rating) return colors.gray500;
    switch (rating) {
      case 1: return colors.error;
      case 2: return colors.warning;
      case 3: return colors.gray600;
      case 4: return colors.success;
      case 5: return colors.primary;
      default: return colors.gray500;
    }
  };

  const getMoodBadgeBgColor = (rating: number | null | undefined) => {
    // Use RGBA for transparency instead of string concatenation
    const color = getMoodColor(rating);
    switch (color) {
      case colors.error: return 'rgba(220, 38, 38, 0.125)';      // error (red-600)
      case colors.warning: return 'rgba(251, 191, 36, 0.125)';   // warning (yellow-400)
      case colors.gray600: return 'rgba(75, 85, 99, 0.125)';     // gray-600
      case colors.success: return 'rgba(16, 185, 129, 0.125)';   // success (emerald-500)
      case colors.primary: return 'rgba(59, 130, 246, 0.125)';   // primary (blue-500)
      default: return 'rgba(107, 114, 128, 0.125)';              // gray-500
    }
  };

  const getPrimaryAlpha = (alpha: number) => {
    // Helper for primary color with alpha (assumes blue-500)
    return `rgba(59, 130, 246, ${alpha})`;
  };

  const wordCount = entry.word_count ?? (entry.content ? entry.content.split(' ').filter(word => word.length > 0).length : 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Entry</Text>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryDate}>{formatDate(entry.created_at)}</Text>
          <Text style={styles.entryTime}>{formatTime(entry.created_at)}</Text>
        </View>

        <View style={styles.entryMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Mood</Text>
            <View style={[styles.moodBadge, { backgroundColor: getMoodBadgeBgColor(entry.mood_rating ?? null) }]}>
              <Text style={[styles.moodText, { color: getMoodColor(entry.mood_rating ?? null) }]}>
                {getMoodText(entry.mood_rating ?? null)}
              </Text>
            </View>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Word Count</Text>
            <Text style={styles.metaValue}>{wordCount} words</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.contentLabel}>Entry Content</Text>
          <View style={styles.contentBox}>
            <Text style={styles.contentText}>{entry.content}</Text>
          </View>
        </View>

        {entry.voice_memo_url && (
          <View style={styles.voiceMemoContainer}>
            <Text style={styles.voiceMemoLabel}>Voice Memo</Text>
            <View style={[
              styles.voiceMemoBox,
              {
                backgroundColor: getPrimaryAlpha(0.0625), // 0.0625 ≈ 10/160
                borderColor: getPrimaryAlpha(0.188),      // 0.188 ≈ 30/160
              }
            ]}>
              <Text style={styles.voiceMemoText}>🎙️ Voice memo available</Text>
              <Text style={styles.voiceMemoNote}>Voice playback not implemented yet</Text>
            </View>
          </View>
        )}

        {!loadingInsights && insights.length > 0 && (
          <View style={styles.insightsContainer}>
            <Text style={styles.insightsLabel}>AI Insights</Text>
            {insights.map((insight) => (
              <View key={insight.id} style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightIcon}>🧠</Text>
                  <View style={styles.insightMeta}>
                    <Text style={styles.insightDate}>
                      {insight.createdAt ? (() => {
                        const date = new Date(insight.createdAt);
                        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                      })() : ''}
                    </Text>
                    {insight.isPremium && (
                      <Text style={[
                        styles.premiumBadge,
                        { backgroundColor: getPrimaryAlpha(0.125) }
                      ]}>PREMIUM</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.insightText}>{insight.insight}</Text>
                <View style={styles.followUpContainer}>
                  <Text style={styles.followUpLabel}>Follow-up Question:</Text>
                  <Text style={styles.followUpText}>{insight.followUpQuestion}</Text>
                </View>
                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidenceLabel}>
                    Confidence: {insight.confidence ? Math.round(insight.confidence * 100) : 0}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.timestampContainer}>
          <Text style={styles.timestampText}>
            Created: {entry.created_at ? new Date(entry.created_at).toLocaleString() : ''}
          </Text>
          {entry.updated_at && entry.updated_at !== entry.created_at && (
            <Text style={styles.timestampText}>
              Updated: {new Date(entry.updated_at).toLocaleString()}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    padding: 8,
    minWidth: 60,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray900,
  },
  editButton: {
    padding: 8,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  entryHeader: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: colors.white,
    padding: 20,
    ...(components.card || {}),
  },
  entryDate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 4,
  },
  entryTime: {
    fontSize: 16,
    color: colors.gray600,
  },
  entryMeta: {
    backgroundColor: colors.white,
    padding: 20,
    marginBottom: 20,
    ...(components.card || {}),
  },
  metaItem: {
    marginBottom: 16,
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray600,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moodBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  moodText: {
    fontSize: 16,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 16,
    color: colors.gray800,
    fontWeight: '500',
  },
  contentContainer: {
    backgroundColor: colors.white,
    padding: 20,
    marginBottom: 20,
    ...(components.card || {}),
  },
  contentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray600,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentBox: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray800,
    fontFamily: typography.body?.fontFamily ?? 'System',
  },
  voiceMemoContainer: {
    backgroundColor: colors.white,
  voiceMemoContainer: {
    backgroundColor: colors.white,
    padding: 20,
    marginBottom: 20,
    ...(components.card || {}),
  },
    fontWeight: '600',
    color: colors.gray600,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  voiceMemoBox: {
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  voiceMemoText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  voiceMemoNote: {
    fontSize: 12,
    color: colors.gray600,
    fontStyle: 'italic',
  },
  insightsContainer: {
    backgroundColor: colors.white,
    borderRadius: components.card?.borderRadius ?? 12,
  insightsContainer: {
    backgroundColor: colors.white,
    padding: 20,
    marginBottom: 20,
    ...(components.card || {}),
  },
    color: colors.gray600,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightCard: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  insightMeta: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightDate: {
    fontSize: 12,
    color: colors.gray600,
  },
  premiumBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  insightText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray800,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  followUpContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  followUpLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray600,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  followUpText: {
    fontSize: 14,
    color: colors.gray700,
    lineHeight: 20,
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceLabel: {
    fontSize: 11,
    color: colors.gray500,
    fontWeight: '500',
  },
  timestampContainer: {
    backgroundColor: colors.white,
    borderRadius: components.card?.borderRadius ?? 12,
    padding: 16,
  timestampContainer: {
    backgroundColor: colors.white,
    padding: 16,
    ...(components.card || {}),
  },
  },
});