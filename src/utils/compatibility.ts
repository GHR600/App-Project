/**
 * Compatibility utilities for graceful handling of database schema changes
 */

export class CompatibilityUtils {
  private static _hasNewColumns: boolean | null = null;

  /**
   * Check if the database has the new entry_type and title columns
   */
  static async checkDatabaseColumns(): Promise<{ hasEntryType: boolean; hasTitle: boolean }> {
    // For now, assume columns don't exist until migration is run
    // This prevents errors during the transition period
    return {
      hasEntryType: false,
      hasTitle: false
    };
  }

  /**
   * Safely prepare journal entry data for database insertion
   */
  static prepareJournalEntryData(data: {
    user_id: string;
    content: string;
    mood_rating?: number;
    voice_memo_url?: string;
    title?: string;
    entryType?: 'journal' | 'note';
  }): any {
    const baseData = {
      user_id: data.user_id,
      content: data.content,
      mood_rating: data.mood_rating,
      voice_memo_url: data.voice_memo_url,
    };

    // Only add new fields if they're provided and schema supports them
    // For now, we skip them to maintain compatibility
    const insertData = { ...baseData };

    return insertData;
  }

  /**
   * Safely map database entry to our JournalEntry type
   */
  static mapDatabaseEntry(entry: any) {
    return {
      id: entry.id,
      user_id: entry.user_id,
      content: entry.content,
      mood_rating: entry.mood_rating,
      entry_type: entry.entry_type || 'note', // Default for backward compatibility
      title: entry.title || undefined,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      ai_insight_generated: entry.ai_insight_generated,
    };
  }
}