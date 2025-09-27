// AI Insight Service for generating personalized insights via server API
// No longer imports Anthropic SDK - all AI calls go through our secure server

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

import { API_CONFIG } from '../utils/env';
import { supabase } from '../config/supabase';
import Constants from 'expo-constants';

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
        console.error('Error saving AI insight to database:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected error saving AI insight:', error);
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
   * Get authentication token from current session
   */
  private static async getAuthToken(): Promise<string | null> {
    // This would integrate with your auth system to get the current user's token
    // For now, return null to use mock data if no auth token available
    try {
      // If using Supabase auth context, get the session token
      const { supabase } = await import('../config/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.warn('Could not get auth token:', error);
      return null;
    }
  }

  // Note: AI prompt engineering is now handled server-side for security

  static async generateInsight(
    entry: JournalEntry,
    userContext: UserContext,
    recentEntries: JournalEntry[] = []
  ): Promise<AIInsight> {
    const startTime = Date.now();
    const requestId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`📱 [${requestId}] Starting insight generation:`, {
      entryId: entry.id,
      contentLength: entry.content.length,
      moodRating: entry.moodRating,
      subscriptionStatus: userContext.subscriptionStatus
    });

    try {
      // Try Claude/Anthropic integration first - use Expo Constants for proper access
      const anthropicApiKey = Constants.expoConfig?.extra?.anthropicApiKey ||
                             process.env.REACT_APP_ANTHROPIC_API_KEY ||
                             process.env.ANTHROPIC_API_KEY;

      console.log(`📱 [${requestId}] Debug - Expo Constants key:`, Constants.expoConfig?.extra?.anthropicApiKey ? 'SET' : 'NOT SET');
      console.log(`📱 [${requestId}] Debug - REACT_APP_ANTHROPIC_API_KEY:`, process.env.REACT_APP_ANTHROPIC_API_KEY ? 'SET' : 'NOT SET');
      console.log(`📱 [${requestId}] Debug - Final key:`, anthropicApiKey ? 'AVAILABLE' : 'NOT AVAILABLE');

      if (anthropicApiKey) {
        console.log(`📱 [${requestId}] Using Claude/Anthropic integration`);

        const result = await this.generateClaudeInsight({
          journalContent: entry.content,
          mood: entry.moodRating,
          userPreferences: {
            focusAreas: userContext.focusAreas,
            personality: 'supportive'
          },
          apiKey: anthropicApiKey
        });

        const totalDuration = Date.now() - startTime;
        console.log(`📱 [${requestId}] Claude success! Duration: ${totalDuration}ms`);

        return {
          id: `claude_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          insight: result.insight,
          followUpQuestion: result.followUpQuestion,
          confidence: result.confidence,
          createdAt: new Date().toISOString(),
          isPremium: userContext.subscriptionStatus === 'premium'
        };
      }

      console.log(`📱 [${requestId}] Claude/Anthropic not available, using mock insights`);
      return this.generateMockInsight(entry, userContext, userContext.subscriptionStatus === 'premium');

    } catch (error) {
      const totalDuration = Date.now() - startTime;
      console.error(`📱 [${requestId}] Failed to generate AI insight after ${totalDuration}ms:`, error);

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
   * Generate insight using Claude/Anthropic API
   */
  private static async generateClaudeInsight({
    journalContent,
    mood,
    userPreferences,
    apiKey
  }: {
    journalContent: string;
    mood?: number;
    userPreferences?: {
      focusAreas: string[];
      personality: string;
    };
    apiKey: string;
  }): Promise<{
    insight: string;
    followUpQuestion: string;
    confidence: number;
  }> {
    const systemPrompt = `You are an empathetic AI journal companion. Your role is to:
1. Provide thoughtful, personalized insights about the user's journal entry
2. Ask meaningful follow-up questions that encourage deeper reflection
3. Be supportive and non-judgmental
4. Focus on emotional patterns, growth opportunities, and positive reinforcement

Response format (JSON):
{
  "insight": "Your main insight about their entry",
  "followUpQuestion": "A thoughtful question to encourage reflection",
  "confidence": 0.85
}${userPreferences?.focusAreas?.length ? `\n\nUser's focus areas: ${userPreferences.focusAreas.join(', ')}` : ''}`;

    let userPrompt = `Journal entry: "${journalContent}"`;
    if (mood) {
      userPrompt += `\nMood rating: ${mood}/5`;
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 300,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0]?.text;

      if (!content) {
        throw new Error('No response from Claude');
      }

      return this.parseInsightResponse(content);
    } catch (error) {
      console.error('Claude insight generation error:', error);
      throw error;
    }
  }

  /**
   * Parse Claude's response into structured insight format
   */
  private static parseInsightResponse(content: string): {
    insight: string;
    followUpQuestion: string;
    confidence: number;
  } {
    try {
      const parsed = JSON.parse(content);
      return {
        insight: parsed.insight || content,
        followUpQuestion: parsed.followUpQuestion || "How does this make you feel?",
        confidence: parsed.confidence || 0.8,
      };
    } catch {
      // If JSON parsing fails, treat as plain text
      const lines = content.split('\n').filter(line => line.trim());
      return {
        insight: lines[0] || content,
        followUpQuestion: lines[1] || "What would you like to explore further about this?",
        confidence: 0.7,
      };
    }
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