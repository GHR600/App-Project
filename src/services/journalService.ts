import { supabase } from '../config/supabase';
import { DatabaseJournalEntry } from '../config/supabase';

export interface CreateJournalEntryData {
  content: string;
  moodRating?: number;
  voiceMemoUrl?: string;
}

export interface UpdateJournalEntryData {
  content?: string;
  moodRating?: number;
  voiceMemoUrl?: string;
}

export interface JournalEntryWithWordCount extends DatabaseJournalEntry {
  word_count: number;
}

export interface JournalEntryWithInsights extends DatabaseJournalEntry {
  ai_insights?: Array<{
    id: string;
    insight_text: string;
    follow_up_question: string;
    confidence: number;
    is_premium: boolean;
    created_at: string;
  }>;
}

export class JournalService {
  /**
   * Get journal entries within a date range
   */
  static async getUserEntriesInDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    entries: JournalEntryWithInsights[];
    error: any;
  }> {
    try {
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
          *,
          ai_insights (
            id,
            insight_text,
            follow_up_question,
            confidence,
            is_premium,
            created_at
          )
        `)
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching entries in date range:', error);
        return { entries: [], error };
      }

      return { entries: entries || [], error: null };
    } catch (error) {
      console.error('Unexpected error fetching entries in date range:', error);
      return { entries: [], error };
    }
  }

  // Create a new journal entry
  static async createEntry(userId: string, data: CreateJournalEntryData): Promise<{
    entry: DatabaseJournalEntry | null;
    error: any;
  }> {
    try {
      const { data: entry, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: userId,
          content: data.content,
          mood_rating: data.moodRating,
          voice_memo_url: data.voiceMemoUrl
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating journal entry:', error);
        return { entry: null, error };
      }

      // Update user's last entry date and streak
      await this.updateUserStreak(userId);

      return { entry, error: null };
    } catch (error) {
      console.error('Unexpected error creating journal entry:', error);
      return { entry: null, error };
    }
  }

  // Get a specific journal entry
  static async getEntry(userId: string, entryId: string): Promise<{
    entry: DatabaseJournalEntry | null;
    error: any;
  }> {
    try {
      const { data: entry, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('id', entryId)
        .single();

      if (error) {
        console.error('Error fetching journal entry:', error);
        return { entry: null, error };
      }

      return { entry, error: null };
    } catch (error) {
      console.error('Unexpected error fetching journal entry:', error);
      return { entry: null, error };
    }
  }

  // Get user's journal entries with their AI insights
  static async getUserEntriesWithInsights(userId: string, options: {
    limit?: number;
    offset?: number;
    orderBy?: 'created_at' | 'updated_at';
    ascending?: boolean;
  } = {}): Promise<{
    entries: JournalEntryWithInsights[];
    error: any;
    hasMore: boolean;
  }> {
    try {
      const {
        limit = 20,
        offset = 0,
        orderBy = 'created_at',
        ascending = false
      } = options;

      let query = supabase
        .from('journal_entries')
        .select(`
          *,
          ai_insights (
            id,
            insight_text,
            follow_up_question,
            confidence,
            is_premium,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order(orderBy, { ascending })
        .range(offset, offset + limit);

      const { data: entries, error } = await query;

      if (error) {
        console.error('Error fetching journal entries with insights:', error);
        return { entries: [], error, hasMore: false };
      }

      const hasMore = entries.length === limit + 1;
      const finalEntries = hasMore ? entries.slice(0, -1) : entries;

      return { entries: finalEntries, error: null, hasMore };
    } catch (error) {
      console.error('Unexpected error fetching journal entries with insights:', error);
      return { entries: [], error, hasMore: false };
    }
  }

  // Get user's journal entries with pagination
  static async getUserEntries(userId: string, options: {
    limit?: number;
    offset?: number;
    orderBy?: 'created_at' | 'updated_at';
    ascending?: boolean;
  } = {}): Promise<{
    entries: DatabaseJournalEntry[];
    error: any;
    hasMore: boolean;
  }> {
    try {
      const {
        limit = 20,
        offset = 0,
        orderBy = 'created_at',
        ascending = false
      } = options;

      let query = supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order(orderBy, { ascending })
        .range(offset, offset + limit);

      const { data: entries, error } = await query;

      if (error) {
        console.error('Error fetching journal entries:', error);
        return { entries: [], error, hasMore: false };
      }

      const hasMore = entries.length === limit + 1;
      const finalEntries = hasMore ? entries.slice(0, -1) : entries;

      return { entries: finalEntries, error: null, hasMore };
    } catch (error) {
      console.error('Unexpected error fetching journal entries:', error);
      return { entries: [], error, hasMore: false };
    }
  }

  // Get recent entries for AI context
  static async getRecentEntries(userId: string, limit: number = 3): Promise<{
    entries: DatabaseJournalEntry[];
    error: any;
  }> {
    try {
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent journal entries:', error);
        return { entries: [], error };
      }

      return { entries: entries || [], error: null };
    } catch (error) {
      console.error('Unexpected error fetching recent entries:', error);
      return { entries: [], error };
    }
  }

  // Update a journal entry
  static async updateEntry(userId: string, entryId: string, data: UpdateJournalEntryData): Promise<{
    entry: DatabaseJournalEntry | null;
    error: any;
  }> {
    try {
      const updateData: any = {};

      if (data.content !== undefined) updateData.content = data.content;
      if (data.moodRating !== undefined) updateData.mood_rating = data.moodRating;
      if (data.voiceMemoUrl !== undefined) updateData.voice_memo_url = data.voiceMemoUrl;

      const { data: entry, error } = await supabase
        .from('journal_entries')
        .update(updateData)
        .eq('user_id', userId)
        .eq('id', entryId)
        .select()
        .single();

      if (error) {
        console.error('Error updating journal entry:', error);
        return { entry: null, error };
      }

      return { entry, error: null };
    } catch (error) {
      console.error('Unexpected error updating journal entry:', error);
      return { entry: null, error };
    }
  }

  // Delete a journal entry
  static async deleteEntry(userId: string, entryId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('user_id', userId)
        .eq('id', entryId);

      if (error) {
        console.error('Error deleting journal entry:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected error deleting journal entry:', error);
      return { error };
    }
  }

  // Get entries by date range
  static async getEntriesByDateRange(userId: string, startDate: string, endDate: string): Promise<{
    entries: DatabaseJournalEntry[];
    error: any;
  }> {
    try {
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching entries by date range:', error);
        return { entries: [], error };
      }

      return { entries: entries || [], error: null };
    } catch (error) {
      console.error('Unexpected error fetching entries by date range:', error);
      return { entries: [], error };
    }
  }

  // Get entry statistics
  static async getUserStats(userId: string): Promise<{
    stats: {
      totalEntries: number;
      currentStreak: number;
      averageMood: number;
      totalWords: number;
      entriesThisMonth: number;
    };
    error: any;
  }> {
    try {
      // Get basic stats from users table (may not exist for demo users)
      const { data: stats, error: statsError } = await supabase
        .from('users')
        .select('streak_count')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle to handle non-existent users gracefully

      // Don't return error if user doesn't exist in users table
      const userStreak = stats?.streak_count || 0;

      // Get entry statistics
      const { data: entries, error: entriesError } = await supabase
        .from('journal_entries')
        .select('mood_rating, word_count, created_at')
        .eq('user_id', userId);

      if (entriesError) {
        console.error('Error fetching entries for stats:', entriesError);
        return {
          stats: {
            totalEntries: 0,
            currentStreak: userStreak,
            averageMood: 0,
            totalWords: 0,
            entriesThisMonth: 0
          },
          error: entriesError
        };
      }

      const totalEntries = entries.length;
      const totalWords = entries.reduce((sum, entry) => sum + (entry.word_count || 0), 0);

      // Calculate average mood (excluding null values)
      const moodEntries = entries.filter(entry => entry.mood_rating !== null);
      const averageMood = moodEntries.length > 0
        ? moodEntries.reduce((sum, entry) => sum + entry.mood_rating, 0) / moodEntries.length
        : 0;

      // Count entries this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const entriesThisMonth = entries.filter(entry =>
        new Date(entry.created_at) >= startOfMonth
      ).length;

      return {
        stats: {
          totalEntries,
          currentStreak: userStreak,
          averageMood: Math.round(averageMood * 10) / 10, // Round to 1 decimal
          totalWords,
          entriesThisMonth
        },
        error: null
      };
    } catch (error) {
      console.error('Unexpected error calculating user stats:', error);
      return {
        stats: {
          totalEntries: 0,
          currentStreak: 0,
          averageMood: 0,
          totalWords: 0,
          entriesThisMonth: 0
        },
        error
      };
    }
  }

  // Update user streak based on last entry date
  private static async updateUserStreak(userId: string): Promise<void> {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('last_entry_date, streak_count')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle to handle non-existent users

      // Skip streak update if user doesn't exist in users table (demo mode)
      if (userError || !user) {
        console.log('User not found in users table, skipping streak update');
        return;
      }

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const lastEntryDate = user?.last_entry_date;
      let newStreakCount = user?.streak_count || 0;

      if (!lastEntryDate) {
        // First entry ever
        newStreakCount = 1;
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastEntryDate === yesterdayStr) {
          // Consecutive day - increment streak
          newStreakCount += 1;
        } else if (lastEntryDate !== today) {
          // Missed days - reset streak
          newStreakCount = 1;
        }
        // If lastEntryDate === today, keep current streak (same day, multiple entries)
      }

      // Update user record
      await supabase
        .from('users')
        .update({
          last_entry_date: today,
          streak_count: newStreakCount
        })
        .eq('id', userId);

    } catch (error) {
      console.error('Unexpected error updating user streak:', error);
    }
  }

}