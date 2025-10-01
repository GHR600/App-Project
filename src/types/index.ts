// Unified entry types (previously journal entries and notes)
export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  mood_rating?: number;
  tags?: string[];  // Optional tags array (e.g., ['journal'], ['note'], ['work', 'personal'])
  title?: string;
  created_at: string;
  updated_at: string;
  ai_insight_generated?: boolean;
}

// Day-based data structures for the new homepage
export interface DayCardData {
  date: string;           // ISO date string
  entries: JournalEntry[];        // All entries for this day
  dominantMood: string;           // Emoji representation
  previewText: string;            // Preview from most recent entry
  totalEntries: number;
}

// Navigation types
export interface DayDetailScreenParams {
  date: string;
  dayData: DayCardData;
}

export interface JournalEntryScreenParams {
  mode: 'create' | 'edit';
  entryId?: string;
  initialDate?: string;
  initialTags?: string[];  // Optional initial tags for new entries
  fromScreen?: 'DayDetail' | 'Dashboard';
}