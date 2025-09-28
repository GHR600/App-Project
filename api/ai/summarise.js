// Vercel API function for AI summarise
const aiService = require('../../server/src/services/aiService');
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

// Environment variable validation and logging
function validateEnvironmentVariables() {
  const requiredEnvVars = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
  };

  const missing = [];
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missing.push(key);
    } else {
      console.log(`✅ ${key}: ${value.substring(0, 8)}...${value.substring(value.length - 4)} (${value.length} chars)`);
    }
  }

  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`;
    console.error('❌ Environment validation failed:', error);
    throw new Error(error);
  }

  console.log('✅ All required environment variables are present');
  return requiredEnvVars;
}

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
  const requestId = `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(`🚀 [${requestId}] Starting AI summary generation`);

  try {
    // Validate environment variables
    const envVars = validateEnvironmentVariables();

    // Initialize Supabase client
    const supabase = createClient(
      envVars.SUPABASE_URL,
      envVars.SUPABASE_SERVICE_ROLE_KEY
    );

    // Authenticate request
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid Bearer token'
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.warn('🔐 Token validation failed:', authError?.message || 'No user found');
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or expired'
      });
    }

    console.log(`✅ User authenticated: ${user.id} (${user.email})`);

    // Validate request body
    const { journalContent, conversationHistory } = req.body;

    if (!journalContent || journalContent.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Journal content is required for summary generation',
        requestId
      });
    }

    if (journalContent.length > 10000) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Journal content is too long (max 10,000 characters)',
        requestId
      });
    }

    console.log(`✅ [${requestId}] Validation passed, calling AI service...`);

    // Generate AI summary
    const summaryParams = {
      journalContent: journalContent.trim(),
      conversationHistory: conversationHistory || [],
      userPreferences: { focusAreas: ['general'] },
      subscriptionStatus: 'free'
    };

    const summary = await aiService.generateSummary(summaryParams);

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Success! Generated summary in ${duration}ms`);

    // Return summary
    return res.status(200).json({
      success: true,
      summary: {
        id: randomUUID(),
        content: summary.summary,
        confidence: summary.confidence,
        source: summary.source,
        model: summary.model,
        createdAt: new Date().toISOString()
      },
      debug: {
        requestId,
        duration,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] Summary generation error after ${duration}ms:`, error);

    return res.status(500).json({
      error: 'AI service error',
      message: 'Failed to generate summary. Please try again.',
      code: 'SUMMARY_GENERATION_FAILED',
      debug: {
        requestId,
        duration,
        timestamp: new Date().toISOString(),
        errorType: error.name
      }
    });
  }
}