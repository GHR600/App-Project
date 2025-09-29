// Journal entry types
export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  mood_rating?: number;
  entry_type: 'journal' | 'note';
  title?: string;
  created_at: string;
  updated_at: string;
  ai_insight_generated?: boolean;
}

// Day-based data structures for the new homepage
export interface DayCardData {
  date: string;           // ISO date string
  entries: JournalEntry[];
  journalEntry?: JournalEntry;    // The main journal entry
  notes: JournalEntry[];          // Additional notes
  dominantMood: string;           // Emoji representation
  previewText: string;            // First journal title or note titles
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
  entryType?: 'journal' | 'note';
  fromScreen?: 'DayDetail' | 'Dashboard';
}