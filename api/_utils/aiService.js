const Anthropic = require('@anthropic-ai/sdk');
const {
  getInsightPrompt,
  getChatPrompt,
  getSummaryPrompt,
} = require('./aiPrompts');

class AIService {
  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('ANTHROPIC_API_KEY not configured - AI insights will use fallback responses');
      this.anthropic = null;
    } else {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
  }

  /**
   * Generate AI insight for journal entry
   */
  async generateInsight({
    content,
    moodRating,
    userPreferences,
    recentEntries,
    subscriptionStatus,
    aiStyle = 'reflector',
    userStats
  }) {
    try {
      // Use real Claude API if available
      if (this.anthropic) {
        return await this.generateClaudeInsight({
          content,
          moodRating,
          userPreferences,
          recentEntries,
          subscriptionStatus,
          aiStyle,
          userStats
        });
      }

      // Fallback to sophisticated mock insights
      return this.generateMockInsight({
        content,
        moodRating,
        userPreferences,
        subscriptionStatus
      });
    } catch (error) {
      console.error('AI insight generation failed:', error);

      // Fallback to mock on any error
      return this.generateMockInsight({
        content,
        moodRating,
        userPreferences,
        subscriptionStatus
      });
    }
  }

  /**
   * Generate insight using Claude AI
   */
  async generateClaudeInsight({
    content,
    moodRating,
    userPreferences,
    recentEntries,
    subscriptionStatus,
    aiStyle = 'reflector',
    userStats
  }) {
    const startTime = Date.now();
    const isPremium = subscriptionStatus === 'premium';

    console.log('🤖 Claude AI - Starting insight generation:', {
      aiStyle,
      isPremium,
      contentLength: content.length,
      moodRating,
      hasPreferences: !!userPreferences,
      recentEntriesCount: recentEntries?.length || 0,
      hasUserStats: !!userStats
    });

    // Use centralized prompt builder
    const promptConfig = getInsightPrompt({
      style: aiStyle,
      entry: content,
      moodRating,
      recentEntries,
      userPreferences,
      isPremium,
      userStats
    });

    try {
      const response = await this.anthropic.messages.create({
        model: promptConfig.model,
        max_tokens: promptConfig.maxTokens,
        temperature: 0.7,
        system: promptConfig.systemPrompt,
        messages: [{
          role: 'user',
          content: promptConfig.userMessage
        }]
      });

      const duration = Date.now() - startTime;
      console.log('🤖 Claude AI - Received response:', {
        duration: `${duration}ms`,
        id: response.id,
        model: response.model,
        usage: response.usage
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent) {
        throw new Error('No text content in Claude response');
      }

      // Try to parse JSON response
      try {
        const parsed = JSON.parse(textContent.text);

        if (!parsed.insight || !parsed.followUpQuestion) {
          throw new Error('Invalid JSON structure');
        }

        return {
          insight: parsed.insight,
          followUpQuestion: parsed.followUpQuestion,
          confidence: parsed.confidence || 0.85,
          source: 'claude',
          model: promptConfig.model
        };
      } catch (parseError) {
        console.warn('🤖 Claude AI - JSON parsing failed, using text fallback');

        // If JSON parsing fails, extract insight from raw text
        const text = textContent.text.trim();
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

        const insight = sentences.slice(0, -1).join('. ').trim() + '.';
        const followUpQuestion = sentences[sentences.length - 1].trim();

        return {
          insight: insight || text,
          followUpQuestion: followUpQuestion.includes('?')
            ? followUpQuestion
            : "What would you like to explore further about this reflection?",
          confidence: 0.8,
          source: 'claude',
          model: promptConfig.model
        };
      }
    } catch (claudeError) {
      const duration = Date.now() - startTime;
      console.error('🤖 Claude API error after', `${duration}ms:`, {
        message: claudeError.message,
        status: claudeError.status
      });

      throw claudeError;
    }
  }

  /**
   * Generate sophisticated mock insights
   */
  generateMockInsight({ content, moodRating, userPreferences, subscriptionStatus }) {
    const isPremium = subscriptionStatus === 'premium';

    return {
      insight: isPremium
        ? "Your reflections show deep self-awareness and a willingness to explore your inner landscape. This mindful approach often leads to meaningful personal growth and emotional clarity."
        : "Your reflections reveal important patterns about your emotional landscape. This awareness is the first step toward meaningful growth.",
      followUpQuestion: "What patterns are you noticing in your recent experiences?",
      confidence: 0.75,
      source: 'mock',
      model: 'internal'
    };
  }

  /**
   * Generate chat response using Claude AI
   */
  async generateChatResponse({
    message,
    journalContext,
    conversationHistory,
    userPreferences,
    subscriptionStatus,
    aiStyle = 'reflector',
    userStats
  }) {
    try {
      // Use real Claude API if available
      if (this.anthropic) {
        return await this.generateClaudeChatResponse({
          message,
          journalContext,
          conversationHistory,
          userPreferences,
          subscriptionStatus,
          aiStyle,
          userStats
        });
      }

      // Fallback to mock chat response
      return this.generateMockChatResponse(message, journalContext);
    } catch (error) {
      console.error('AI chat response generation failed:', error);

      // Fallback to mock on any error
      return this.generateMockChatResponse(message, journalContext);
    }
  }

  /**
   * Generate chat response using Claude AI
   */
  async generateClaudeChatResponse({
    message,
    journalContext,
    conversationHistory,
    userPreferences,
    subscriptionStatus,
    aiStyle = 'reflector',
    userStats
  }) {
    const startTime = Date.now();
    const isPremium = subscriptionStatus === 'premium';

    console.log('🤖 Claude AI - Starting chat response generation:', {
      aiStyle,
      isPremium,
      messageLength: message.length,
      hasUserStats: !!userStats
    });

    // Use centralized prompt builder
    const promptConfig = getChatPrompt({
      style: aiStyle,
      message,
      journalContext,
      conversationHistory,
      userPreferences,
      isPremium,
      userStats
    });

    try {
      const response = await this.anthropic.messages.create({
        model: promptConfig.model,
        max_tokens: promptConfig.maxTokens,
        temperature: 0.7,
        system: promptConfig.systemPrompt,
        messages: [{
          role: 'user',
          content: promptConfig.userMessage
        }]
      });

      const duration = Date.now() - startTime;
      console.log('🤖 Claude AI - Chat response received:', {
        duration: `${duration}ms`,
        id: response.id
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent) {
        throw new Error('No text content in Claude response');
      }

      return {
        response: textContent.text.trim(),
        confidence: 0.85,
        source: 'claude',
        model: promptConfig.model
      };
    } catch (claudeError) {
      const duration = Date.now() - startTime;
      console.error('🤖 Claude API chat error after', `${duration}ms:`, claudeError);
      throw claudeError;
    }
  }

  /**
   * Generate mock chat response
   */
  generateMockChatResponse(userMessage, journalContext) {
    return {
      response: "That's a valuable insight. What patterns might this reveal about your decision-making framework?",
      confidence: 0.75,
      source: 'mock',
      model: 'internal'
    };
  }

  /**
   * Generate summary using Claude AI
   */
  async generateSummary({
    journalContent,
    conversationHistory,
    userPreferences,
    subscriptionStatus,
    aiStyle = 'reflector'
  }) {
    try {
      // Use real Claude API if available
      if (this.anthropic) {
        return await this.generateClaudeSummary({
          journalContent,
          conversationHistory,
          userPreferences,
          subscriptionStatus,
          aiStyle
        });
      }

      // Fallback to mock summary
      return this.generateMockSummary(journalContent, conversationHistory);
    } catch (error) {
      console.error('AI summary generation failed:', error);

      // Fallback to mock on any error
      return this.generateMockSummary(journalContent, conversationHistory);
    }
  }

  /**
   * Generate summary using Claude AI
   */
  async generateClaudeSummary({
    journalContent,
    conversationHistory,
    userPreferences,
    subscriptionStatus,
    aiStyle = 'reflector'
  }) {
    const startTime = Date.now();
    const isPremium = subscriptionStatus === 'premium';

    console.log('🤖 Claude AI - Starting summary generation:', {
      aiStyle,
      isPremium,
      journalContentLength: journalContent.length
    });

    // Use centralized prompt builder
    const promptConfig = getSummaryPrompt({
      style: aiStyle,
      journalContent,
      conversationHistory,
      userPreferences,
      isPremium
    });

    try {
      const response = await this.anthropic.messages.create({
        model: promptConfig.model,
        max_tokens: promptConfig.maxTokens,
        temperature: 0.7,
        system: promptConfig.systemPrompt,
        messages: [{
          role: 'user',
          content: promptConfig.userMessage
        }]
      });

      const duration = Date.now() - startTime;
      console.log('🤖 Claude AI - Summary response received:', {
        duration: `${duration}ms`,
        id: response.id
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent) {
        throw new Error('No text content in Claude response');
      }

      return {
        summary: textContent.text.trim(),
        confidence: 0.9,
        source: 'claude',
        model: promptConfig.model
      };
    } catch (claudeError) {
      const duration = Date.now() - startTime;
      console.error('🤖 Claude API summary error after', `${duration}ms:`, claudeError);
      throw claudeError;
    }
  }

  /**
   * Generate mock summary
   */
  generateMockSummary(journalContent, conversationHistory) {
    return {
      summary: '• Reflected on personal experiences and emotional patterns\n• Explored themes of growth and self-awareness\n• Considered future goals and next steps',
      confidence: 0.75,
      source: 'mock',
      model: 'internal'
    };
  }
}

module.exports = AIService;
