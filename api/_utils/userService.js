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
  static async getRecentEntries(userId, limit = 10) {
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

      // Calculate writing patterns
      const writingPatterns = this._calculateWritingPatterns(entries);

      // Calculate top words
      const topWords = this._calculateTopWords(entries);

      // Calculate mood trends
      const moodTrends = this._calculateMoodTrends(entries);

      return {
        totalEntries,
        currentStreak,
        avgMood,
        totalWords,
        writingPatterns,
        topWords,
        moodTrends
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalEntries: 0,
        currentStreak: 0,
        avgMood: null,
        totalWords: 0,
        writingPatterns: {
          favoriteDay: null,
          averageWordsPerEntry: 0,
          bestWritingTime: null
        },
        topWords: [],
        moodTrends: {
          recent: 'stable'
        }
      };
    }
  }

  /**
   * Calculate writing patterns from journal entries
   * @private
   */
  static _calculateWritingPatterns(entries) {
    if (!entries || entries.length === 0) {
      return {
        favoriteDay: null,
        averageWordsPerEntry: 0,
        bestWritingTime: null
      };
    }

    // Calculate favorite day of week
    const dayCount = {};
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    entries.forEach(entry => {
      const date = new Date(entry.created_at);
      const dayName = daysOfWeek[date.getDay()];
      dayCount[dayName] = (dayCount[dayName] || 0) + 1;
    });

    const favoriteDay = Object.keys(dayCount).length > 0
      ? Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0][0]
      : null;

    // Calculate average words per entry
    const totalWords = entries.reduce((sum, entry) => {
      return sum + (entry.content?.split(/\s+/).filter(w => w.length > 0).length || 0);
    }, 0);
    const averageWordsPerEntry = entries.length > 0
      ? Math.round(totalWords / entries.length)
      : 0;

    // Calculate best writing time
    const timeCount = { morning: 0, afternoon: 0, evening: 0, night: 0 };

    entries.forEach(entry => {
      const date = new Date(entry.created_at);
      const hour = date.getHours();

      if (hour >= 5 && hour < 12) timeCount.morning++;
      else if (hour >= 12 && hour < 17) timeCount.afternoon++;
      else if (hour >= 17 && hour < 21) timeCount.evening++;
      else timeCount.night++;
    });

    const bestWritingTime = Object.entries(timeCount)
      .sort((a, b) => b[1] - a[1])[0][0];

    return {
      favoriteDay,
      averageWordsPerEntry,
      bestWritingTime
    };
  }

  /**
   * Calculate top frequently used words (excluding common words)
   * @private
   */
  static _calculateTopWords(entries) {
    if (!entries || entries.length === 0) {
      return [];
    }

    // Common words to exclude
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your', 'yours',
      'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they', 'them',
      'their', 'theirs', 'what', 'which', 'who', 'when', 'where', 'why', 'how',
      'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may',
      'might', 'must', 'can', 'this', 'that', 'these', 'those', 'as', 'if',
      'so', 'than', 'too', 'very', 'just', 'now', 'then', 'there', 'here'
    ]);

    const wordCount = {};

    entries.forEach(entry => {
      if (!entry.content) return;

      const words = entry.content
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word));

      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
    });

    // Return top 3 words
    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
  }

  /**
   * Calculate mood trends (recent vs historical)
   * @private
   */
  static _calculateMoodTrends(entries) {
    if (!entries || entries.length === 0) {
      return { recent: 'stable' };
    }

    const moodEntries = entries.filter(e => e.mood_rating != null);

    if (moodEntries.length < 2) {
      return { recent: 'stable' };
    }

    // Split into recent (last 25%) and older entries
    const splitPoint = Math.ceil(moodEntries.length * 0.25);
    const recentEntries = moodEntries.slice(0, splitPoint);
    const olderEntries = moodEntries.slice(splitPoint);

    if (olderEntries.length === 0) {
      return { recent: 'stable' };
    }

    // Calculate average moods
    const recentAvg = recentEntries.reduce((sum, e) => sum + e.mood_rating, 0) / recentEntries.length;
    const olderAvg = olderEntries.reduce((sum, e) => sum + e.mood_rating, 0) / olderEntries.length;

    const difference = recentAvg - olderAvg;

    // Determine trend (threshold of 0.3 to avoid noise)
    if (difference > 0.3) return { recent: 'improving' };
    if (difference < -0.3) return { recent: 'declining' };
    return { recent: 'stable' };
  }
}

module.exports = UserService;
