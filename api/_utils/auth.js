const { createClient } = require('@supabase/supabase-js');

console.log('🔧 AUTH.JS LOADED - Environment check:', {
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseUrlPreview: process.env.SUPABASE_URL?.substring(0, 30) + '...',
});

// Initialize Supabase client
const getSupabaseClient = () => {
  console.log('🔧 Creating Supabase client...');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase environment variables:', {
      hasUrl: !!process.env.SUPABASE_URL,
      hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });
    throw new Error('Missing Supabase environment variables');
  }

  try {
    const client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    console.log('✅ Supabase client created successfully');
    return client;
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    throw error;
  }
};

/**
 * Verify and decode authentication token from request
 */
async function verifyAuth(req) {
  console.log('🔐 Starting auth verification...');
  
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    console.log('🔐 Auth header present:', !!authHeader);
    
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('🔐 Bearer token extracted, length:', token.length);
    }

    // If no token in header, check cookies
    if (!token && req.headers.cookie) {
      console.log('🔐 Checking cookies for token...');
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      token = cookies['sb-access-token'] || cookies['supabase-auth-token'];
      if (token) {
        console.log('🔐 Token found in cookies');
      }
    }

    if (!token) {
      console.log('❌ No authentication token found');
      return {
        authenticated: false,
        error: 'No authentication token provided'
      };
    }

    console.log('🔐 Token found, attempting validation...');
    
    // Verify token with Supabase
    const supabase = getSupabaseClient();
    console.log('🔐 Supabase client ready, calling getUser...');
    
    const { data: { user }, error } = await supabase.auth.getUser(token);

    console.log('🔐 getUser result:', {
      hasUser: !!user,
      hasError: !!error,
      errorMessage: error?.message,
      userId: user?.id
    });

    if (error) {
      console.error('❌ Token validation error:', error.message);
      return {
        authenticated: false,
        error: error?.message || 'Invalid authentication token'
      };
    }

    if (!user) {
      console.log('❌ No user found for valid token');
      return {
        authenticated: false,
        error: 'Invalid authentication token - no user found'
      };
    }

    console.log('✅ Authentication successful for user:', user.id);
    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        ...user.user_metadata
      }
    };
  } catch (error) {
    console.error('❌ Authentication verification failed:', error);
    return {
      authenticated: false,
      error: 'Authentication verification failed: ' + error.message
    };
  }
}

/**
 * Middleware wrapper for authentication
 */
function requireAuth(handler) {
  return async (req, res) => {
    console.log('🔐 requireAuth middleware called');
    
    const auth = await verifyAuth(req);

    console.log('🔐 Auth result:', {
      authenticated: auth.authenticated,
      error: auth.error,
      userId: auth.user?.id
    });

    if (!auth.authenticated) {
      console.log('❌ Authentication failed, returning 401');
      return res.status(401).json({
        error: 'Unauthorized',
        message: auth.error || 'User authentication required'
      });
    }

    // Attach user to request object
    req.user = auth.user;
    console.log('✅ User attached to request:', req.user.id);

    // Call the actual handler
    console.log('🔐 Calling protected handler...');
    return handler(req, res);
  };
}

module.exports = {
  verifyAuth,
  requireAuth,
  getSupabaseClient
};