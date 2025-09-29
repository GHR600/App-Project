import { supabase } from '../config/supabase';
import { JournalEntry, DayCardData } from '../types';

export class EntryService {
  /**
   * Group entries by day and create DayCardData objects
   */
  static groupEntriesByDay(entries: JournalEntry[]): DayCardData[] {
    const dayGroups: { [key: string]: JournalEntry[] } = {};

    // Group entries by date
    entries.forEach(entry => {
      const dateKey = entry.created_at.split('T')[0]; // Get YYYY-MM-DD
      if (!dayGroups[dateKey]) {
        dayGroups[dateKey] = [];
      }
      dayGroups[dateKey].push(entry);
    });

    // Convert to DayCardData array
    const dayCards: DayCardData[] = Object.entries(dayGroups).map(([date, dayEntries]) => {
      // Separate journal entries from notes
      const journalEntry = dayEntries.find(entry => entry.entry_type === 'journal');
      const notes = dayEntries.filter(entry => entry.entry_type === 'note');

      // Calculate dominant mood
      const moodRatings = dayEntries
        .map(entry => entry.mood_rating)
        .filter(rating => rating !== null && rating !== undefined);

      const avgMood = moodRatings.length > 0
        ? Math.round(moodRatings.reduce((sum, rating) => sum + rating!, 0) / moodRatings.length)
        : 3;

      const dominantMood = EntryService.getMoodEmoji(avgMood);

      // Generate preview text
      let previewText = '';
      if (journalEntry) {
        previewText = journalEntry.title || journalEntry.content.substring(0, 100);
      } else if (notes.length > 0) {
        previewText = notes[0].title || notes[0].content.substring(0, 100);
      }

      if (previewText.length > 100) {
        previewText = previewText.substring(0, 100) + '...';
      }

      return {
        date,
        entries: dayEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        journalEntry,
        notes: notes.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        dominantMood,
        previewText,
        totalEntries: dayEntries.length,
      };
    });

    // Sort by date (most recent first)
    return dayCards.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Get last N days with entries
   */
  static getLastSevenDaysWithEntries(entries: JournalEntry[]): DayCardData[] {
    const dayCards = EntryService.groupEntriesByDay(entries);
    return dayCards.slice(0, 7); // Return last 7 days with entries
  }

  /**
   * Get entries grouped by day for the last N days
   */
  static async getEntriesGroupedByDay(userId: string, limit: number = 7): Promise<{
    dayCards: DayCardData[];
    error: any;
  }> {
    try {
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit * 5); // Get more entries to ensure we have enough days

      if (error) {
        return { dayCards: [], error };
      }

      if (!entries || entries.length === 0) {
        return { dayCards: [], error: null };
      }

      // Convert database entries to our JournalEntry type
      const journalEntries: JournalEntry[] = entries.map(entry => ({
        id: entry.id,
        user_id: entry.user_id,
        content: entry.content,
        mood_rating: entry.mood_rating,
        entry_type: entry.entry_type || 'note', // Default to 'note' for backward compatibility
        title: entry.title,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        ai_insight_generated: entry.ai_insight_generated,
      }));

      const dayCards = EntryService.getLastSevenDaysWithEntries(journalEntries);
      return { dayCards, error: null };

    } catch (error) {
      console.error('Error fetching entries grouped by day:', error);
      return { dayCards: [], error };
    }
  }

  /**
   * Get all entries for a specific date
   */
  static async getEntriesForDate(userId: string, date: string): Promise<{
    entries: JournalEntry[];
    error: any;
  }> {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', `${date}T00:00:00.000Z`)
        .lt('created_at', `${date}T23:59:59.999Z`)
        .order('created_at', { ascending: false });

      if (error) {
        return { entries: [], error };
      }

      const entries: JournalEntry[] = (data || []).map(entry => ({
        id: entry.id,
        user_id: entry.user_id,
        content: entry.content,
        mood_rating: entry.mood_rating,
        entry_type: entry.entry_type || 'note',
        title: entry.title,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        ai_insight_generated: entry.ai_insight_generated,
      }));

      return { entries, error: null };

    } catch (error) {
      console.error('Error fetching entries for date:', error);
      return { entries: [], error };
    }
  }

  /**
   * Check if a journal entry exists for a specific date
   */
  static async checkJournalEntryExists(userId: string, date: string): Promise<{
    exists: boolean;
    error: any;
  }> {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('user_id', userId)
        .eq('entry_type', 'journal')
        .gte('created_at', `${date}T00:00:00.000Z`)
        .lt('created_at', `${date}T23:59:59.999Z`);

      if (error) {
        return { exists: false, error };
      }

      return { exists: (data?.length || 0) > 0, error: null };

    } catch (error) {
      console.error('Error checking journal entry exists:', error);
      return { exists: false, error };
    }
  }

  /**
   * Convert mood rating to emoji
   */
  static getMoodEmoji(rating: number): string {
    switch (rating) {
      case 1: return '😢';
      case 2: return '😕';
      case 3: return '😐';
      case 4: return '😊';
      case 5: return '😄';
      default: return '😐';
    }
  }
}