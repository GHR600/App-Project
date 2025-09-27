const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

class UserService {
  /**
   * Get user's subscription status and usage stats
   */
  static async getUserTier(userId) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('subscription_status, free_insights_used')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch user data: ${error.message}`);
      }

      // Default values for new users or users not in database
      const subscriptionStatus = user?.subscription_status || 'free';
      const freeInsightsUsed = user?.free_insights_used || 0;

      return {
        subscriptionStatus,
        freeInsightsUsed,
        isExistingUser: !!user
      };
    } catch (error) {
      console.error('Error getting user tier:', error);
      throw error;
    }
  }

  /**
   * Check if user can generate an insight based on their tier
   */
  static async canUserGenerateInsight(userId) {
    try {
      const { subscriptionStatus, freeInsightsUsed } = await this.getUserTier(userId);

      // Premium users have unlimited access
      if (subscriptionStatus === 'premium') {
        return {
          canGenerate: true,
          reason: 'premium_access'
        };
      }

      // Free users have 3 insights per month
      if (freeInsightsUsed < 3) {
        return {
          canGenerate: true,
          reason: 'free_quota_available',
          remainingFree: 3 - freeInsightsUsed
        };
      }

      // Free quota exceeded
      return {
        canGenerate: false,
        reason: 'free_quota_exceeded',
        freeInsightsUsed
      };
    } catch (error) {
      console.error('Error checking insight permission:', error);
      // In case of error, allow the request (fail open for better UX)
      return {
        canGenerate: true,
        reason: 'error_fallback'
      };
    }
  }

  /**
   * Increment user's free insight usage count
   */
  static async incrementFreeInsightUsage(userId) {
    try {
      const { subscriptionStatus, freeInsightsUsed, isExistingUser } = await this.getUserTier(userId);

      // Only increment for free users
      if (subscriptionStatus !== 'free') {
        return;
      }

      if (isExistingUser) {
        // Update existing user
        await supabase
          .from('users')
          .update({
            free_insights_used: freeInsightsUsed + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      } else {
        // Create new user record
        await supabase
          .from('users')
          .insert({
            id: userId,
            subscription_status: 'free',
            free_insights_used: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      console.log(`Incremented free insight usage for user ${userId}: ${freeInsightsUsed + 1}/3`);
    } catch (error) {
      console.error('Error incrementing insight usage:', error);
      // Don't throw error - insight generation should still work
    }
  }

  /**
   * Get user's recent journal entries for context
   */
  static async getRecentEntries(userId, limit = 3) {
    try {
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('id, content, mood_rating, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Error fetching recent entries:', error);
        return [];
      }

      return entries || [];
    } catch (error) {
      console.error('Error getting recent entries:', error);
      return [];
    }
  }

  /**
   * Get user preferences for AI insight personalization
   */
  static async getUserPreferences(userId) {
    try {
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('focus_areas, personality_type')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching user preferences:', error);
      }

      return {
        focusAreas: preferences?.focus_areas || ['general'],
        personalityType: preferences?.personality_type || 'balanced'
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {
        focusAreas: ['general'],
        personalityType: 'balanced'
      };
    }
  }
}

module.exports = UserService;