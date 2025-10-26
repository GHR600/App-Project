const { getSupabaseClient } = require('./auth');

// In-memory rate limit tracking (use Redis in production for distributed systems)
const rateLimitStore = new Map();

// Rate limit configuration
const FREE_TIER_LIMIT = 10; // 10 AI interactions per day for free users
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Clean up old rate limit entries (run periodically)
 */
function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.resetAt > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldEntries, 60 * 60 * 1000);
}

/**
 * Get user's rate limit data
 */
function getRateLimitData(userId) {
  const key = `rate_limit:${userId}`;
  const now = Date.now();

  if (!rateLimitStore.has(key)) {
    const resetAt = now + RATE_LIMIT_WINDOW;
    rateLimitStore.set(key, {
      count: 0,
      resetAt,
    });
  }

  const data = rateLimitStore.get(key);

  // Reset if window has passed
  if (now > data.resetAt) {
    data.count = 0;
    data.resetAt = now + RATE_LIMIT_WINDOW;
  }

  return data;
}

/**
 * Increment user's rate limit counter
 */
function incrementRateLimit(userId) {
  const data = getRateLimitData(userId);
  data.count += 1;
  return data;
}

/**
 * Rate limiting middleware for AI endpoints
 * Checks user's subscription status and enforces rate limits for free tier
 */
async function checkAIRateLimit(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    }

    // Fetch user's subscription status from database
    const supabase = getSupabaseClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user subscription status:', error);
      // Fail open - allow request if database error
      return next();
    }

    const subscriptionStatus = user?.subscription_status || 'free';

    // Premium users bypass rate limiting
    if (subscriptionStatus === 'premium') {
      // Add headers but don't enforce limit
      res.setHeader('X-RateLimit-Limit', 'unlimited');
      res.setHeader('X-RateLimit-Remaining', 'unlimited');
      res.setHeader('X-RateLimit-Reset', 'never');
      return next();
    }

    // Free tier rate limiting
    const rateLimitData = getRateLimitData(userId);
    const remaining = Math.max(0, FREE_TIER_LIMIT - rateLimitData.count);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', FREE_TIER_LIMIT);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', new Date(rateLimitData.resetAt).toISOString());

    // Check if limit exceeded
    if (rateLimitData.count >= FREE_TIER_LIMIT) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `You've reached your daily limit of ${FREE_TIER_LIMIT} AI interactions. Upgrade to Premium for unlimited access.`,
        code: 'RATE_LIMIT_EXCEEDED',
        limit: FREE_TIER_LIMIT,
        remaining: 0,
        resetAt: new Date(rateLimitData.resetAt).toISOString()
      });
    }

    // Increment counter and proceed
    incrementRateLimit(userId);

    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open - allow request if rate limiting fails
    next();
  }
}

/**
 * Get rate limit status for a user
 * Useful for displaying remaining requests in UI
 */
async function getRateLimitStatus(userId) {
  try {
    // Fetch user's subscription status
    const supabase = getSupabaseClient();
    const { data: user } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', userId)
      .maybeSingle();

    const subscriptionStatus = user?.subscription_status || 'free';

    if (subscriptionStatus === 'premium') {
      return {
        limit: null,
        remaining: null,
        resetAt: null,
        isPremium: true
      };
    }

    const rateLimitData = getRateLimitData(userId);
    const remaining = Math.max(0, FREE_TIER_LIMIT - rateLimitData.count);

    return {
      limit: FREE_TIER_LIMIT,
      remaining,
      resetAt: new Date(rateLimitData.resetAt).toISOString(),
      isPremium: false
    };
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return {
      limit: FREE_TIER_LIMIT,
      remaining: FREE_TIER_LIMIT,
      resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW).toISOString(),
      isPremium: false
    };
  }
}

module.exports = {
  checkAIRateLimit,
  getRateLimitStatus
};
