const { requireAuth } = require('../_utils/auth');
const { checkAIRateLimit } = require('../_utils/rateLimiter');
const AIService = require('../_utils/aiService');
const UserService = require('../_utils/userService');

/**
 * Generate AI insight for journal entry
 * POST /api/ai/insights (original plural endpoint)
 */
async function insightsHandler(req, res) {
  // Only allow POST requests

  console.log('🔍 SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
  console.log('🔍 SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('🔍 Auth header:', req.headers.authorization?.substring(0, 20) + '...');
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    });
  }

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

    // Initialize AI service
    const aiService = new AIService();

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
    return res.status(200).json({
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
    return res.status(500).json({
      error: 'AI service error',
      message: 'Failed to generate insight. Please try again.',
      code: 'INSIGHT_GENERATION_FAILED'
    });
  }
}

// Apply authentication and rate limiting middleware
async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apply authentication
  const authHandler = requireAuth(insightsHandler);

  // Apply rate limiting by wrapping the auth handler
  return new Promise((resolve) => {
    checkAIRateLimit(req, res, async () => {
      await authHandler(req, res);
      resolve();
    });
  });
}

module.exports = handler;
