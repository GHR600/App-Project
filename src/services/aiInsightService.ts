// AI Insight Service - Server-only client for consolidated AI architecture
// All AI calls go through the server to ensure consistent prompts and security

export interface JournalEntry {
  id: string;
  content: string;
  moodRating?: number;
  createdAt: string;
  userId: string;
}

export interface UserContext {
  focusAreas: string[];
  recentMoodTrend: 'positive' | 'neutral' | 'negative';
  subscriptionStatus: 'free' | 'premium';
}

export interface AIInsight {
  id: string;
  insight: string;
  followUpQuestion: string;
  confidence: number;
  createdAt: string;
  isPremium: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  journalEntryId: string;
  userId: string;
}

import { API_CONFIG } from '../utils/env';
import { supabase } from '../config/supabase';
import { buildChatPrompt } from '../config/prompts';

export class AIInsightService {
  private static readonly API_BASE_URL = API_CONFIG.baseUrl;

  /**
   * Save AI insight to database
   */
  static async saveInsightToDatabase(
    userId: string,
    journalEntryId: string,
    insight: AIInsight
  ): Promise<{ error: any }> {
    console.log(`💾 Saving insight to database for user ${userId}, entry ${journalEntryId}`);
    console.log(`💾 Insight data:`, {
      insightLength: insight.insight.length,
      followUpLength: insight.followUpQuestion.length,
      confidence: insight.confidence,
      isPremium: insight.isPremium
    });

    try {
      const { error } = await supabase
        .from('ai_insights')
        .insert({
          user_id: userId,
          journal_entry_id: journalEntryId,
          insight_text: insight.insight,
          follow_up_question: insight.followUpQuestion,
          confidence: insight.confidence,
          is_premium: insight.isPremium,
          created_at: insight.createdAt
        });

      if (error) {
        console.error('❌ Error saving AI insight to database:', error);
        return { error };
      }

      console.log(`✅ Successfully saved insight to database`);
      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected error saving AI insight:', error);
      return { error };
    }
  }

  /**
   * Get AI insights for a specific journal entry
   */
  static async getInsightsForEntry(userId: string, journalEntryId: string): Promise<{
    insights: AIInsight[];
    error: any;
  }> {
    try {
      const { data: insights, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', userId)
        .eq('journal_entry_id', journalEntryId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching insights for entry:', error);
        return { insights: [], error };
      }

      const formattedInsights: AIInsight[] = insights?.map(insight => ({
        id: insight.id,
        insight: insight.insight_text,
        followUpQuestion: insight.follow_up_question,
        confidence: insight.confidence,
        createdAt: insight.created_at,
        isPremium: insight.is_premium
      })) || [];

      return { insights: formattedInsights, error: null };
    } catch (error) {
      console.error('Unexpected error fetching insights for entry:', error);
      return { insights: [], error };
    }
  }

  /**
   * Get all AI insights for a user with pagination
   */
  static async getUserInsights(userId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    insights: (AIInsight & { journalEntryId: string })[];
    error: any;
    hasMore: boolean;
  }> {
    try {
      const { limit = 20, offset = 0 } = options;

      let query = supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit);

      const { data: insights, error } = await query;

      if (error) {
        console.error('Error fetching user insights:', error);
        return { insights: [], error, hasMore: false };
      }

      const hasMore = insights.length === limit + 1;
      const finalInsights = hasMore ? insights.slice(0, -1) : insights;

      const formattedInsights = finalInsights?.map(insight => ({
        id: insight.id,
        insight: insight.insight_text,
        followUpQuestion: insight.follow_up_question,
        confidence: insight.confidence,
        createdAt: insight.created_at,
        isPremium: insight.is_premium,
        journalEntryId: insight.journal_entry_id
      })) || [];

      return { insights: formattedInsights, error: null, hasMore };
    } catch (error) {
      console.error('Unexpected error fetching user insights:', error);
      return { insights: [], error, hasMore: false };
    }
  }

  /**
   * Send chat message and get AI response from server
   */
  static async sendChatMessage(
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
      console.log('🚀 AIInsightService.sendChatMessage called with:', { userId, journalEntryId, message: message.substring(0, 50) + '...' });

      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session) {
        return {
          userMessage: {
            id: 'temp-error',
            role: 'user',
            content: message,
            timestamp: new Date().toISOString(),
            journalEntryId,
            userId,
          },
          aiResponse: {
            id: 'temp-error-ai',
            role: 'assistant',
            content: 'I need you to be signed in to save our conversation.',
            timestamp: new Date().toISOString(),
            journalEntryId,
            userId,
          },
          error: 'Authentication required'
        };
      }

      // Save user message to database
      const { data: insertedUserMsg, error: userMsgError } = await supabase
        .from('chat_messages')
        .insert({
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
          journal_entry_id: journalEntryId,
          user_id: userId,
        })
        .select()
        .single();

      if (userMsgError || !insertedUserMsg) {
        throw new Error('Failed to save message');
      }

      const userMessage: ChatMessage = {
        id: insertedUserMsg.id,
        role: 'user',
        content: message,
        timestamp: insertedUserMsg.timestamp,
        journalEntryId,
        userId,
      };

      // Get conversation history
      const { data: previousMessages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('journal_entry_id', journalEntryId)
        .eq('user_id', userId)
        .order('timestamp', { ascending: true })
        .limit(10);

      const conversationHistory = previousMessages?.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })) || [];

      // Call server for AI response
      const authToken = await this.getAuthToken();
      let aiResponseText: string;

      if (authToken) {
        try {
          const response = await fetch(`${this.API_BASE_URL}/api/ai/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              messages: conversationHistory,
              journalContext
            })
          });

          if (response.ok) {
            const result = await response.json();
            aiResponseText = result.response;
          } else {
            throw new Error('Server chat error');
          }
        } catch (error) {
          aiResponseText = this.generateMockChatResponse(message, journalContext);
        }
      } else {
        aiResponseText = this.generateMockChatResponse(message, journalContext);
      }

      // Save AI response to database
      const { data: insertedAiMsg, error: aiMsgError } = await supabase
        .from('chat_messages')
        .insert({
          role: 'assistant',
          content: aiResponseText,
          timestamp: new Date().toISOString(),
          journal_entry_id: journalEntryId,
          user_id: userId,
        })
        .select()
        .single();

      if (aiMsgError || !insertedAiMsg) {
        throw new Error('Failed to save AI response');
      }

      const aiResponse: ChatMessage = {
        id: insertedAiMsg.id,
        role: 'assistant',
        content: aiResponseText,
        timestamp: insertedAiMsg.timestamp,
        journalEntryId,
        userId,
      };

      return { userMessage, aiResponse };
    } catch (error) {
      console.error('Chat service error:', error);
      const tempUserUuid = 'temp-user-' + Date.now();
      const tempAiUuid = 'temp-ai-' + Date.now();

      return {
        userMessage: {
          id: tempUserUuid,
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
          journalEntryId,
          userId,
        },
        aiResponse: {
          id: tempAiUuid,
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

  /**
   * Get chat history for a journal entry
   */
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
      return { messages: [], error };
    }
  }

  /**
   * Delete chat history for a journal entry
   */
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

      return { error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Get authentication token from current session
   */
  private static async getAuthToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.warn('Could not get auth token:', error);
      return null;
    }
  }

  // Note: All AI prompt engineering is now handled server-side for security and consistency

  static async generateInsight(
    entry: JournalEntry,
    userContext: UserContext,
    recentEntries: JournalEntry[] = []
  ): Promise<AIInsight> {
    const startTime = Date.now();
    const requestId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`📱 [${requestId}] Starting server-side insight generation:`, {
      entryId: entry.id,
      contentLength: entry.content.length,
      moodRating: entry.moodRating,
      subscriptionStatus: userContext.subscriptionStatus
    });

    try {
      // Get auth token for server communication
      const authToken = await this.getAuthToken();

      if (!authToken) {
        console.log(`📱 [${requestId}] No auth token, using mock insights`);
        return this.generateMockInsight(entry, userContext, userContext.subscriptionStatus === 'premium');
      }

      // Call server endpoint for AI insight generation
      const response = await fetch(`${this.API_BASE_URL}/api/ai/insight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          content: entry.content,
          moodRating: entry.moodRating,
          userPreferences: {
            focusAreas: userContext.focusAreas,
            personalityType: 'supportive'
          },
          recentEntries: recentEntries.map(e => ({ content: e.content })),
          subscriptionStatus: userContext.subscriptionStatus
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Server returned error');
      }

      const totalDuration = Date.now() - startTime;
      console.log(`📱 [${requestId}] Server insight success! Duration: ${totalDuration}ms`);

      const insight = {
        id: `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        insight: result.insight,
        followUpQuestion: result.followUpQuestion,
        confidence: result.confidence,
        createdAt: new Date().toISOString(),
        isPremium: userContext.subscriptionStatus === 'premium'
      };

      return insight;

    } catch (error) {
      const totalDuration = Date.now() - startTime;
      console.error(`📱 [${requestId}] Failed to generate server insight after ${totalDuration}ms:`, error);

      // Fall back to mock insights
      return this.generateMockInsight(entry, userContext, userContext.subscriptionStatus === 'premium');
    }
  }

  /**
   * Get user's AI insight usage stats from server
   */
  static async getUsageStats(): Promise<{
    subscriptionStatus: string;
    freeInsightsUsed: number;
    remainingFreeInsights: number | null;
    isUnlimited: boolean;
  } | null> {
    try {
      const authToken = await this.getAuthToken();
      if (!authToken) {
        return null;
      }

      const response = await fetch(`${this.API_BASE_URL}/api/ai/usage`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        console.warn('Failed to fetch usage stats');
        return null;
      }

      const data = await response.json();
      return data.success ? data.usage : null;
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      return null;
    }
  }

  private static async generateMockInsight(
    entry: JournalEntry,
    userContext: UserContext,
    isPremium: boolean
  ): Promise<AIInsight> {
    // Mock implementation - in reality this would call OpenAI API
    const insights = {
      free: {
        career: {
          insight: "I notice you mentioned feeling overwhelmed at work today. It sounds like you're taking on a lot of responsibility, which shows your dedication.",
          followUpQuestion: "What's one small step you could take tomorrow to feel more organized?",
          confidence: 0.7
        },
        relationships: {
          insight: "You wrote about a meaningful conversation with a friend. These connections seem to really energize you and provide perspective.",
          followUpQuestion: "How do you usually maintain these important relationships?",
          confidence: 0.75
        },
        general: {
          insight: "Your entry shows thoughtful self-reflection. You're taking time to process your experiences, which is a valuable practice.",
          followUpQuestion: "What patterns do you notice in your daily experiences?",
          confidence: 0.65
        }
      },
      premium: {
        career: {
          insight: "I notice a pattern in your recent entries where work stress peaks midweek. You tend to be most productive when you mention having clear priorities. Consider implementing a weekly planning ritual to maintain that clarity throughout the week.",
          followUpQuestion: "What does your ideal Monday morning routine look like to set yourself up for success?",
          confidence: 0.9
        },
        relationships: {
          insight: "Your entries reveal that you feel most fulfilled when helping others or having deep conversations. This aligns with your focus on relationships. I've noticed you're particularly energized after spending time with people who share your values.",
          followUpQuestion: "How might you create more opportunities for these meaningful connections in your routine?",
          confidence: 0.95
        },
        general: {
          insight: "Analyzing your recent entries, I see you're most content when you balance productivity with self-care. Your mood improves significantly on days when you mention both accomplishing goals and taking breaks. This suggests you thrive with structured flexibility.",
          followUpQuestion: "What would an ideal daily rhythm look like that honors both your drive and your need for restoration?",
          confidence: 0.85
        }
      }
    };

    // Determine insight category based on focus areas
    const primaryFocus = userContext.focusAreas[0]?.toLowerCase() || 'general';
    const category = ['career', 'relationships'].includes(primaryFocus) ? primaryFocus : 'general';

    const insightLevel = isPremium ? 'premium' : 'free';
    const mockInsight = insights[insightLevel][category as keyof typeof insights.free];

    return {
      id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      insight: mockInsight.insight,
      followUpQuestion: mockInsight.followUpQuestion,
      confidence: mockInsight.confidence,
      createdAt: new Date().toISOString(),
      isPremium
    };
  }

  private static async shouldShowPaywall(): Promise<boolean> {
    // Check if user has exceeded free insights limit (3 insights)
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const freeInsightsUsed = parseInt((await AsyncStorage.getItem('freeInsightsUsed')) || '0');
      return freeInsightsUsed >= 3;
    } catch {
      // Fallback if AsyncStorage is not available
      return false;
    }
  }

  static async incrementFreeInsightCount(): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const current = parseInt((await AsyncStorage.getItem('freeInsightsUsed')) || '0');
      await AsyncStorage.setItem('freeInsightsUsed', (current + 1).toString());
    } catch {
      // Silently fail if AsyncStorage is not available
    }
  }

  static async resetFreeInsightCount(): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('freeInsightsUsed', '0');
    } catch {
      // Silently fail if AsyncStorage is not available
    }
  }

  /**
   * Generate mock chat response for fallback
   */
  private static generateMockChatResponse(userMessage: string, journalContext?: string): string {
    const message = userMessage.toLowerCase();

    // Context-aware responses using strategic thinking approach
    if (message.includes('feel') || message.includes('emotion')) {
      return "Your feelings are completely valid. What patterns do you notice in these emotions, and what might they be telling you about your needs?";
    }

    if (message.includes('why') || message.includes('understand')) {
      return "That's a strategic question. Self-understanding often comes through examining the systems and patterns behind our experiences. What connections are you starting to see?";
    }

    if (message.includes('help') || message.includes('advice')) {
      return "I'm here to help you find your own insights through strategic analysis. What specific outcome are you trying to optimize for in this situation?";
    }

    if (message.includes('stress') || message.includes('anxious') || message.includes('worried')) {
      return "Stress often signals misalignment between your current state and desired state. What would need to change to move toward your preferred outcome?";
    }

    if (message.includes('work') || message.includes('job') || message.includes('career')) {
      return "Career challenges often reflect deeper questions about values and strategic positioning. What matters most to you in your professional growth right now?";
    }

    // Generic strategic responses
    const strategicResponses = [
      "That's a valuable insight. What patterns might this reveal about your decision-making framework?",
      "Interesting perspective. How does this connect to your broader goals and priorities?",
      "What you're describing suggests an underlying system at work. What would optimizing that system look like?",
      "This seems like an important data point. What would this tell you about what to focus on next?",
    ];

    return strategicResponses[Math.floor(Math.random() * strategicResponses.length)];
  }

  static generatePersonalizedPrompt(userContext: UserContext): string {
    const prompts = {
      career: [
        "What's one professional goal you're excited about this week?",
        "How did today's work challenges help you grow?",
        "What would success look like for you this month?"
      ],
      relationships: [
        "Who made you smile today and why?",
        "What's something you appreciate about the people in your life?",
        "How did you show up for someone important to you recently?"
      ],
      general: [
        "What moment from today would you want to remember?",
        "What's something you learned about yourself recently?",
        "How are you feeling about where you are right now?"
      ]
    };

    const category = userContext.focusAreas[0]?.toLowerCase() || 'general';
    const categoryPrompts = prompts[category as keyof typeof prompts] || prompts.general;
    const randomIndex = Math.floor(Math.random() * categoryPrompts.length);

    return categoryPrompts[randomIndex];
  }
}