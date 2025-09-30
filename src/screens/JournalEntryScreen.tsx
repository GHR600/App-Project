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
import { useTheme } from '../contexts/ThemeContext';
import { typography, components } from '../styles/designSystem';
import { JournalService, CreateJournalEntryData } from '../services/journalService';
import { AIInsightService, AIInsight, JournalEntry, UserContext, ChatMessage } from '../services/aiInsightService';

interface JournalEntryScreenProps {
  userId: string;
  onPaywallRequired?: () => void;
  onEntryComplete?: (entry: any, insight?: any) => void;
  onBack?: () => void;
  initialDate?: Date;
  mode?: 'create' | 'edit';
  entryId?: string;
  entryType?: 'journal' | 'note';
  fromScreen?: 'DayDetail' | 'Dashboard';
}

export const JournalEntryScreen: React.FC<JournalEntryScreenProps> = ({
  userId,
  onPaywallRequired,
  onEntryComplete,
  onBack,
  initialDate,
  mode = 'create',
  entryId,
  entryType: initialEntryType = 'journal',
  fromScreen
}) => {
  const { theme } = useTheme();

  // Entry content state
  const [title, setTitle] = useState('');
  const [entryText, setEntryText] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    if (initialDate && initialDate instanceof Date && !isNaN(initialDate.getTime())) {
      return initialDate;
    }
    return new Date();
  });
  const [selectedMood, setSelectedMood] = useState<string>('😐'); // Emoji string instead of number
  const [entryType, setEntryType] = useState<'journal' | 'note'>(initialEntryType);

  // Flow state
  const [isSaving, setIsSaving] = useState(false);
  const [savedEntry, setSavedEntry] = useState<any>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentChatMessage, setCurrentChatMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [initialInsight, setInitialInsight] = useState<string | null>(null);
  const [hasGeneratedInitialInsight, setHasGeneratedInitialInsight] = useState(false);

  // Debug: Log whenever chatMessages state changes
  useEffect(() => {
    const visibleMessages = chatMessages.filter(message => {
      if (message.role === 'assistant' && initialInsight && message.content === initialInsight) {
        return false;
      }
      return true;
    });
    console.log('🔄 chatMessages state updated:', chatMessages.length, 'total messages,', visibleMessages.length, 'visible');
    chatMessages.forEach((msg, index) => {
      const isHidden = msg.role === 'assistant' && initialInsight && msg.content === initialInsight;
      console.log(`   ${index + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...${isHidden ? ' (HIDDEN - initial insight)' : ''}`);
    });
  }, [chatMessages, initialInsight]);
  const chatScrollViewRef = useRef<ScrollView>(null);

  // Summary state
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Mock user context - in production this would come from user preferences
  const mockUserContext: UserContext = {
    focusAreas: ['general'],
    recentMoodTrend: 'neutral',
    subscriptionStatus: 'free'
  };

  // Load existing entry data if in edit mode
  useEffect(() => {
    const loadExistingEntry = async () => {
      if (mode === 'edit' && entryId) {
        try {
          const { entry, error } = await JournalService.getEntry(userId, entryId);
          if (!error && entry) {
            setTitle(entry.title || '');
            setEntryText(entry.content);
            setSelectedMood(getMoodEmoji(entry.mood_rating || 3));
            setEntryType(entry.entry_type || 'note');
            setSavedEntry(entry);
          }
        } catch (error) {
          console.error('Error loading entry for editing:', error);
        }
      }
    };

    loadExistingEntry();
  }, [mode, entryId, userId]);

  const getMoodEmoji = (rating: number): string => {
    switch (rating) {
      case 1: return '😢';
      case 2: return '😕';
      case 3: return '😐';
      case 4: return '😊';
      case 5: return '😄';
      default: return '😐';
    }
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
          const { messages, error } = await AIInsightService.getChatHistory(userId, savedEntry.id);
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
    if (chatMessages.length > 0) {
      // Use a longer timeout to ensure content has rendered
      const timer = setTimeout(() => {
        chatScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [chatMessages]);

  // Helper function to scroll to bottom immediately (for user actions)
  const scrollToBottom = () => {
    setTimeout(() => {
      chatScrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);
  };

  const handleSaveEntry = async () => {
    if (!entryText.trim()) {
      Alert.alert('Empty Entry', 'Please write something before saving your entry.');
      return;
    }

    setIsSaving(true);

    try {
      let entry, error;

      if (mode === 'edit' && entryId) {
        // Update existing entry
        const result = await JournalService.updateEntry(userId, entryId, {
          content: entryText.trim(),
          moodRating: getMoodRating(selectedMood),
          title: title.trim() || undefined,
          entryType: entryType
        });
        entry = result.entry;
        error = result.error;
      } else {
        // Create new entry
        const result = await JournalService.createEntry(userId, {
          content: entryText.trim(),
          moodRating: getMoodRating(selectedMood),
          title: title.trim() || undefined,
          entryType: entryType
        });
        entry = result.entry;
        error = result.error;
      }

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

        // Ensure insight is displayed as clean text
        let insightText = insight.insight;
        if (typeof insightText === 'object' && insightText !== null) {
          const insightObj = insightText as any;
          insightText = insightObj.insight || insightObj.text || JSON.stringify(insightText);
        }
        if (typeof insightText !== 'string') {
          insightText = String(insightText);
        }

        console.log('📺 Setting initial insight:', {
          originalType: typeof insight.insight,
          finalType: typeof insightText,
          finalLength: insightText?.length,
          finalPreview: insightText.substring(0, 100)
        });
        setInitialInsight(insightText);
        setHasGeneratedInitialInsight(true);

        // Save insight as a chat message to database
        try {
          const { message, error: chatError } = await AIInsightService.saveInitialInsightAsMessage(
            userId,
            entry!.id,
            insightText
          );

          if (chatError) {
            console.error('Failed to save insight as chat message:', chatError);
            // Still add to local state as fallback
            const insightMessage: ChatMessage = {
              id: `insight-${Date.now()}`,
              role: 'assistant',
              content: insightText,
              timestamp: new Date().toISOString(),
              journalEntryId: entry!.id,
              userId,
            };
            setChatMessages([insightMessage]);
          } else if (message) {
            // Successfully saved to database, add to local state
            setChatMessages([message]);
          }
        } catch (saveError) {
          console.error('Error saving insight as chat message:', saveError);
          // Fallback to local state only
          const insightMessage: ChatMessage = {
            id: `insight-${Date.now()}`,
            role: 'assistant',
            content: insightText,
            timestamp: new Date().toISOString(),
            journalEntryId: entry!.id,
            userId,
          };
          setChatMessages([insightMessage]);
        }


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
    console.log('🎯 handleSendChatMessage called');
    console.log('📝 currentChatMessage:', currentChatMessage);
    console.log('💾 savedEntry:', savedEntry);
    console.log('👤 userId:', userId);

    if (!currentChatMessage.trim() || !savedEntry) {
      console.log('❌ Early return - missing message or saved entry');
      return;
    }

    const messageToSend = currentChatMessage.trim();
    setCurrentChatMessage('');
    setIsChatLoading(true);

    console.log('📤 Sending message:', messageToSend);

    // Create temporary user message with unique ID for immediate display
    const tempUserMessage: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: messageToSend,
      timestamp: new Date().toISOString(),
      journalEntryId: savedEntry.id,
      userId,
    };

    // Add user message to local state immediately
    console.log('🔄 Adding temporary user message to state');
    setChatMessages(prev => {
      const newMessages = [...prev, tempUserMessage];
      console.log('📊 State before temp message:', prev.length);
      console.log('📊 State after temp message:', newMessages.length);
      return newMessages;
    });

    // Scroll to show the new user message immediately
    scrollToBottom();

    try {
      console.log('📞 Calling AIInsightService.sendChatMessage...');
      const { userMessage, aiResponse, error } = await AIInsightService.sendChatMessage(
        userId,
        savedEntry.id,
        messageToSend,
        entryText // Include journal context
      );

      console.log('📋 ChatService response:', {
        hasUserMessage: !!userMessage,
        hasAiResponse: !!aiResponse,
        error: error || 'none'
      });

      // Check if we have valid messages even if there's a warning error
      if (userMessage && aiResponse) {
        console.log('✅ Adding messages to UI state...');
        console.log('📋 UserMessage:', { id: userMessage.id, role: userMessage.role, content: userMessage.content.substring(0, 50) });
        console.log('📋 AiResponse:', { id: aiResponse.id, role: aiResponse.role, content: aiResponse.content.substring(0, 50) });

        setChatMessages(prev => {
          console.log('📊 Previous messages:', prev.length);
          const filtered = prev.filter(msg => msg.id !== tempUserMessage.id);
          console.log('📊 After filtering temp:', filtered.length);
          const newMessages = [...filtered, userMessage, aiResponse];
          console.log('📊 Final message count:', newMessages.length);
          console.log('📊 Final messages:', newMessages.map(m => ({ id: m.id, role: m.role })));

          // Double-check the messages are valid
          newMessages.forEach((msg, idx) => {
            if (!msg.id || !msg.role || !msg.content) {
              console.error(`❌ Invalid message at index ${idx}:`, msg);
            }
          });

          return newMessages;
        });

        // Scroll to show the AI response
        setTimeout(() => scrollToBottom(), 200);

        // If there was an error but we got messages, it might be a non-critical warning
        if (error) {
          console.warn('⚠️ Non-critical warning:', error);
        }
      } else if (error) {
        console.error('❌ Critical chat error:', error);
        const errorMessage = typeof error === 'string' ? error : 'Failed to send message. Please try again.';
        Alert.alert('Chat Error', errorMessage);
        // Remove the temporary message and restore input
        setChatMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
        setCurrentChatMessage(messageToSend);
        return;
      } else {
        console.error('❌ No messages received from ChatService');
        Alert.alert('Chat Error', 'No response received. Please try again.');
        setChatMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
        setCurrentChatMessage(messageToSend);
        return;
      }
    } catch (error) {
      console.error('Unexpected chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      Alert.alert('Chat Error', errorMessage);
      // Remove the temporary message and restore input
      setChatMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
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
      // Use the new generateSummary method from AIInsightService
      const { summary: summaryText, error } = await AIInsightService.generateSummary(
        userId,
        savedEntry.id,
        entryText,
        chatMessages
      );

      if (error) {
        console.warn('Summary generation had errors:', error);
      }

      setSummary(summaryText);

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
    if (!date || isNaN(date.getTime())) return 'Invalid Date';

    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Render Header (MyDiary style)
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.backgroundSecondary }]}>
      <TouchableOpacity onPress={onBack} style={styles.closeButton}>
        <Text style={[styles.closeButtonText, { color: theme.textPrimary }]}>✕</Text>
      </TouchableOpacity>
      <View style={styles.headerCenter} />
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={[styles.menuButtonText, { color: theme.textPrimary }]}>•••</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary, opacity: entryText.trim() ? 1 : 0.5 }]}
          onPress={handleSaveEntry}
          disabled={!entryText.trim() || isSaving}
        >
          <Text style={[styles.saveButtonText, { color: theme.white }]}>
            {isSaving ? 'SAVING...' : (mode === 'edit' ? 'UPDATE' : 'SAVE')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render Date and Mood Row
  const renderDateMoodRow = () => (
    <View style={styles.dateMoodRow}>
      <TouchableOpacity style={styles.dateSelector}>
        <Text style={[styles.dateSelectorText, { color: theme.primaryLight }]}>
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

  // Entry Type Selector Component
  const renderEntryTypeSelector = () => {
    console.log('🎯 Rendering entry type selector, current type:', entryType);
    return (
      <View style={[styles.entryTypeContainer, { borderColor: theme.primary, backgroundColor: theme.surface }]}>
        <Text style={[styles.entryTypeLabel, { color: theme.primary }]}>Entry Type:</Text>
        <View style={[styles.entryTypePicker, { backgroundColor: theme.backgroundTertiary }]}>
        <TouchableOpacity
          style={[
            styles.entryTypeOption,
            entryType === 'journal' && { backgroundColor: theme.primary }
          ]}
          onPress={() => setEntryType('journal')}
          disabled={!!savedEntry}
        >
          <Text style={[
            styles.entryTypeOptionText,
            { color: entryType === 'journal' ? theme.white : theme.textSecondary },
            entryType === 'journal' && { fontWeight: '600' }
          ]}>
            📝 Journal Entry
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.entryTypeOption,
            entryType === 'note' && { backgroundColor: theme.primary }
          ]}
          onPress={() => setEntryType('note')}
          disabled={!!savedEntry}
        >
          <Text style={[
            styles.entryTypeOptionText,
            { color: entryType === 'note' ? theme.white : theme.textSecondary },
            entryType === 'note' && { fontWeight: '600' }
          ]}>
            🗒️ Quick Note
          </Text>
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  // Section A: Journal Entry Area
  const renderJournalSection = () => {
    console.log('📝 Rendering journal section');
    return (
      <View style={[styles.journalSection, { backgroundColor: theme.surface }]}>
        {renderEntryTypeSelector()}
        <TextInput
        style={[styles.titleInput, { color: theme.textPrimary, borderBottomColor: theme.cardBorder }]}
        placeholder={entryType === 'journal' ? "What's on your mind?" : "Note title (optional)"}
        placeholderTextColor={theme.textMuted}
        value={title}
        onChangeText={setTitle}
        editable={!savedEntry}
      />
      <TextInput
        style={[styles.contentInput, { color: theme.textPrimary }]}
        multiline
        placeholder="Write more here..."
        placeholderTextColor={theme.textMuted}
        value={entryText}
        onChangeText={setEntryText}
        textAlignVertical="top"
        editable={!savedEntry}
      />
      <View style={[styles.formattingToolbar, { borderTopColor: theme.cardBorder }]}>
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
  };

  // Section B: AI Chat Area
  const renderChatSection = () => {
  if (!savedEntry) {
    return (
      <View style={[styles.chatSection, { backgroundColor: theme.surface }]}>
        <View style={styles.chatPlaceholder}>
          <Text style={styles.chatPlaceholderIcon}>💬</Text>
          <Text style={[styles.chatPlaceholderTitle, { color: theme.textPrimary }]}>Chat with AI</Text>
          <Text style={[styles.chatPlaceholderText, { color: theme.textSecondary }]}>
            Save your journal entry first to start chatting with AI.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.chatSection, { backgroundColor: theme.surface }]}>
      {/* Initial AI Insight */}
      {initialInsight && (
        <View style={[styles.insightBubble, { borderColor: theme.primary }]}>
          <View style={styles.insightHeader}>
            <Text style={styles.insightIcon}>🤖</Text>
            <Text style={[styles.insightLabel, { color: theme.primary }]}>AI INSIGHT</Text>
          </View>
          <Text style={[styles.insightText, { color: theme.textPrimary }]}>{initialInsight}</Text>
        </View>
      )}

      {/* Chat Messages */}
      <ScrollView
        ref={chatScrollViewRef}
        style={styles.chatHistory}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
        {(() => {
          // Filter out initial insight from visible chat (keep for context but don't show)
          const visibleMessages = chatMessages.filter(message => {
            // Hide if it's an assistant message that matches the initial insight
            if (message.role === 'assistant' && initialInsight && message.content === initialInsight) {
              return false;
            }
            return true;
          });

          return visibleMessages.length === 0 ? (
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              No messages yet. Start a conversation!
            </Text>
          ) : (
            visibleMessages.map((message, index) => (
              <View
                key={`${message.id}-${index}`}
                style={[
                  styles.chatBubble,
                  message.role === 'user'
                    ? [styles.userBubble, { backgroundColor: theme.primary }]
                    : [styles.claudeBubble, { backgroundColor: theme.backgroundTertiary }]
                ]}
              >
                <Text
                  style={[
                    styles.chatBubbleText,
                    { color: message.role === 'user' ? theme.white : theme.textPrimary }
                  ]}
                >
                  {message.role === 'assistant' ? '🤖 ' : '💬 '}
                  {message.content}
                </Text>
              </View>
            ))
          );
        })()}
        {isChatLoading && (
          <View style={[styles.claudeBubble, { backgroundColor: theme.backgroundTertiary }]}>
            <Text style={[styles.claudeBubbleText, { color: theme.textPrimary }]}>🤖 Thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Chat Input */}
      <View style={[styles.chatInputContainer, { borderTopColor: theme.cardBorder }]}>
        <TextInput
          style={[styles.chatInput, { backgroundColor: theme.inputBackground, color: theme.textPrimary }]}
          placeholder="Type response..."
          placeholderTextColor={theme.textMuted}
          value={currentChatMessage}
          onChangeText={setCurrentChatMessage}
          multiline
          editable={!isChatLoading}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: (!currentChatMessage.trim() || isChatLoading) ? theme.textMuted : theme.primary }
          ]}
          onPress={handleSendChatMessage}
          disabled={!currentChatMessage.trim() || isChatLoading}
        >
          <Text style={[styles.sendButtonText, { color: theme.white }]}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  };

  // Section C: Summary Feature
  const renderSummarySection = () => {
    if (!savedEntry) return null;

    return (
      <View style={styles.summarySection}>
        <TouchableOpacity
          style={[
            styles.summariseButton,
            { borderColor: isSummaryLoading ? theme.textMuted : theme.primary }
          ]}
          onPress={handleGenerateSummary}
          disabled={isSummaryLoading}
        >
          <Text style={[styles.summariseButtonText, { color: theme.primary }]}>
            {isSummaryLoading ? 'GENERATING...' : 'SUMMARISE'}
          </Text>
        </TouchableOpacity>

        {summary && (
          <View style={[styles.summaryDisplay, { backgroundColor: theme.surface }]}>
            <Text style={[styles.summaryTitle, { color: theme.primaryLight }]}>📋 Summary</Text>
            <Text style={[styles.summaryText, { color: theme.textPrimary }]}>{summary}</Text>
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
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
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
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
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    
    flexGrow: 1,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  entryTypeContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  entryTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  entryTypePicker: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
  },
  entryTypeOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  entryTypeOptionSelected: {
  },
  entryTypeOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  entryTypeOptionTextSelected: {
    fontWeight: '600',
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  contentInput: {
    fontSize: 16,
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
  },
  toolbarIcon: {
    fontSize: 18,
    padding: 8,
  },

  // Section B: Chat Area
  chatSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    minHeight: 300,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  chatPlaceholderText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  insightBubble: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1,
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
    textTransform: 'uppercase',
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatHistory: {
    flex: 1,
    marginBottom: 12,
    maxHeight: 300,
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
    borderBottomRightRadius: 4,
  },
  claudeBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  chatBubbleText: {
    fontSize: 14,
    lineHeight: 18,
  },
  userBubbleText: {
  },
  claudeBubbleText: {
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButtonDisabled: {
  },
  sendButtonText: {
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
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 16,
  },
  summariseButtonDisabled: {
  },
  summariseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryDisplay: {
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
});

export default JournalEntryScreen;
