import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  TextInput,
  Alert
} from 'react-native';
import { colors, typography, components } from '../styles/designSystem';
import { JournalEntryWithInsights } from '../services/journalService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DailyCardProps {
  entry: JournalEntryWithInsights;
  onPress?: () => void;
  onEdit?: (entryId: string, newContent: string) => void;
  onChatMessage?: (entryId: string, message: string) => void;
  isExpanded?: boolean;
  onExpandToggle?: (entryId: string) => void;
}

interface ExpandableSectionProps {
  title: string;
  icon: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string | number;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
  badge
}) => {
  const toggleSection = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  return (
    <View style={styles.expandableSection}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={toggleSection}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionIcon}>{icon}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <View style={[
          styles.chevron,
          isExpanded && styles.chevronExpanded
        ]}>
          <Text style={styles.chevronText}>›</Text>
        </View>
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.sectionContent}>
          {children}
        </View>
      )}
    </View>
  );
};

export const DailyCard: React.FC<DailyCardProps> = ({
  entry,
  onPress,
  onEdit,
  onChatMessage,
  isExpanded = false,
  onExpandToggle
}) => {
  const [expandedSections, setExpandedSections] = useState<{
    journal: boolean;
    insights: boolean;
    chat: boolean;
  }>({
    journal: false,
    insights: false,
    chat: false
  });

  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(entry.content);
  const [chatMessage, setChatMessage] = useState('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const getMoodEmoji = (rating: number | null) => {
    if (!rating) return '😐';
    switch (rating) {
      case 1: return '😢';
      case 2: return '😕';
      case 3: return '😐';
      case 4: return '😊';
      case 5: return '😄';
      default: return '😐';
    }
  };

  const getPreviewText = (content: string, maxLength = 120) => {
    const lines = content.split('\n');
    const firstTwoLines = lines.slice(0, 2).join(' ');
    return firstTwoLines.length > maxLength
      ? `${firstTwoLines.substring(0, maxLength)}...`
      : firstTwoLines;
  };

  const toggleSection = (section: 'journal' | 'insights' | 'chat') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSaveEdit = async () => {
    if (onEdit && editedContent.trim() !== entry.content) {
      onEdit(entry.id, editedContent.trim());
    }
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(entry.content);
    setEditMode(false);
  };

  const handleSendMessage = () => {
    if (onChatMessage && chatMessage.trim()) {
      onChatMessage(entry.id, chatMessage.trim());
      setChatMessage('');
    }
  };

  const handleCardPress = () => {
    if (onExpandToggle) {
      onExpandToggle(entry.id);
    } else if (onPress) {
      onPress();
    }
  };

  const insightsCount = entry.ai_insights?.length || 0;
  const wordCount = entry.word_count || entry.content.split(' ').filter(word => word.length > 0).length;

  return (
    <View style={[styles.container, isExpanded && styles.expandedContainer]}>
      {/* Card Header */}
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={handleCardPress}
        activeOpacity={0.8}
      >
        <View style={styles.headerTop}>
          <Text style={styles.date}>{formatDate(entry.created_at)}</Text>
          <View style={styles.moodContainer}>
            <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood_rating)}</Text>
            {entry.mood_rating && (
              <Text style={styles.moodText}>{entry.mood_rating}/5</Text>
            )}
          </View>
        </View>

        <Text style={styles.preview} numberOfLines={isExpanded ? undefined : 2}>
          {getPreviewText(entry.content, isExpanded ? 1000 : 120)}
        </Text>

        <View style={styles.headerFooter}>
          <View style={styles.footerLeft}>
            <Text style={styles.wordCount}>{wordCount} words</Text>
            {insightsCount > 0 && (
              <Text style={styles.insightCount}>• {insightsCount} insight{insightsCount !== 1 ? 's' : ''}</Text>
            )}
          </View>
          {!isExpanded && (
            <Text style={styles.expandHint}>Tap to expand →</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Expandable Sections */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Journal Entry Section */}
          <ExpandableSection
            title="Journal Entry"
            icon="📝"
            isExpanded={expandedSections.journal}
            onToggle={() => toggleSection('journal')}
            badge={`${wordCount} words`}
          >
            {editMode ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editedContent}
                  onChangeText={setEditedContent}
                  multiline
                  placeholder="Write your thoughts..."
                  placeholderTextColor={colors.gray400}
                />
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={[styles.editButton, styles.cancelButton]}
                    onPress={handleCancelEdit}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editButton, styles.saveButton]}
                    onPress={handleSaveEdit}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.journalContent}>
                <Text style={styles.fullContent}>{entry.content}</Text>
                <TouchableOpacity
                  style={styles.editTrigger}
                  onPress={() => setEditMode(true)}
                >
                  <Text style={styles.editTriggerText}>✏️ Edit entry</Text>
                </TouchableOpacity>
              </View>
            )}
          </ExpandableSection>

          {/* AI Insights Section */}
          {insightsCount > 0 && (
            <ExpandableSection
              title="AI Insights"
              icon="🧠"
              isExpanded={expandedSections.insights}
              onToggle={() => toggleSection('insights')}
              badge={insightsCount}
            >
              <View style={styles.insightsContainer}>
                {entry.ai_insights?.map((insight, index) => (
                  <View key={insight.id || index} style={styles.insightCard}>
                    <View style={styles.insightHeader}>
                      <Text style={styles.insightIcon}>✨</Text>
                      <View style={styles.insightMeta}>
                        <Text style={styles.insightDate}>
                          {insight.created_at ? (() => {
                            const date = new Date(insight.created_at);
                            return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                          })() : 'Unknown Date'}
                        </Text>
                        {insight.is_premium && (
                          <Text style={styles.premiumBadge}>PREMIUM</Text>
                        )}
                      </View>
                    </View>
                    <Text style={styles.insightText}>{insight.insight_text}</Text>
                    {insight.follow_up_question && (
                      <View style={styles.followUpContainer}>
                        <Text style={styles.followUpLabel}>💭 Reflection:</Text>
                        <Text style={styles.followUpText}>{insight.follow_up_question}</Text>
                      </View>
                    )}
                    <View style={styles.confidenceContainer}>
                      <View style={styles.confidenceBar}>
                        <View
                          style={[
                            styles.confidenceProgress,
                            { width: `${insight.confidence * 100}%` }
                          ]}
                        />
                      </View>
                      <Text style={styles.confidenceText}>
                        {Math.round(insight.confidence * 100)}% confidence
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </ExpandableSection>
          )}

          {/* Chat Interface Section */}
          <ExpandableSection
            title="Chat with AI"
            icon="💬"
            isExpanded={expandedSections.chat}
            onToggle={() => toggleSection('chat')}
          >
            <View style={styles.chatContainer}>
              <View style={styles.chatHistory}>
                <Text style={styles.chatPlaceholder}>
                  Start a conversation about this entry...
                </Text>
              </View>
              <View style={styles.chatInput}>
                <TextInput
                  style={styles.messageInput}
                  value={chatMessage}
                  onChangeText={setChatMessage}
                  placeholder="Ask about this entry or your feelings..."
                  placeholderTextColor={colors.gray400}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !chatMessage.trim() && styles.sendButtonDisabled
                  ]}
                  onPress={handleSendMessage}
                  disabled={!chatMessage.trim()}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ExpandableSection>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: components.card.borderRadius,
    marginBottom: 16,
    ...components.card,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: 'hidden',
  },
  expandedContainer: {
    marginBottom: 24,
  },
  cardHeader: {
    padding: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moodEmoji: {
    fontSize: 18,
  },
  moodText: {
    fontSize: 12,
    color: colors.gray600,
    fontWeight: '500',
  },
  preview: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray800,
    marginBottom: 12,
  },
  headerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordCount: {
    fontSize: 12,
    color: colors.gray500,
  },
  insightCount: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  expandHint: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  expandableSection: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.gray50,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    marginRight: 8,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '600',
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
    padding: 4,
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  chevronText: {
    fontSize: 18,
    color: colors.gray400,
    fontWeight: 'bold',
  },
  sectionContent: {
    padding: 16,
  },
  editContainer: {
    gap: 12,
  },
  editInput: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray800,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: colors.gray200,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.gray700,
    fontWeight: '600',
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  journalContent: {
    gap: 12,
  },
  fullContent: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray800,
  },
  editTrigger: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  editTriggerText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  insightsContainer: {
    gap: 12,
  },
  insightCard: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightIcon: {
    fontSize: 16,
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
    color: colors.secondary,
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray700,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  followUpContainer: {
    backgroundColor: colors.white,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  followUpLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray600,
    marginBottom: 4,
  },
  followUpText: {
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBar: {
    flex: 1,
    height: 3,
    backgroundColor: colors.gray200,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  confidenceProgress: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 1.5,
  },
  confidenceText: {
    fontSize: 11,
    color: colors.gray500,
    fontWeight: '500',
  },
  chatContainer: {
    gap: 12,
  },
  chatHistory: {
    minHeight: 60,
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatPlaceholder: {
    fontSize: 14,
    color: colors.gray500,
    fontStyle: 'italic',
  },
  chatInput: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.gray800,
    maxHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  sendButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
});