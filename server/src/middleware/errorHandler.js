/**
 * Global error handling middleware
 */
const errorHandler = (error, req, res, next) => {
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Anthropic API errors
  if (error.name === 'AnthropicError') {
    return res.status(502).json({
      error: 'AI service temporarily unavailable',
      message: 'Please try again in a moment',
      code: 'AI_SERVICE_ERROR'
    });
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Invalid request data',
      message: error.message,
      code: 'VALIDATION_ERROR'
    });
  }

  // Rate limit errors
  if (error.name === 'TooManyRequestsError') {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_ERROR'
    });
  }

  // Subscription/tier errors
  if (error.name === 'SubscriptionError') {
    return res.status(403).json({
      error: 'Subscription required',
      message: error.message,
      code: 'SUBSCRIPTION_ERROR'
    });
  }

  // Default server error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    code: 'INTERNAL_ERROR'
  });
};

module.exports = errorHandler;