const { requireAuth } = require('../_utils/auth');
const { checkAIRateLimit } = require('../_utils/rateLimiter');
const AIService = require('../_utils/aiService');
const UserService = require('../_utils/userService');

/**
 * Generate AI summary for journal entry and conversation
 * POST /api/ai/summarise
 */
async function summariseHandler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    });
  }

  try {
    const { journalContent, conversationHistory } = req.body;
    const userId = req.user.id;

    // Validate request
    if (!journalContent || journalContent.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Journal content is required'
      });
    }

    if (journalContent.length > 20000) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Journal content is too long (max 20,000 characters)'
      });
    }

    // Fetch user's AI style preference and subscription status
    const aiStyle = await UserService.getUserAIStyle(userId);
    const userTier = await UserService.getUserTier(userId);
    const userPreferences = await UserService.getUserPreferences(userId);

    // Initialize AI service
    const aiService = new AIService();

    // Generate summary using AI service
    const summaryResponse = await aiService.generateSummary({
      journalContent: journalContent.trim(),
      conversationHistory: conversationHistory || [],
      userPreferences,
      subscriptionStatus: userTier.subscriptionStatus,
      aiStyle
    });

    return res.status(200).json({
      success: true,
      summary: summaryResponse.summary,
      confidence: summaryResponse.confidence,
      source: summaryResponse.source,
      model: summaryResponse.model
    });

  } catch (error) {
    console.error('Summary generation error:', error);
    return res.status(500).json({
      error: 'Summary service error',
      message: 'Failed to generate summary. Please try again.',
      code: 'SUMMARY_GENERATION_FAILED'
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
  const authHandler = requireAuth(summariseHandler);

  // Apply rate limiting by wrapping the auth handler
  return new Promise((resolve) => {
    authHandler(req, res).then(() => {         // Auth FIRST
      checkAIRateLimit(req, res, () => {       // Rate limiter SECOND
        resolve();
      });
    });
  });
}

module.exports = handler;

// Export for Vercel serverless functions
module.exports = handler;
module.exports.default = handler;

// Alternative export that might work better
exports.default = handler;

