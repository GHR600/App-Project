import { supabase } from '../config/supabase';
import { DatabaseJournalEntry } from '../config/supabase';

export interface CreateJournalEntryData {
  content: string;
  moodRating?: number;
  voiceMemoUrl?: string;
  title?: string;
  date?: string; // ISO date string (YYYY-MM-DD) - if not provided, uses today
  tags?: string[]; // Optional tags for categorization
}

export interface UpdateJournalEntryData {
  content?: string;
  moodRating?: number;
  voiceMemoUrl?: string;
  title?: string;
  tags?: string[]; // Optional tags for categorization
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
      // Format dates to ensure we get full day coverage
      // Start at 00:00:00 of startDate and end at 23:59:59.999 of endDate
      const startDateStr = startDate.toISOString().split('T')[0] + 'T00:00:00.000Z';
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      const endDateStr = endDateObj.toISOString();

      console.log('📅 Fetching entries in date range:', { startDateStr, endDateStr, userId });

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
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching entries in date range:', error);
        return { entries: [], error };
      }

      console.log('✅ Fetched', entries?.length || 0, 'entries in date range');
      if (entries && entries.length > 0) {
        console.log('📝 Entry dates:', entries.map(e => ({
          id: e.id,
          created_at: e.created_at,
          date: new Date(e.created_at).toISOString().split('T')[0]
        })));
      }

      return { entries: entries || [], error: null };
    } catch (error) {
      console.error('Unexpected error fetching entries in date range:', error);
      return { entries: [], error };
    }
  }

  // Create a new journal entry (multiple entries per day allowed)
  static async createEntry(userId: string, data: CreateJournalEntryData): Promise<{
    entry: DatabaseJournalEntry | null;
    error: any;
  }> {
    try {
      // Use provided date or default to today
      const targetDate = data.date || new Date().toISOString().split('T')[0];
      console.log('🆕 JournalService.createEntry called:', {
        targetDate,
        providedDate: data.date,
        userId
      });

      // Prepare insert data with specific date timestamp
      // Auto-infer tags if not provided: journal entries have mood, notes don't
      let tags = data.tags;
      if (!tags || tags.length === 0) {
        tags = data.moodRating !== undefined && data.moodRating !== null
          ? ['journal']
          : ['note'];
      }

      // Use current timestamp if creating for today, otherwise use noon for the target date
      const isToday = targetDate === new Date().toISOString().split('T')[0];
      const timestamp = isToday
        ? new Date().toISOString() // Current time for today's entries
        : `${targetDate}T12:00:00.000Z`; // Noon UTC for past/future dates

      const insertData = {
        user_id: userId,
        content: data.content,
        mood_rating: data.moodRating,
        voice_memo_url: data.voiceMemoUrl,
        title: data.title,
        tags: tags,
        created_at: timestamp
      };

      const { data: entry, error } = await supabase
        .from('journal_entries')
        .insert(insertData)
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
      if (data.title !== undefined) updateData.title = data.title;
      if (data.tags !== undefined) updateData.tags = data.tags;

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

  // Update user streak based on actual consecutive days with entries
  private static async updateUserStreak(userId: string): Promise<void> {
    try {
      // Query all entries to calculate actual streak from database
      const { data: entries, error: entriesError } = await supabase
        .from('journal_entries')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (entriesError || !entries || entries.length === 0) {
        console.log('⚠️ No entries found for streak calculation');
        // Reset streak to 0 if no entries
        await supabase
          .from('users')
          .update({ streak_count: 0, last_entry_date: null })
          .eq('id', userId);
        return;
      }

      // Extract unique dates (YYYY-MM-DD format) - work purely with date strings to avoid timezone issues
      const uniqueDates = new Set<string>();
      entries.forEach(entry => {
        // Parse timestamp and extract date in UTC (entries are stored in UTC)
        const date = entry.created_at.split('T')[0]; // More reliable than new Date().toISOString()
        uniqueDates.add(date);
      });

      // Sort dates in descending order (most recent first)
      const sortedDates = Array.from(uniqueDates).sort((a, b) => b.localeCompare(a));

      // Get today and yesterday as date strings (YYYY-MM-DD) in UTC
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      const yesterdayDate = new Date(now);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

      console.log('📅 Streak calculation debug:', {
        todayStr,
        yesterdayStr,
        mostRecentEntry: sortedDates[0],
        totalUniqueDays: sortedDates.length,
        recentDates: sortedDates.slice(0, 7)
      });

      // Check if streak is active (entry today or yesterday)
      const hasEntryToday = sortedDates.includes(todayStr);
      const hasEntryYesterday = sortedDates.includes(yesterdayStr);

      let streak = 0;

      if (!hasEntryToday && !hasEntryYesterday) {
        // Streak is broken - no entry today or yesterday
        console.log('💔 Streak broken - no entry today or yesterday');
        streak = 0;
      } else {
        // Start from most recent entry date and count backwards
        let currentDateStr = hasEntryToday ? todayStr : yesterdayStr;

        console.log('🔥 Counting streak from:', currentDateStr);

        // Count consecutive days by iterating through sorted dates
        for (const entryDate of sortedDates) {
          if (entryDate === currentDateStr) {
            streak++;
            console.log(`  ✓ Day ${streak}: ${entryDate} matches ${currentDateStr}`);

            // Move to previous day for next iteration
            const prevDate = new Date(currentDateStr + 'T00:00:00Z');
            prevDate.setUTCDate(prevDate.getUTCDate() - 1);
            currentDateStr = prevDate.toISOString().split('T')[0];
          } else if (entryDate < currentDateStr) {
            // Gap found - entry is older than expected next date
            console.log(`  ✗ Gap found: expected ${currentDateStr}, found ${entryDate}`);
            break;
          }
          // If entryDate > currentDateStr, it's a future date (skip it)
        }
      }

      console.log('📊 Final streak calculation:', {
        userId,
        totalEntries: entries.length,
        uniqueDays: sortedDates.length,
        calculatedStreak: streak,
        hasEntryToday,
        hasEntryYesterday
      });

      // Update user record with calculated streak
      const lastEntryDate = sortedDates[0]; // Most recent date
      await supabase
        .from('users')
        .update({
          last_entry_date: lastEntryDate,
          streak_count: streak
        })
        .eq('id', userId);

      console.log('✅ Streak updated successfully:', { streak, lastEntryDate });

    } catch (error) {
      console.error('❌ Unexpected error updating user streak:', error);
    }
  }

}