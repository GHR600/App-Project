const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const getSupabaseClient = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
};

/**
 * Verify and decode authentication token from request
 * Supports both Authorization header and cookies
 */
async function verifyAuth(req) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // If no token in header, check cookies
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      token = cookies['sb-access-token'] || cookies['supabase-auth-token'];
    }

    if (!token) {
      return {
        authenticated: false,
        error: 'No authentication token provided'
      };
    }

    // FIXED: Use the correct method for server-side JWT validation
    const supabase = getSupabaseClient();
    
    // Method 1: Use getUser with the token (this should work)
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('Token validation error:', error.message);
      return {
        authenticated: false,
        error: error?.message || 'Invalid authentication token'
      };
    }

    if (!user) {
      return {
        authenticated: false,
        error: 'Invalid authentication token - no user found'
      };
    }

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        ...user.user_metadata
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: 'Authentication verification failed'
    };
  }
}

/**
 * Middleware wrapper for authentication
 * Returns 401 if authentication fails
 */
function requireAuth(handler) {
  return async (req, res) => {
    console.log('🔐 Auth middleware called');
    console.log('🔐 Headers:', req.headers.authorization ? 'Auth header present' : 'No auth header');
    
    const auth = await verifyAuth(req);

    console.log('🔐 Auth result:', auth.authenticated ? 'SUCCESS' : `FAILED: ${auth.error}`);

    if (!auth.authenticated) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: auth.error || 'User authentication required'
      });
    }

    // Attach user to request object
    req.user = auth.user;
    console.log('🔐 User attached:', req.user.id);

    // Call the actual handler
    return handler(req, res);
  };
}

module.exports = {
  verifyAuth,
  requireAuth,
  getSupabaseClient
};