const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const UserService = require('../services/userService');
const { checkAIRateLimit, getRateLimitStatus } = require('../middleware/rateLimiter');
const fetch = require('node-fetch');

/**
 * Generate AI insight for journal entry
 * POST /api/ai/insight (singular endpoint for client compatibility)
 */
router.post('/insight', checkAIRateLimit, async (req, res) => {
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

    // Fetch user's AI style preference from database
    const aiStyle = await UserService.getUserAIStyle(userId);

    // Generate AI insight using consolidated service
    const insight = await aiService.generateInsight({
      content: content.trim(),
      moodRating,
      userPreferences: userPreferences || { focusAreas: ['general'], personalityType: 'supportive' },
      recentEntries: recentEntries || [],
      subscriptionStatus: subscriptionStatus || 'free',
      aiStyle
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
router.post('/insights', checkAIRateLimit, async (req, res) => {
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

    // Fetch user's AI style preference from database
    const aiStyle = await UserService.getUserAIStyle(userId);

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
      subscriptionStatus: userTier.subscriptionStatus,
      aiStyle
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
 * Get user's AI insight usage stats and rate limit status
 * GET /api/ai/usage
 */
router.get('/usage', async (req, res) => {
  try {
    const userId = req.user.id;
    const rateLimitStatus = await getRateLimitStatus(userId);

    res.json({
      success: true,
      usage: {
        subscriptionStatus: rateLimitStatus.isPremium ? 'premium' : 'free',
        limit: rateLimitStatus.limit,
        remaining: rateLimitStatus.remaining,
        resetAt: rateLimitStatus.resetAt,
        isUnlimited: rateLimitStatus.isPremium
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
router.post('/chat', checkAIRateLimit, async (req, res) => {
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

    // Fetch user's AI style preference and subscription status
    const aiStyle = await UserService.getUserAIStyle(userId);
    const userTier = await UserService.getUserTier(userId);
    const userPreferences = await UserService.getUserPreferences(userId);

    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'No user message found'
      });
    }

    // Build conversation history (exclude the last message as it will be the current message)
    const conversationHistory = messages.slice(0, -1);

    // Generate chat response using AI service
    const chatResponse = await aiService.generateChatResponse({
      message: lastUserMessage.content,
      journalContext,
      conversationHistory,
      userPreferences,
      subscriptionStatus: userTier.subscriptionStatus,
      aiStyle
    });

    res.json({
      success: true,
      response: chatResponse.response,
      source: chatResponse.source,
      model: chatResponse.model
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
 * Update user's AI style preference
 * PUT /api/ai/style
 */
router.put('/style', async (req, res) => {
  try {
    const { aiStyle } = req.body;
    const userId = req.user.id;

    // Validate request
    if (!aiStyle || !['coach', 'reflector'].includes(aiStyle)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'AI style must be either "coach" or "reflector"'
      });
    }

    // Update user's AI style in database
    await UserService.updateUserAIStyle(userId, aiStyle);

    res.json({
      success: true,
      aiStyle,
      message: 'AI style updated successfully'
    });

  } catch (error) {
    console.error('AI style update error:', error);
    res.status(500).json({
      error: 'Update failed',
      message: 'Failed to update AI style. Please try again.',
      code: 'AI_STYLE_UPDATE_FAILED'
    });
  }
});

/**
 * Get user's current AI style preference
 * GET /api/ai/style
 */
router.get('/style', async (req, res) => {
  try {
    const userId = req.user.id;
    const aiStyle = await UserService.getUserAIStyle(userId);

    res.json({
      success: true,
      aiStyle
    });

  } catch (error) {
    console.error('AI style fetch error:', error);
    res.status(500).json({
      error: 'Fetch failed',
      message: 'Failed to fetch AI style. Please try again.',
      code: 'AI_STYLE_FETCH_FAILED'
    });
  }
});

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