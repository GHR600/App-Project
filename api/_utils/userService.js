const { getSupabaseClient } = require('./auth');

class UserService {
  /**
   * Get user's subscription status and usage stats
   */
  static async getUserTier(userId) {
    try {
      const supabase = getSupabaseClient();
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
   * Get user's recent journal entries for context
   */
  static async getRecentEntries(userId, limit = 3) {
    try {
      const supabase = getSupabaseClient();
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
      const supabase = getSupabaseClient();
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

  /**
   * Get user's AI style preference (Coach vs Reflector)
   */
  static async getUserAIStyle(userId) {
    try {
      const supabase = getSupabaseClient();
      const { data: user, error } = await supabase
        .from('users')
        .select('ai_style')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching user AI style:', error);
      }

      return user?.ai_style || 'reflector';
    } catch (error) {
      console.error('Error getting user AI style:', error);
      return 'reflector';
    }
  }

  /**
   * Update user's AI style preference
   */
  static async updateUserAIStyle(userId, aiStyle) {
    try {
      // Validate ai_style value
      if (!['coach', 'reflector'].includes(aiStyle)) {
        throw new Error('Invalid AI style. Must be "coach" or "reflector"');
      }

      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('users')
        .update({
          ai_style: aiStyle,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw new Error(`Failed to update AI style: ${error.message}`);
      }

      console.log(`Updated AI style for user ${userId}: ${aiStyle}`);
      return { success: true, aiStyle };
    } catch (error) {
      console.error('Error updating user AI style:', error);
      throw error;
    }
  }

  /**
   * Get user statistics for AI context
   * Fetches: totalEntries, currentStreak, avgMood, totalWords
   */
  static async getUserStats(userId) {
    try {
      const supabase = getSupabaseClient();

      // Fetch all journal entries for stats calculation
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('content, mood_rating, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching user stats:', error);
        return {
          totalEntries: 0,
          currentStreak: 0,
          avgMood: null,
          totalWords: 0
        };
      }

      const totalEntries = entries?.length || 0;

      // Calculate total words
      const totalWords = entries?.reduce((sum, entry) => {
        return sum + (entry.content?.split(/\s+/).filter(w => w.length > 0).length || 0);
      }, 0) || 0;

      // Calculate average mood
      const moodEntries = entries?.filter(e => e.mood_rating != null) || [];
      const avgMood = moodEntries.length > 0
        ? Math.round(moodEntries.reduce((sum, e) => sum + e.mood_rating, 0) / moodEntries.length * 10) / 10
        : null;

      // Calculate current streak
      let currentStreak = 0;
      if (entries && entries.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let checkDate = new Date(today);
        const entryDates = new Set(
          entries.map(e => {
            const d = new Date(e.created_at);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
          })
        );

        // Check if there's an entry today or yesterday (to allow for timezone differences)
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (!entryDates.has(today.getTime()) && !entryDates.has(yesterday.getTime())) {
          currentStreak = 0;
        } else {
          // Start from yesterday if no entry today
          if (!entryDates.has(today.getTime())) {
            checkDate = yesterday;
          }

          // Count consecutive days backwards
          while (entryDates.has(checkDate.getTime())) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          }
        }
      }

      return {
        totalEntries,
        currentStreak,
        avgMood,
        totalWords
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalEntries: 0,
        currentStreak: 0,
        avgMood: null,
        totalWords: 0
      };
    }
  }
}

module.exports = UserService;
