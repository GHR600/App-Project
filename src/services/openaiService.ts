import { Alert } from 'react-native';

interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface InsightGenerationParams {
  journalContent: string;
  mood?: number;
  previousInsights?: string[];
  userPreferences?: {
    focusAreas: string[];
    personality: string;
  };
}

interface ChatParams {
  messages: ChatMessage[];
  journalContext?: string;
  maxTokens?: number;
}

class OpenAIService {
  private config: OpenAIConfig | null = null;
  private isConfigured = false;

  configure(config: OpenAIConfig) {
    this.config = config;
    this.isConfigured = true;
  }

  private async makeRequest(endpoint: string, body: any): Promise<any> {
    if (!this.isConfigured || !this.config?.apiKey) {
      throw new Error('OpenAI service not configured. Please set your API key.');
    }

    const response = await fetch(`${this.config.baseURL || 'https://api.openai.com/v1'}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(error.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async generateInsight({
    journalContent,
    mood,
    previousInsights = [],
    userPreferences
  }: InsightGenerationParams): Promise<{
    insight: string;
    followUpQuestion: string;
    confidence: number;
  }> {
    const systemPrompt = this.buildInsightSystemPrompt(userPreferences);
    const userPrompt = this.buildInsightUserPrompt(journalContent, mood, previousInsights);

    try {
      const response: OpenAIResponse = await this.makeRequest('chat/completions', {
        model: this.config?.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return this.parseInsightResponse(content);
    } catch (error) {
      console.error('OpenAI insight generation error:', error);

      // Fallback to mock insight if OpenAI fails
      return this.generateMockInsight(journalContent, mood);
    }
  }

  async chatWithAI({
    messages,
    journalContext,
    maxTokens = 200
  }: ChatParams): Promise<string> {
    const systemPrompt = this.buildChatSystemPrompt(journalContext);

    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    try {
      const response: OpenAIResponse = await this.makeRequest('chat/completions', {
        model: this.config?.model || 'gpt-3.5-turbo',
        messages: chatMessages,
        max_tokens: maxTokens,
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return content.trim();
    } catch (error) {
      console.error('OpenAI chat error:', error);
      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  private buildInsightSystemPrompt(userPreferences?: { focusAreas: string[]; personality: string }): string {
    const basePrompt = `You are an empathetic AI journal companion. Your role is to:
1. Provide thoughtful, personalized insights about the user's journal entry
2. Ask meaningful follow-up questions that encourage deeper reflection
3. Be supportive and non-judgmental
4. Focus on emotional patterns, growth opportunities, and positive reinforcement

Response format (JSON):
{
  "insight": "Your main insight about their entry",
  "followUpQuestion": "A thoughtful question to encourage reflection",
  "confidence": 0.85
}`;

    if (userPreferences?.focusAreas?.length) {
      return `${basePrompt}\n\nUser's focus areas: ${userPreferences.focusAreas.join(', ')}`;
    }

    return basePrompt;
  }

  private buildInsightUserPrompt(content: string, mood?: number, previousInsights: string[] = []): string {
    let prompt = `Journal entry: "${content}"`;

    if (mood) {
      prompt += `\nMood rating: ${mood}/5`;
    }

    if (previousInsights.length > 0) {
      prompt += `\n\nPrevious insights: ${previousInsights.slice(-2).join(' | ')}`;
      prompt += '\n\nProvide a fresh perspective that builds on but doesn\'t repeat previous insights.';
    }

    return prompt;
  }

  private buildChatSystemPrompt(journalContext?: string): string {
    let prompt = `You are a supportive AI companion helping someone with their journaling and self-reflection.
Be empathetic, ask thoughtful questions, and provide gentle guidance. Keep responses concise (1-2 sentences).`;

    if (journalContext) {
      prompt += `\n\nContext from their recent journal entry: "${journalContext}"`;
    }

    return prompt;
  }

  private parseInsightResponse(content: string): {
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

  private generateMockInsight(content: string, mood?: number): {
    insight: string;
    followUpQuestion: string;
    confidence: number;
  } {
    const mockInsights = [
      {
        insight: "Your writing shows a thoughtful reflection on your experiences. It's valuable to take time to process your thoughts and feelings.",
        followUpQuestion: "What patterns do you notice in your daily experiences?",
        confidence: 0.75
      },
      {
        insight: "There's a sense of growth and learning in your words. Personal development often comes through moments of reflection like this.",
        followUpQuestion: "How has your perspective on this situation evolved since it happened?",
        confidence: 0.8
      },
      {
        insight: "Your self-awareness shines through in this entry. Being mindful of your emotions and reactions is a powerful tool for personal growth.",
        followUpQuestion: "What would you tell a friend who was experiencing something similar?",
        confidence: 0.78
      }
    ];

    return mockInsights[Math.floor(Math.random() * mockInsights.length)];
  }

  isAvailable(): boolean {
    return this.isConfigured && !!this.config?.apiKey;
  }

  getUsageStats(): { tokensUsed: number; requestCount: number } {
    // This would be implemented with actual usage tracking
    return { tokensUsed: 0, requestCount: 0 };
  }
}

export const openAIService = new OpenAIService();

// Environment-based configuration
const initializeOpenAI = () => {
  // In a real app, you'd get this from environment variables or user settings
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY || '';

  if (apiKey) {
    openAIService.configure({
      apiKey,
      model: 'gpt-3.5-turbo'
    });
  } else {
    console.warn('OpenAI API key not configured. Using mock responses.');
  }
};

// Auto-initialize
initializeOpenAI();

export default openAIService;