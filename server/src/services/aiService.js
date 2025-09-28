const Anthropic = require('@anthropic-ai/sdk');

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
    subscriptionStatus
  }) {
    try {
      // Use real Claude API if available
      if (this.anthropic) {
        return await this.generateClaudeInsight({
          content,
          moodRating,
          userPreferences,
          recentEntries,
          subscriptionStatus
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
    subscriptionStatus
  }) {
    const startTime = Date.now();
    const isPremium = subscriptionStatus === 'premium';
    const model = isPremium ? 'claude-3-sonnet-20240229' : 'claude-3-haiku-20240307';

    console.log('🤖 Claude AI - Starting insight generation:', {
      model,
      isPremium,
      contentLength: content.length,
      moodRating,
      hasPreferences: !!userPreferences,
      recentEntriesCount: recentEntries.length
    });

    const prompt = this.buildPrompt({
      content,
      moodRating,
      userPreferences,
      recentEntries,
      isPremium
    });

    console.log('🤖 Claude AI - Built prompt:', {
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 200) + '...'
    });

    try {
      console.log('🤖 Claude AI - Calling API with params:', {
        model,
        max_tokens: isPremium ? 500 : 300,
        temperature: 0.7,
        messageCount: 1
      });

      const response = await this.anthropic.messages.create({
        model,
        max_tokens: isPremium ? 500 : 300,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const duration = Date.now() - startTime;
      console.log('🤖 Claude AI - Received response:', {
        duration: `${duration}ms`,
        id: response.id,
        model: response.model,
        contentCount: response.content?.length,
        usage: response.usage,
        stopReason: response.stop_reason
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent) {
        console.error('🤖 Claude AI - No text content in response:', {
          response: response,
          contentTypes: response.content?.map(c => c.type)
        });
        throw new Error('No text content in Claude response');
      }

      console.log('🤖 Claude AI - Raw response text:', {
        length: textContent.text.length,
        preview: textContent.text.substring(0, 300),
        startsWithBrace: textContent.text.trim().startsWith('{'),
        endsWithBrace: textContent.text.trim().endsWith('}')
      });

      // Try to parse JSON response
      try {
        console.log('🤖 Claude AI - Attempting JSON parse...');
        const parsed = JSON.parse(textContent.text);

        console.log('🤖 Claude AI - JSON parsed successfully:', {
          hasInsight: !!parsed.insight,
          hasFollowUpQuestion: !!parsed.followUpQuestion,
          confidence: parsed.confidence,
          insightLength: parsed.insight?.length,
          questionLength: parsed.followUpQuestion?.length
        });

        if (!parsed.insight || !parsed.followUpQuestion) {
          console.error('🤖 Claude AI - Invalid JSON structure:', {
            hasInsight: !!parsed.insight,
            hasFollowUpQuestion: !!parsed.followUpQuestion,
            parsedKeys: Object.keys(parsed)
          });
          throw new Error('Invalid JSON structure');
        }

        return {
          insight: parsed.insight,
          followUpQuestion: parsed.followUpQuestion,
          confidence: parsed.confidence || 0.85,
          source: 'claude',
          model: model
        };
      } catch (parseError) {
        console.warn('🤖 Claude AI - JSON parsing failed, using text fallback:', {
          parseError: parseError.message,
          rawTextLength: textContent.text.length,
          rawTextSample: textContent.text.substring(0, 100)
        });

        // If JSON parsing fails, extract insight from raw text
        const text = textContent.text.trim();
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

        console.log('🤖 Claude AI - Text fallback processing:', {
          totalSentences: sentences.length,
          firstSentence: sentences[0]?.substring(0, 50),
          lastSentence: sentences[sentences.length - 1]?.substring(0, 50)
        });

        const insight = sentences.slice(0, -1).join('. ').trim() + '.';
        const followUpQuestion = sentences[sentences.length - 1].trim();

        const fallbackResult = {
          insight: insight || text,
          followUpQuestion: followUpQuestion.includes('?')
            ? followUpQuestion
            : "What would you like to explore further about this reflection?",
          confidence: 0.8,
          source: 'claude',
          model: model
        };

        console.log('🤖 Claude AI - Fallback result:', {
          insightLength: fallbackResult.insight.length,
          questionLength: fallbackResult.followUpQuestion.length,
          confidence: fallbackResult.confidence
        });

        return fallbackResult;
      }
    } catch (claudeError) {
      const duration = Date.now() - startTime;
      console.error('🤖 Claude API error after', `${duration}ms:`, {
        name: claudeError.name,
        message: claudeError.message,
        status: claudeError.status,
        headers: claudeError.headers,
        error: claudeError.error,
        type: claudeError.error?.type,
        param: claudeError.error?.param,
        code: claudeError.code
      });

      // Enhanced error logging for different error types
      if (claudeError.status === 401) {
        console.error('🤖 Claude API - Authentication error. Check API key validity.');
      } else if (claudeError.status === 429) {
        console.error('🤖 Claude API - Rate limit exceeded. Consider implementing backoff strategy.');
      } else if (claudeError.status === 400) {
        console.error('🤖 Claude API - Bad request. Check prompt format and parameters.');
      } else if (claudeError.status >= 500) {
        console.error('🤖 Claude API - Server error. This may be temporary.');
      }

      throw claudeError;
    }
  }

  /**
   * Build prompt for Claude AI
   */
  buildPrompt({ content, moodRating, userPreferences, recentEntries, isPremium }) {
  const focusAreasText = userPreferences?.focusAreas?.join(', ') || 'General well-being';
  const moodText = moodRating ? `${moodRating}/5` : 'Not specified';
  const recentEntriesText = recentEntries?.length > 0 
    ? recentEntries.map(entry => `"${entry.content.substring(0, 150)}..."`).join('\n')
    : 'No recent entries available';
  const premiumContext = isPremium 
    ? '\n- Premium subscriber: Provide deeper strategic analysis and long-term pattern recognition'
    : '\n- Free tier: Focus on immediate insights and actionable steps';

  return `You are a strategic thinking partner who responds to journal entries with analytical depth and practical guidance. Your tone should be:

ANALYTICAL BUT ACCESSIBLE
- Break down complex situations into clear patterns and frameworks
- Identify underlying systems and root causes, not just surface symptoms
- Use structured thinking but explain it in plain language

DIRECT AND HONEST
- Skip flattery and motivational platitudes
- Give candid assessments even when they might be uncomfortable
- Focus on actionable truth over emotional comfort

STRATEGIC AND FUTURE-FOCUSED
- Connect immediate experiences to longer-term goals and patterns
- Suggest tactical next steps while keeping strategic objectives in view
- Help identify what's worth optimizing vs. what to ignore

PATTERN-RECOGNITION ORIENTED
- Look for recurring themes across different life areas
- Connect seemingly unrelated experiences to show larger trends
- Help the user understand their own behavioral and decision-making patterns

PRACTICAL AND IMPLEMENTATION-FOCUSED
- Always end with specific, actionable steps
- Distinguish between immediate actions (next 30 days) and longer-term positioning
- Provide concrete frameworks for decision-making

TONE CHARACTERISTICS:
- Confident but not prescriptive - offer analysis and let the user decide
- Intellectually curious about the user's experiences and motivations
- Respectful of complexity while pushing for clarity
- Supportive of the user's goals without being a cheerleader

AVOID:
- Generic advice or obvious observations
- Emotional validation without practical insight
- Analysis paralysis - always provide clear next steps
- Treating symptoms instead of addressing root causes

User Context:
- Focus areas: ${focusAreasText}
- Current mood: ${moodText}
- Personality type: ${userPreferences?.personalityType || 'Not specified'}${premiumContext}

Current Entry:
"${content}"

Recent Context:
${recentEntriesText}

Please respond with EXACTLY this JSON format:
{
  "insight": "Your ${isPremium ? '75-150' : '75-125'} word strategic analysis identifying 2-3 key patterns with specific, actionable next steps",
  "followUpQuestion": "One strategic follow-up question that helps identify optimization opportunities or decision-making frameworks",
  "confidence": 0.85
}

Requirements:
- Identify 2-3 key patterns or insights from the entry
- Connect these patterns to broader goals and life context
- Provide specific, actionable next steps (immediate and longer-term)
- Be direct and analytical without being cold or clinical
- Confidence should be between 0.7-0.95
- ${isPremium ? 'Provide deeper pattern analysis across life areas and strategic positioning' : 'Focus on immediate patterns and tactical next steps'}`;
}

  /**
   * Generate sophisticated mock insights
   */
  generateMockInsight({ content, moodRating, userPreferences, subscriptionStatus }) {
    const isPremium = subscriptionStatus === 'premium';
    const primaryFocus = userPreferences.focusAreas[0] || 'general';

    // Analyze content for keywords and sentiment
    const contentLower = content.toLowerCase();
    const isWorkRelated = /work|job|career|boss|colleague|meeting|project|deadline/.test(contentLower);
    const isRelationshipRelated = /friend|family|partner|relationship|love|social|connect/.test(contentLower);
    const isStressRelated = /stress|anxious|worried|overwhelm|pressure|tired/.test(contentLower);
    const isPositive = moodRating >= 4;
    const isNegative = moodRating <= 2;

    let category = primaryFocus;
    if (isWorkRelated) category = 'career';
    if (isRelationshipRelated) category = 'relationships';
    if (isStressRelated) category = 'wellbeing';

    const insights = this.getInsightTemplates(isPremium);
    const categoryInsights = insights[category] || insights.general;

    // Select insight based on mood and content analysis
    let selectedInsight;
    if (isPositive) {
      selectedInsight = categoryInsights.positive[Math.floor(Math.random() * categoryInsights.positive.length)];
    } else if (isNegative) {
      selectedInsight = categoryInsights.negative[Math.floor(Math.random() * categoryInsights.negative.length)];
    } else {
      selectedInsight = categoryInsights.neutral[Math.floor(Math.random() * categoryInsights.neutral.length)];
    }

    return {
      insight: selectedInsight.insight,
      followUpQuestion: selectedInsight.followUpQuestion,
      confidence: selectedInsight.confidence,
      source: 'mock',
      model: 'internal'
    };
  }

  /**
   * Get mood description from rating
   */
  getMoodDescription(moodRating) {
    if (!moodRating) return 'No mood specified';

    const moodMap = {
      1: 'Very low (😢)',
      2: 'Low (😕)',
      3: 'Neutral (😐)',
      4: 'Good (😊)',
      5: 'Great (😄)'
    };

    return moodMap[moodRating] || 'Unknown';
  }

  /**
   * Comprehensive insight templates for different categories and tiers
   */
  getInsightTemplates(isPremium) {
    const templates = {
      career: {
        positive: [
          {
            insight: isPremium
              ? "Your enthusiasm about work achievements reflects strong intrinsic motivation. This pattern suggests you thrive when your values align with your tasks. The satisfaction you describe indicates you're in a growth phase professionally."
              : "Your work satisfaction shows you're aligned with your goals. This positive energy can fuel further growth and meaningful achievements.",
            followUpQuestion: "What specific aspects of this success can you replicate in future projects?",
            confidence: 0.88
          }
        ],
        negative: [
          {
            insight: isPremium
              ? "The work frustration you're experiencing seems tied to misaligned expectations or values. Your language suggests this isn't just a bad day, but potentially a signal that your current role needs adjustment or boundary-setting."
              : "Work stress often signals a mismatch between expectations and reality. Consider what small changes could improve your daily experience.",
            followUpQuestion: "What would need to change for work to feel more aligned with your values?",
            confidence: 0.82
          }
        ],
        neutral: [
          {
            insight: isPremium
              ? "Your measured reflection about work suggests you're in an evaluation phase. This neutral stance often precedes important career decisions. Your thoughtful approach indicates you're processing changes mindfully."
              : "Your balanced perspective on work shows healthy reflection. This neutral space can be valuable for planning your next steps.",
            followUpQuestion: "What career direction feels most authentic to you right now?",
            confidence: 0.85
          }
        ]
      },
      relationships: {
        positive: [
          {
            insight: isPremium
              ? "The connection you describe reveals your capacity for meaningful relationships. Your appreciation for others suggests strong emotional intelligence and the ability to create lasting bonds. These relationships seem to energize rather than drain you."
              : "Your positive connections show your strength in building meaningful relationships. These bonds are clearly a source of energy and growth for you.",
            followUpQuestion: "How can you nurture and expand these meaningful connections in your life?",
            confidence: 0.91
          }
        ],
        negative: [
          {
            insight: isPremium
              ? "The relationship challenges you're facing seem to trigger deeper questions about boundaries and self-worth. Your awareness of these patterns suggests you're ready to address underlying dynamics rather than just surface conflicts."
              : "Relationship difficulties often reflect boundary needs or communication gaps. Your awareness is the first step toward positive change.",
            followUpQuestion: "What boundaries would help you feel more secure in your relationships?",
            confidence: 0.79
          }
        ],
        neutral: [
          {
            insight: isPremium
              ? "Your balanced view of relationships suggests you're integrating past experiences with future hopes. This reflective space often leads to more conscious choices about who you invest your emotional energy with."
              : "Your thoughtful approach to relationships shows emotional maturity. This reflection can guide you toward healthier connections.",
            followUpQuestion: "What qualities do you value most in your closest relationships?",
            confidence: 0.86
          }
        ]
      },
      general: {
        positive: [
          {
            insight: isPremium
              ? "Your positive outlook and self-awareness shine through your writing. You're demonstrating resilience and the ability to find meaning in daily experiences. This mindset creates a foundation for continued growth and well-being."
              : "Your positive energy and self-reflection create a strong foundation for personal growth. You're clearly developing emotional awareness.",
            followUpQuestion: "What practices help you maintain this positive perspective during challenging times?",
            confidence: 0.87
          }
        ],
        negative: [
          {
            insight: isPremium
              ? "The challenges you're facing seem to be pushing you toward important self-discovery. Your willingness to examine difficult emotions suggests inner strength. This period of struggle often precedes significant personal breakthroughs."
              : "Difficult emotions often contain important messages about our needs and values. Your willingness to explore them shows courage and self-awareness.",
            followUpQuestion: "What is this challenging experience trying to teach you about yourself?",
            confidence: 0.81
          }
        ],
        neutral: [
          {
            insight: isPremium
              ? "Your balanced emotional state suggests you're integrating recent experiences thoughtfully. This neutral ground often provides clarity and perspective that extreme emotional states can obscure. You seem to be processing life changes mindfully."
              : "Your balanced perspective allows for clear thinking and thoughtful decision-making. This emotional equilibrium is valuable for processing experiences.",
            followUpQuestion: "What insights are emerging as you reflect on recent changes in your life?",
            confidence: 0.84
          }
        ]
      }
    };

    return templates;
  }
}

module.exports = new AIService();