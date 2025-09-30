// Journal entry types (unified - no separate journal/note types)
export interface JournalEntry {
  id: string;
  user_id: string;
  date: string; // Explicit date field in YYYY-MM-DD format
  content: string;
  mood_rating?: number;
  title?: string;
  tags?: string[]; // Optional tags like "journal", "thought", "idea", "goal", "gratitude"
  created_at: string;
  updated_at: string;
  ai_insight_generated?: boolean;
}

// Day-based data structures for the new homepage
export interface DayCardData {
  date: string;           // ISO date string
  entries: JournalEntry[]; // All entries for this day (unified)
  dominantMood: string;    // Emoji representation
  previewText: string;     // Preview from first entry
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
  fromScreen?: 'DayDetail' | 'Dashboard';
}

// Tag preset definitions
export const PRESET_TAGS = [
  { id: 'journal', label: '📝 Journal', color: '#A855F7' },
  { id: 'thought', label: '💭 Thought', color: '#3B82F6' },
  { id: 'idea', label: '💡 Idea', color: '#F59E0B' },
  { id: 'goal', label: '🎯 Goal', color: '#10B981' },
  { id: 'gratitude', label: '✨ Gratitude', color: '#EC4899' },
] as const;