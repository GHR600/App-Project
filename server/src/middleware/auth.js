const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Authentication middleware to validate user sessions
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // In development mode, allow requests without auth token for testing
    if (process.env.NODE_ENV === 'development' && (!authHeader || !authHeader.startsWith('Bearer '))) {
      console.warn('🚨 Development mode: Allowing request without authentication');
      // Create a mock user for development
      req.user = {
        id: 'dev-user-' + Date.now(),
        email: 'dev@example.com',
        created_at: new Date().toISOString()
      };
      return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid Bearer token'
      });
    }

    const token = authHeader.split(' ')[1];

    // Validate the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      // In development, fall back to mock user if token validation fails
      if (process.env.NODE_ENV === 'development') {
        console.warn('🚨 Development mode: Token validation failed, using mock user');
        req.user = {
          id: 'dev-user-fallback-' + Date.now(),
          email: 'dev-fallback@example.com',
          created_at: new Date().toISOString()
        };
        return next();
      }

      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or expired'
      });
    }

    // Attach user information to request
    req.user = {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    // In development, allow through with mock user
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 Development mode: Auth middleware error, using mock user');
      req.user = {
        id: 'dev-user-error-' + Date.now(),
        email: 'dev-error@example.com',
        created_at: new Date().toISOString()
      };
      return next();
    }

    return res.status(500).json({
      error: 'Authentication error',
      message: 'Failed to validate authentication'
    });
  }
};

module.exports = authMiddleware;