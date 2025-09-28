// Vercel API function for AI insights (singular endpoint for client compatibility)
const aiService = require('../../server/src/services/aiService');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(`🚀 [${requestId}] Starting AI insight generation (singular endpoint)`);

  try {
    // Development mode: Skip authentication for testing
    if (process.env.NODE_ENV === 'development' || !req.headers.authorization) {
      console.log('🚨 Development mode: Allowing request without authentication');
    }

    // Validate request body
    const { content, moodRating, userPreferences, recentEntries, subscriptionStatus } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Journal content is required',
        requestId
      });
    }

    if (content.length > 10000) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Journal content is too long (max 10,000 characters)',
        requestId
      });
    }

    console.log(`✅ [${requestId}] Validation passed, calling AI service...`);

    // Generate AI insight
    const insightParams = {
      content: content.trim(),
      moodRating,
      userPreferences: userPreferences || { focusAreas: ['general'], personalityType: 'supportive' },
      recentEntries: recentEntries || [],
      subscriptionStatus: subscriptionStatus || 'free'
    };

    const insight = await aiService.generateInsight(insightParams);

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Success! Generated insight in ${duration}ms`);

    // Return insight in expected format
    return res.status(200).json({
      success: true,
      insight: insight.insight,
      followUpQuestion: insight.followUpQuestion,
      confidence: insight.confidence,
      source: insight.source,
      model: insight.model,
      debug: {
        requestId,
        duration,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] Insight generation error after ${duration}ms:`, error);

    return res.status(500).json({
      error: 'AI service error',
      message: 'Failed to generate insight. Please try again.',
      code: 'INSIGHT_GENERATION_FAILED',
      debug: {
        requestId,
        duration,
        timestamp: new Date().toISOString(),
        errorType: error.name
      }
    });
  }
}