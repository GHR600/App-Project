import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, typography, components } from '../styles/designSystem';
import { JournalService, CreateJournalEntryData } from '../services/journalService';
import { AIInsightService, AIInsight, JournalEntry, UserContext } from '../services/aiInsightService';
import { ChatService, ChatMessage } from '../services/chatService';

interface JournalEntryScreenProps {
  userId: string;
  onPaywallRequired?: () => void;
  onEntryComplete?: (entry: any, insight?: any) => void;
  onBack?: () => void;
  initialDate?: Date;
}

export const JournalEntryScreen: React.FC<JournalEntryScreenProps> = ({
  userId,
  onPaywallRequired,
  onEntryComplete,
  onBack,
  initialDate
}) => {
  // Entry content state
  const [title, setTitle] = useState('');
  const [entryText, setEntryText] = useState('');
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
  const [selectedMood, setSelectedMood] = useState<string>('😐'); // Emoji string instead of number

  // Flow state
  const [isSaving, setIsSaving] = useState(false);
  const [savedEntry, setSavedEntry] = useState<any>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentChatMessage, setCurrentChatMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollViewRef = useRef<ScrollView>(null);
  const [initialInsight, setInitialInsight] = useState<string | null>(null);
  const [hasGeneratedInitialInsight, setHasGeneratedInitialInsight] = useState(false);

  // Summary state
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Mock user context - in production this would come from user preferences
  const mockUserContext: UserContext = {
    focusAreas: ['general'],
    recentMoodTrend: 'neutral',
    subscriptionStatus: 'free'
  };

  // Convert mood emoji to number for compatibility
  const getMoodRating = (emoji: string): number => {
    const moodMap: { [key: string]: number } = {
      '😢': 1, '😕': 2, '😐': 3, '😊': 4, '😄': 5
    };
    return moodMap[emoji] || 3;
  };

  // Load chat history when saved entry changes
  useEffect(() => {
    const loadChatHistory = async () => {
      if (savedEntry) {
        try {
          const { messages, error } = await ChatService.getChatHistory(userId, savedEntry.id);
          if (error) {
            console.error('Error loading chat history:', error);
          } else {
            setChatMessages(messages);
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
        }
      }
    };

    loadChatHistory();
  }, [savedEntry, userId]);

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      chatScrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [chatMessages]);

  const handleSaveEntry = async () => {
    if (!entryText.trim()) {
      Alert.alert('Empty Entry', 'Please write something before saving your entry.');
      return;
    }

    setIsSaving(true);

    try {
      // Save entry to database
      const { entry, error } = await JournalService.createEntry(userId, {
        content: entryText.trim(),
        moodRating: getMoodRating(selectedMood)
      });

      if (error) {
        Alert.alert('Error', 'Failed to save your entry. Please try again.');
        setIsSaving(false);
        return;
      }

      setSavedEntry(entry);

      // Convert to AIInsight format
      const journalEntry: JournalEntry = {
        id: entry!.id,
        content: entry!.content,
        moodRating: entry!.mood_rating,
        createdAt: entry!.created_at,
        userId: entry!.user_id
      };

      // Auto-generate initial AI insight
      try {
        const insight = await AIInsightService.generateInsight(
          journalEntry,
          mockUserContext,
          []
        );

        setInitialInsight(insight.insight);
        setHasGeneratedInitialInsight(true);

        // Save insight to database
        try {
          await AIInsightService.saveInsightToDatabase(userId, entry!.id, insight);
        } catch (saveError) {
          console.error('Failed to save insight to database:', saveError);
        }

      } catch (insightError) {
        console.log('Insight generation failed:', insightError);
        if (insightError instanceof Error && insightError.message.includes('Premium subscription required')) {
          onPaywallRequired?.();
          return;
        }
        // Continue without insight if generation fails
      }

      setIsSaving(false);

    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setIsSaving(false);
    }
  };

  // Chat functionality
  const handleSendChatMessage = async () => {
    if (!currentChatMessage.trim() || !savedEntry) return;

    const messageToSend = currentChatMessage.trim();
    setCurrentChatMessage('');
    setIsChatLoading(true);

    try {
      const { userMessage, aiResponse, error } = await ChatService.sendMessage(
        userId,
        savedEntry.id,
        messageToSend,
        entryText // Include journal context
      );

      if (error) {
        console.error('Chat error:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
        // Restore the message text so user doesn't lose it
        setCurrentChatMessage(messageToSend);
        return;
      }

      // Add both messages to the chat
      if (userMessage && aiResponse) {
        setChatMessages(prev => [...prev, userMessage, aiResponse]);
      }
    } catch (error) {
      console.error('Unexpected chat error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      // Restore the message text so user doesn't lose it
      setCurrentChatMessage(messageToSend);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Summary functionality
  const handleGenerateSummary = async () => {
    if (!savedEntry) return;

    setIsSummaryLoading(true);

    try {
      // Generate summary based on entry and chat history
      const conversationContext = chatMessages.map(msg =>
        `${msg.role === 'user' ? 'User' : 'Claude'}: ${msg.content}`
      ).join('\n');

      const summaryPrompt = `Please provide a concise summary of this journal entry and our conversation:\n\nJournal Entry: "${entryText}"\n\nConversation:\n${conversationContext}`;

      // Use the same Claude integration as chat
      const { userMessage, aiResponse, error } = await ChatService.sendMessage(
        userId,
        savedEntry.id,
        summaryPrompt,
        entryText
      );

      if (error) {
        throw error;
      }

      setSummary(aiResponse.content);

      // Save summary to database (entry_summaries table)
      // This would need a new service method, for now just store in state

    } catch (error) {
      console.error('Summary generation error:', error);
      Alert.alert('Error', 'Failed to generate summary. Please try again.');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  // Mood selection helpers
  const moodEmojis = ['😢', '😕', '😐', '😊', '😄'];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Render Header (MyDiary style)
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
      <View style={styles.headerCenter} />
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuButtonText}>•••</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, { opacity: entryText.trim() ? 1 : 0.5 }]}
          onPress={handleSaveEntry}
          disabled={!entryText.trim() || isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'SAVING...' : 'SAVE'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render Date and Mood Row
  const renderDateMoodRow = () => (
    <View style={styles.dateMoodRow}>
      <TouchableOpacity style={styles.dateSelector}>
        <Text style={styles.dateSelectorText}>
          {formatDate(selectedDate)} ▼
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.moodSelector}
        onPress={() => {
          const currentIndex = moodEmojis.indexOf(selectedMood);
          const nextIndex = (currentIndex + 1) % moodEmojis.length;
          setSelectedMood(moodEmojis[nextIndex]);
        }}
      >
        <Text style={styles.moodEmoji}>{selectedMood}</Text>
      </TouchableOpacity>
    </View>
  );

  // Section A: Journal Entry Area
  const renderJournalSection = () => (
    <View style={styles.journalSection}>
      <TextInput
        style={styles.titleInput}
        placeholder="Title"
        placeholderTextColor={colors.placeholderText}
        value={title}
        onChangeText={setTitle}
        editable={!savedEntry}
      />
      <TextInput
        style={styles.contentInput}
        multiline
        placeholder="Write more here..."
        placeholderTextColor={colors.placeholderText}
        value={entryText}
        onChangeText={setEntryText}
        textAlignVertical="top"
        editable={!savedEntry}
      />
      <View style={styles.formattingToolbar}>
        <Text style={styles.toolbarIcon}>🎨</Text>
        <Text style={styles.toolbarIcon}>📷</Text>
        <Text style={styles.toolbarIcon}>⭐</Text>
        <Text style={styles.toolbarIcon}>😊</Text>
        <Text style={styles.toolbarIcon}>Tt</Text>
        <Text style={styles.toolbarIcon}>📝</Text>
        <Text style={styles.toolbarIcon}>🏷️</Text>
      </View>
    </View>
  );

  // Section B: AI Chat Area
  const renderChatSection = () => {
    if (!savedEntry) {
      return (
        <View style={styles.chatSection}>
          <View style={styles.chatPlaceholder}>
            <Text style={styles.chatPlaceholderIcon}>💬</Text>
            <Text style={styles.chatPlaceholderTitle}>Chat with AI</Text>
            <Text style={styles.chatPlaceholderText}>
              Save your journal entry first to start chatting with AI about your thoughts and feelings.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.chatSection}>
        {/* Initial AI Insight */}
        {initialInsight && (
          <View style={styles.insightBubble}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightIcon}>🤖</Text>
              <Text style={styles.insightLabel}>AI INSIGHT</Text>
            </View>
            <Text style={styles.insightText}>{initialInsight}</Text>
          </View>
        )}

        {/* Chat History */}
        <ScrollView
          ref={chatScrollViewRef}
          style={styles.chatHistory}
          showsVerticalScrollIndicator={false}
        >
          {chatMessages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.chatBubble,
                message.role === 'user' ? styles.userBubble : styles.claudeBubble
              ]}
            >
              <Text
                style={[
                  styles.chatBubbleText,
                  message.role === 'user' ? styles.userBubbleText : styles.claudeBubbleText
                ]}
              >
                {message.role === 'assistant' ? '🤖 ' : '💬 '}
                {message.content}
              </Text>
            </View>
          ))}
          {isChatLoading && (
            <View style={styles.claudeBubble}>
              <Text style={styles.claudeBubbleText}>🤖 Thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Chat Input */}
        <View style={styles.chatInputContainer}>
          <TextInput
            style={styles.chatInput}
            placeholder="Type response..."
            placeholderTextColor={colors.placeholderText}
            value={currentChatMessage}
            onChangeText={setCurrentChatMessage}
            multiline
            editable={!isChatLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!currentChatMessage.trim() || isChatLoading) && styles.sendButtonDisabled
            ]}
            onPress={handleSendChatMessage}
            disabled={!currentChatMessage.trim() || isChatLoading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Section C: Summary Feature
  const renderSummarySection = () => {
    if (!savedEntry || (chatMessages.length === 0 && !initialInsight)) return null;

    return (
      <View style={styles.summarySection}>
        <TouchableOpacity
          style={[
            styles.summariseButton,
            isSummaryLoading && styles.summariseButtonDisabled
          ]}
          onPress={handleGenerateSummary}
          disabled={isSummaryLoading}
        >
          <Text style={styles.summariseButtonText}>
            {isSummaryLoading ? 'GENERATING...' : 'SUMMARISE'}
          </Text>
        </TouchableOpacity>

        {summary && (
          <View style={styles.summaryDisplay}>
            <Text style={styles.summaryTitle}>📋 Summary</Text>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        )}
      </View>
    );
  };

  // Main render with 3-section layout
  const renderContent = () => (
    <>
      {renderDateMoodRow()}
      {renderJournalSection()}
      {renderChatSection()}
      {renderSummarySection()}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderHeader()}

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },

  // Header (MyDiary Style)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.backgroundSecondary,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 12,
    padding: 8,
  },
  menuButtonText: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Date and Mood Row
  dateMoodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  dateSelector: {
    flex: 1,
  },
  dateSelectorText: {
    fontSize: 16,
    color: colors.primaryLight,
    fontWeight: '500',
  },
  moodSelector: {
    padding: 8,
  },
  moodEmoji: {
    fontSize: 24,
  },

  // Section A: Journal Entry
  journalSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    paddingBottom: 8,
  },
  contentInput: {
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 150,
    textAlignVertical: 'top',
    lineHeight: 24,
    marginBottom: 16,
  },
  formattingToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  toolbarIcon: {
    fontSize: 18,
    padding: 8,
  },

  // Section B: Chat Area
  chatSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    minHeight: 200,
    maxHeight: 400,
  },
  chatPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  chatPlaceholderIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  chatPlaceholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  chatPlaceholderText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  insightBubble: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  insightText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  chatHistory: {
    flex: 1,
    marginBottom: 12,
  },
  chatBubble: {
    marginBottom: 8,
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  claudeBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.backgroundTertiary,
    borderBottomLeftRadius: 4,
  },
  chatBubbleText: {
    fontSize: 14,
    lineHeight: 18,
  },
  userBubbleText: {
    color: colors.white,
  },
  claudeBubbleText: {
    color: colors.textPrimary,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    color: colors.textPrimary,
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // Section C: Summary
  summarySection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  summariseButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 16,
  },
  summariseButtonDisabled: {
    borderColor: colors.textMuted,
  },
  summariseButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryDisplay: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryLight,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
