const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const UserService = require('../services/userService');

/**
 * Generate AI insight for journal entry
 * POST /api/ai/insights
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

    // Check user's tier and permissions
    const permissionCheck = await UserService.canUserGenerateInsight(userId);

    if (!permissionCheck.canGenerate) {
      const error = new Error('Premium subscription required for AI insights');
      error.name = 'SubscriptionError';
      throw error;
    }

    // Get user context for personalized insights
    const [userPreferences, recentEntries, userTier] = await Promise.all([
      UserService.getUserPreferences(userId),
      UserService.getRecentEntries(userId, 3),
      UserService.getUserTier(userId)
    ]);

    // Generate AI insight
    const insight = await aiService.generateInsight({
      content: content.trim(),
      moodRating,
      userPreferences,
      recentEntries,
      subscriptionStatus: userTier.subscriptionStatus
    });

    // Increment usage count for free users
    if (userTier.subscriptionStatus === 'free') {
      await UserService.incrementFreeInsightUsage(userId);
    }

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
    const userId = req.user.id;
    const userTier = await UserService.getUserTier(userId);

    res.json({
      success: true,
      usage: {
        subscriptionStatus: userTier.subscriptionStatus,
        freeInsightsUsed: userTier.freeInsightsUsed,
        remainingFreeInsights: userTier.subscriptionStatus === 'free'
          ? Math.max(0, 3 - userTier.freeInsightsUsed)
          : null,
        isUnlimited: userTier.subscriptionStatus === 'premium'
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