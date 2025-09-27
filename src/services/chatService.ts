import { openAIService } from './openaiService';
import { supabase } from '../config/supabase';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  journalEntryId: string;
  userId: string;
}

export interface ChatSession {
  id: string;
  journalEntryId: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export class ChatService {
  static async sendMessage(
    userId: string,
    journalEntryId: string,
    message: string,
    journalContext?: string
  ): Promise<{
    userMessage: ChatMessage;
    aiResponse: ChatMessage;
    error?: any;
  }> {
    try {
      // Create user message
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        journalEntryId,
        userId,
      };

      // Save user message to database
      const { error: userMsgError } = await supabase
        .from('chat_messages')
        .insert({
          id: userMessage.id,
          role: userMessage.role,
          content: userMessage.content,
          timestamp: userMessage.timestamp,
          journal_entry_id: journalEntryId,
          user_id: userId,
        });

      if (userMsgError) {
        console.error('Error saving user message:', userMsgError);
        throw new Error('Failed to save message');
      }

      // Get conversation history for context
      const { data: previousMessages, error: historyError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('journal_entry_id', journalEntryId)
        .eq('user_id', userId)
        .order('timestamp', { ascending: true })
        .limit(10); // Last 10 messages for context

      if (historyError) {
        console.warn('Error fetching chat history:', historyError);
      }

      // Build conversation for AI
      const conversationHistory = previousMessages?.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })) || [];

      // Add current message
      conversationHistory.push({
        role: 'user',
        content: message,
      });

      // Get AI response
      let aiResponseText: string;

      if (openAIService.isAvailable()) {
        aiResponseText = await openAIService.chatWithAI({
          messages: conversationHistory,
          journalContext,
          maxTokens: 150,
        });
      } else {
        // Fallback to mock response
        aiResponseText = this.generateMockChatResponse(message, journalContext);
      }

      // Create AI response message
      const aiResponse: ChatMessage = {
        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: aiResponseText,
        timestamp: new Date().toISOString(),
        journalEntryId,
        userId,
      };

      // Save AI response to database
      const { error: aiMsgError } = await supabase
        .from('chat_messages')
        .insert({
          id: aiResponse.id,
          role: aiResponse.role,
          content: aiResponse.content,
          timestamp: aiResponse.timestamp,
          journal_entry_id: journalEntryId,
          user_id: userId,
        });

      if (aiMsgError) {
        console.error('Error saving AI message:', aiMsgError);
        throw new Error('Failed to save AI response');
      }

      return {
        userMessage,
        aiResponse,
      };
    } catch (error) {
      console.error('Chat service error:', error);
      return {
        userMessage: {
          id: `error_${Date.now()}`,
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
          journalEntryId,
          userId,
        },
        aiResponse: {
          id: `error_ai_${Date.now()}`,
          role: 'assistant',
          content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
          timestamp: new Date().toISOString(),
          journalEntryId,
          userId,
        },
        error,
      };
    }
  }

  static async getChatHistory(
    userId: string,
    journalEntryId: string
  ): Promise<{
    messages: ChatMessage[];
    error?: any;
  }> {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('journal_entry_id', journalEntryId)
        .eq('user_id', userId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching chat history:', error);
        return { messages: [], error };
      }

      const formattedMessages: ChatMessage[] = messages?.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        journalEntryId: msg.journal_entry_id,
        userId: msg.user_id,
      })) || [];

      return { messages: formattedMessages };
    } catch (error) {
      console.error('Unexpected error fetching chat history:', error);
      return { messages: [], error };
    }
  }

  static async deleteChatHistory(
    userId: string,
    journalEntryId: string
  ): Promise<{ error?: any }> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('journal_entry_id', journalEntryId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting chat history:', error);
        return { error };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error deleting chat history:', error);
      return { error };
    }
  }

  private static generateMockChatResponse(userMessage: string, journalContext?: string): string {
    const message = userMessage.toLowerCase();

    // Context-aware responses
    if (message.includes('feel') || message.includes('emotion')) {
      return "Your feelings are completely valid. Sometimes just naming what we're experiencing can be really helpful. What feels most important for you to explore right now?";
    }

    if (message.includes('why') || message.includes('understand')) {
      return "That's a thoughtful question. Self-understanding often comes through reflection like this. What patterns or connections are you starting to notice?";
    }

    if (message.includes('help') || message.includes('advice')) {
      return "I'm here to support you in finding your own insights. What do you think might be helpful for you in this situation?";
    }

    if (message.includes('thank') || message.includes('appreciate')) {
      return "You're very welcome. It's wonderful that you're taking time for this kind of reflection. How does it feel to pause and explore your thoughts this way?";
    }

    if (message.includes('stress') || message.includes('anxious') || message.includes('worried')) {
      return "It sounds like you're carrying some stress right now. What small step could you take today to care for yourself?";
    }

    if (message.includes('happy') || message.includes('joy') || message.includes('excited')) {
      return "It's lovely to hear positive energy in your words. What do you think contributed to these good feelings?";
    }

    if (message.includes('work') || message.includes('job') || message.includes('career')) {
      return "Work can be such a big part of our lives. How are you finding balance between your professional goals and personal well-being?";
    }

    if (message.includes('relationship') || message.includes('friend') || message.includes('family')) {
      return "Relationships are so important for our well-being. What qualities do you most value in your connections with others?";
    }

    // Generic supportive responses
    const genericResponses = [
      "That's an interesting perspective. What led you to think about it that way?",
      "I can sense you're reflecting deeply on this. What feels most significant to you?",
      "Thank you for sharing that with me. What would you like to explore further?",
      "It sounds like you're processing something important. How does it feel to put these thoughts into words?",
      "That's a valuable insight. What might this tell you about what matters to you?",
    ];

    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
  }
}

export default ChatService;