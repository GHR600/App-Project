const { requireAuth } = require('../_utils/auth');
const { checkAIRateLimit } = require('../_utils/rateLimiter');
const AIService = require('../_utils/aiService');
const UserService = require('../_utils/userService');

/**
 * Generate AI insight for journal entry
 * POST /api/ai/insight (singular endpoint for client compatibility)
 */
async function insightHandler(req, res) {
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

    // Fetch user's AI style preference and stats from database
    const aiStyle = await UserService.getUserAIStyle(userId);
    const userStats = await UserService.getUserStats(userId);

    // Initialize AI service
    const aiService = new AIService();

    // Generate AI insight using consolidated service
    const insight = await aiService.generateInsight({
      content: content.trim(),
      moodRating,
      userPreferences: userPreferences || { focusAreas: ['general'], personalityType: 'supportive' },
      recentEntries: recentEntries || [],
      subscriptionStatus: subscriptionStatus || 'free',
      aiStyle,
      userStats
    });

    // Return insight in expected format
    return res.status(200).json({
      success: true,
      insight: insight.insight,
      followUpQuestion: insight.followUpQuestion,
      confidence: insight.confidence,
      source: insight.source,
      model: insight.model
    });

  } catch (error) {
    console.error('Insight generation error:', error);
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
  const authHandler = requireAuth(insightHandler);

  // Apply rate limiting by wrapping the auth handler
  return new Promise((resolve) => {
    checkAIRateLimit(req, res, async () => {
      await authHandler(req, res);
      resolve();
    });
  });
}

module.exports = handler;
