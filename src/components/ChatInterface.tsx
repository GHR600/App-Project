import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { colors } from '../styles/designSystem';
import { ChatService, ChatMessage } from '../services/chatService';
import { TypingIndicator } from './TypingIndicator';

interface ChatInterfaceProps {
  userId: string;
  journalEntryId: string;
  journalContext?: string;
  style?: any;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  userId,
  journalEntryId,
  journalContext,
  style
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, [userId, journalEntryId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const loadChatHistory = async () => {
    setIsLoading(true);
    try {
      const { messages: chatHistory, error } = await ChatService.getChatHistory(
        userId,
        journalEntryId
      );

      if (error) {
        console.error('Error loading chat history:', error);
      } else {
        setMessages(chatHistory);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const messageToSend = currentMessage.trim();
    setCurrentMessage('');
    setIsTyping(true);

    try {
      const { userMessage, aiResponse, error } = await ChatService.sendMessage(
        userId,
        journalEntryId,
        messageToSend,
        journalContext
      );

      if (error) {
        console.error('Chat error:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
        return;
      }

      // Add both messages to the chat
      setMessages(prev => [...prev, userMessage, aiResponse]);
    } catch (error) {
      console.error('Unexpected chat error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userMessageBubble : styles.aiMessageBubble
          ]}
        >
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.aiMessageText
          ]}>
            {message.content}
          </Text>
        </View>
        <Text style={styles.messageTime}>{time}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Start a conversation about your journal entry. Ask questions, share thoughts, or explore your feelings.
            </Text>
          </View>
        ) : (
          messages.map(renderMessage)
        )}

        {isTyping && (
          <TypingIndicator
            isVisible={true}
            message="AI is thinking..."
            style={styles.typingIndicator}
          />
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={currentMessage}
          onChangeText={setCurrentMessage}
          placeholder="Ask about this entry or your feelings..."
          placeholderTextColor={colors.gray400}
          multiline
          maxLength={500}
          editable={!isTyping}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!currentMessage.trim() || isTyping) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!currentMessage.trim() || isTyping}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray600,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 4,
  },
  userMessageBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  aiMessageBubble: {
    backgroundColor: colors.gray100,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.white,
  },
  aiMessageText: {
    color: colors.gray800,
  },
  messageTime: {
    fontSize: 12,
    color: colors.gray500,
    marginHorizontal: 16,
  },
  typingIndicator: {
    alignSelf: 'flex-start',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.white,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.gray800,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});