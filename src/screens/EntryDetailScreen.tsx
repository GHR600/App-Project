import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography, components } from '../styles/designSystem';
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
  const { theme } = useTheme();
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
    if (!rating) return theme.textMuted;
    switch (rating) {
      case 1: return theme.error;
      case 2: return theme.warning;
      case 3: return theme.textSecondary;
      case 4: return theme.success;
      case 5: return theme.primary;
      default: return theme.textMuted;
    }
  };

  const getMoodBadgeBgColor = (rating: number | null | undefined) => {
    if (!rating) return theme.textMuted + '20';
    switch (rating) {
      case 1: return theme.error + '20';
      case 2: return theme.warning + '20';
      case 3: return theme.textSecondary + '20';
      case 4: return theme.success + '20';
      case 5: return theme.primary + '20';
      default: return theme.textMuted + '20';
    }
  };

  const wordCount = entry.word_count ?? (entry.content ? entry.content.split(' ').filter(word => word.length > 0).length : 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Entry</Text>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editButton}>
            <Text style={[styles.editButtonText, { color: theme.primary }]}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.entryHeader, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.entryDate, { color: theme.textPrimary }]}>{formatDate(entry.created_at)}</Text>
          <Text style={[styles.entryTime, { color: theme.textSecondary }]}>{formatTime(entry.created_at)}</Text>
        </View>

        <View style={[styles.entryMeta, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Mood</Text>
            <View style={[styles.moodBadge, { backgroundColor: getMoodBadgeBgColor(entry.mood_rating ?? null) }]}>
              <Text style={[styles.moodText, { color: getMoodColor(entry.mood_rating ?? null) }]}>
                {getMoodText(entry.mood_rating ?? null)}
              </Text>
            </View>
          </View>

          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Word Count</Text>
            <Text style={[styles.metaValue, { color: theme.textPrimary }]}>{wordCount} words</Text>
          </View>
        </View>

        <View style={[styles.contentContainer, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.contentLabel, { color: theme.textSecondary }]}>Entry Content</Text>
          <View style={[styles.contentBox, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            <Text style={[styles.contentText, { color: theme.textPrimary }]}>{entry.content}</Text>
          </View>
        </View>

        {entry.voice_memo_url && (
          <View style={[styles.voiceMemoContainer, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.voiceMemoLabel, { color: theme.textSecondary }]}>Voice Memo</Text>
            <View style={[
              styles.voiceMemoBox,
              {
                backgroundColor: theme.primary + '10',
                borderColor: theme.primary + '30',
              }
            ]}>
              <Text style={[styles.voiceMemoText, { color: theme.primary }]}>🎙️ Voice memo available</Text>
              <Text style={[styles.voiceMemoNote, { color: theme.textSecondary }]}>Voice playback not implemented yet</Text>
            </View>
          </View>
        )}

        {!loadingInsights && insights.length > 0 && (
          <View style={[styles.insightsContainer, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.insightsLabel, { color: theme.textSecondary }]}>AI Insights</Text>
            {insights.map((insight) => (
              <View key={insight.id} style={[styles.insightCard, { backgroundColor: theme.surface, borderLeftColor: theme.primary }]}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightIcon}>🧠</Text>
                  <View style={styles.insightMeta}>
                    <Text style={[styles.insightDate, { color: theme.textSecondary }]}>
                      {insight.createdAt ? (() => {
                        const date = new Date(insight.createdAt);
                        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                      })() : ''}
                    </Text>
                    {insight.isPremium && (
                      <Text style={[
                        styles.premiumBadge,
                        { backgroundColor: theme.primary + '20', color: theme.primary }
                      ]}>PREMIUM</Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.insightText, { color: theme.textPrimary }]}>{insight.insight}</Text>
                <View style={[styles.followUpContainer, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.followUpLabel, { color: theme.textSecondary }]}>Follow-up Question:</Text>
                  <Text style={[styles.followUpText, { color: theme.textPrimary }]}>{insight.followUpQuestion}</Text>
                </View>
                <View style={styles.confidenceContainer}>
                  <Text style={[styles.confidenceLabel, { color: theme.textMuted }]}>
                    Confidence: {insight.confidence ? Math.round(insight.confidence * 100) : 0}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.timestampContainer, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.timestampText, { color: theme.textSecondary }]}>
            Created: {entry.created_at ? new Date(entry.created_at).toLocaleString() : ''}
          </Text>
          {entry.updated_at && entry.updated_at !== entry.created_at && (
            <Text style={[styles.timestampText, { color: theme.textSecondary }]}>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    minWidth: 60,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontFamily: 'Yellowtail_400Regular',
    fontSize: 32,
    color: '#eab308',
    lineHeight: 44,
    paddingHorizontal: 4,
  },
  editButton: {
    padding: 8,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  editButtonText: {
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
    padding: 20,
    ...(components.card || {}),
  },
  entryDate: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  entryTime: {
    fontSize: 16,
  },
  entryMeta: {
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
    fontWeight: '500',
  },
  contentContainer: {
    padding: 20,
    marginBottom: 20,
    ...(components.card || {}),
  },
  contentLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentBox: {
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
  },
  voiceMemoContainer: {
    padding: 20,
    marginBottom: 20,
    ...(components.card || {}),
  },
  voiceMemoLabel: {
    fontSize: 14,
    fontWeight: '600',
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
    fontWeight: '600',
    marginBottom: 4,
  },
  voiceMemoNote: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  insightsContainer: {
    padding: 20,
    marginBottom: 20,
    ...(components.card || {}),
  },
  insightsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
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
  },
  premiumBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  insightText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  followUpContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  followUpLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  followUpText: {
    fontSize: 14,
    lineHeight: 20,
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  timestampContainer: {
    padding: 16,
    ...(components.card || {}),
  },
  timestampText: {
    fontSize: 12,
    marginBottom: 4,
  },
});