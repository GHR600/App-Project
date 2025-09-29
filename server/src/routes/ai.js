const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
// const UserService = require('../services/userService'); // Temporarily disabled for development
const fetch = require('node-fetch');

/**
 * Generate AI insight for journal entry
 * POST /api/ai/insight (singular endpoint for client compatibility)
 */
router.post('/insight', async (req, res) => {
  try {
    const { content, moodRating, userPreferences, recentEntries, subscriptionStatus } = req.body;
    const userId = req.user.id;

    // Validate request
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Journal content is required'
      });
    }

    if (content.length > 10000) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Journal content is too long (max 10,000 characters)'
      });
    }

    // Generate AI insight using consolidated service
    const insight = await aiService.generateInsight({
      content: content.trim(),
      moodRating,
      userPreferences: userPreferences || { focusAreas: ['general'], personalityType: 'supportive' },
      recentEntries: recentEntries || [],
      subscriptionStatus: subscriptionStatus || 'free'
    });

    // Return insight in expected format
    res.json({
      success: true,
      insight: insight.insight,
      followUpQuestion: insight.followUpQuestion,
      confidence: insight.confidence,
      source: insight.source,
      model: insight.model
    });

  } catch (error) {
    console.error('Insight generation error:', error);
    res.status(500).json({
      error: 'AI service error',
      message: 'Failed to generate insight. Please try again.',
      code: 'INSIGHT_GENERATION_FAILED'
    });
  }
});

/**
 * Generate AI insight for journal entry
 * POST /api/ai/insights (original plural endpoint)
 */
router.post('/insights', async (req, res) => {
  try {
    const { content, moodRating } = req.body;
    const userId = req.user.id;

    // Validate request
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Journal content is required'
      });
    }

    if (content.length > 10000) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Journal content is too long (max 10,000 characters)'
      });
    }

    // Skip user tier checks in development mode
    // const permissionCheck = await UserService.canUserGenerateInsight(userId);
    // if (!permissionCheck.canGenerate) {
    //   const error = new Error('Premium subscription required for AI insights');
    //   error.name = 'SubscriptionError';
    //   throw error;
    // }

    // Use mock user context for development
    const userPreferences = { focusAreas: ['general'], personalityType: 'supportive' };
    const recentEntries = [];
    const userTier = { subscriptionStatus: 'free', freeInsightsUsed: 0 };

    // Generate AI insight
    const insight = await aiService.generateInsight({
      content: content.trim(),
      moodRating,
      userPreferences,
      recentEntries,
      subscriptionStatus: userTier.subscriptionStatus
    });

    // Skip usage tracking in development mode
    // if (userTier.subscriptionStatus === 'free') {
    //   await UserService.incrementFreeInsightUsage(userId);
    // }

    // Return insight with metadata
    res.json({
      success: true,
      insight: {
        insight: insight.insight,
        followUpQuestion: insight.followUpQuestion,
        confidence: insight.confidence,
        source: insight.source,
        model: insight.model,
        isPremium: userTier.subscriptionStatus === 'premium',
        createdAt: new Date().toISOString()
      },
      userContext: {
        subscriptionStatus: userTier.subscriptionStatus,
        remainingFreeInsights: userTier.subscriptionStatus === 'free'
          ? Math.max(0, 2 - userTier.freeInsightsUsed)
          : null
      }
    });

  } catch (error) {
    console.error('Insight generation error:', error);

    // Handle specific error types
    if (error.name === 'SubscriptionError') {
      return res.status(403).json({
        error: 'Premium subscription required',
        message: 'You have used all 3 free insights this month. Upgrade to Premium for unlimited insights.',
        code: 'FREE_LIMIT_EXCEEDED'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Invalid request',
        message: error.message
      });
    }

    // Generic error response
    res.status(500).json({
      error: 'AI service error',
      message: 'Failed to generate insight. Please try again.',
      code: 'INSIGHT_GENERATION_FAILED'
    });
  }
});

/**
 * Get user's AI insight usage stats
 * GET /api/ai/usage
 */
router.get('/usage', async (req, res) => {
  try {
    // Return mock usage stats for development
    res.json({
      success: true,
      usage: {
        subscriptionStatus: 'free',
        freeInsightsUsed: 0,
        remainingFreeInsights: 3,
        isUnlimited: false
      }
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch usage stats',
      message: 'Please try again later'
    });
  }
});

/**
 * Handle AI chat conversation
 * POST /api/ai/chat
 */
router.post('/chat', async (req, res) => {
  try {
    const { messages, journalContext } = req.body;
    const userId = req.user.id;

    // Validate request
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Messages array is required'
      });
    }

    // Build system prompt for chat
    let systemPrompt = `You are a strategic thinking partner in conversation mode. You're chatting with someone about their journal entry and helping them explore their thoughts through dialogue.

Your conversational style should be:
- Analytical but accessible - help them see patterns in their experiences
- Direct and honest - ask probing questions without being harsh
- Strategic and future-focused - connect their thoughts to bigger goals
- Pattern-recognition oriented - help them notice recurring themes
- Practical - guide them toward actionable insights

Keep responses conversational (1-3 sentences) and ask thoughtful follow-up questions that encourage strategic thinking.

AVOID:
- Generic validation without insight
- Long analysis paragraphs (save that for insights)
- Emotional cheerleading
- Surface-level responses

Context from their journal: "{journalContext}"
Previous conversation: {conversationHistory}

Respond naturally as their strategic thinking partner.`;

    if (journalContext) {
      systemPrompt += `\n\nContext from their recent journal entry: "${journalContext}"`;
    }

    // Use Claude for chat if available
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 150,
            system: systemPrompt,
            messages: messages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.content[0]?.text;

          if (content) {
            return res.json({
              success: true,
              response: content.trim()
            });
          }
        }
      } catch (claudeError) {
        console.error('Claude chat error:', claudeError);
      }
    }

    // Fallback to mock response
    const mockResponse = generateMockChatResponse(messages[messages.length - 1]?.content || '', journalContext);
    res.json({
      success: true,
      response: mockResponse
    });

  } catch (error) {
    console.error('Chat service error:', error);
    res.status(500).json({
      error: 'Chat service error',
      message: 'Failed to generate response. Please try again.',
      code: 'CHAT_GENERATION_FAILED'
    });
  }
});

/**
 * Generate mock chat response for fallback
 */
function generateMockChatResponse(userMessage, journalContext) {
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

/**
 * Health check for AI service
 * GET /api/ai/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    aiService: {
      status: 'operational',
      anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
      fallbackAvailable: true
    }
  });
});

module.exports = router;