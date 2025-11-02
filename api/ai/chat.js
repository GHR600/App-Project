const { requireAuth } = require('../_utils/auth');
const { checkAIRateLimit } = require('../_utils/rateLimiter');
const AIService = require('../_utils/aiService');
const UserService = require('../_utils/userService');

/**
 * Handle AI chat conversation
 * POST /api/ai/chat
 */
async function chatHandler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    });
  }

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

    // Fetch user's AI style preference, subscription status, and stats
    const aiStyle = await UserService.getUserAIStyle(userId);
    const userTier = await UserService.getUserTier(userId);
    const userPreferences = await UserService.getUserPreferences(userId);
    const userStats = await UserService.getUserStats(userId);

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

    // Initialize AI service
    const aiService = new AIService();

    // Generate chat response using AI service
    const chatResponse = await aiService.generateChatResponse({
      message: lastUserMessage.content,
      journalContext,
      conversationHistory,
      userPreferences,
      subscriptionStatus: userTier.subscriptionStatus,
      aiStyle,
      userStats
    });

    return res.status(200).json({
      success: true,
      response: chatResponse.response,
      source: chatResponse.source,
      model: chatResponse.model
    });

  } catch (error) {
    console.error('Chat service error:', error);
    return res.status(500).json({
      error: 'Chat service error',
      message: 'Failed to generate response. Please try again.',
      code: 'CHAT_GENERATION_FAILED'
    });
  }
}

// Apply authentication and rate limiting middleware
// Note: Vercel serverless functions don't use traditional middleware,
// so we need to wrap our handler
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
  const authHandler = requireAuth(chatHandler);

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
