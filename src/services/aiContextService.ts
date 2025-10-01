import { supabase } from './supabaseClient';
import { DatabaseNote, DatabaseJournalEntry } from '../config/supabase';

/**
 * AI Context Service
 * Provides data access functions for building AI context from user's notes and journal entries
 */

/**
 * Get all notes for a user
 */
export async function getAllNotes(userId: string): Promise<{
  notes: DatabaseNote[];
  error: any;
}> {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return { notes: [], error };
    }

    return { notes: data || [], error: null };
  } catch (error) {
    console.error('Unexpected error fetching notes:', error);
    return { notes: [], error };
  }
}

/**
 * Get recent journal entries for a user
 * @param userId - The user's ID
 * @param days - Number of days to look back (default: null for all entries)
 */
export async function getRecentEntries(userId: string, days?: number): Promise<{
  entries: DatabaseJournalEntry[];
  error: any;
}> {
  try {
    let query = supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId);

    // If days is specified, filter by created_at
    if (days !== undefined && days !== null) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      query = query.gte('created_at', cutoffDate.toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching entries:', error);
      return { entries: [], error };
    }

    return { entries: data || [], error: null };
  } catch (error) {
    console.error('Unexpected error fetching entries:', error);
    return { entries: [], error };
  }
}

/**
 * Get a specific journal entry by ID
 * @param entryId - The entry's ID
 */
export async function getCurrentEntry(entryId: string): Promise<{
  entry: DatabaseJournalEntry | null;
  error: any;
}> {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (error) {
      console.error('Error fetching entry:', error);
      return { entry: null, error };
    }

    return { entry: data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching entry:', error);
    return { entry: null, error };
  }
}

/**
 * AI Context Structure
 */
export interface AIContext {
  currentEntry: DatabaseJournalEntry | null;
  allEntries: DatabaseJournalEntry[];
  allNotes: DatabaseNote[];
  metadata: {
    totalNotes: number;
    totalEntries: number;
    generatedAt: string;
  };
}

/**
 * Build comprehensive AI context for a user
 * Combines current entry, all past entries, and all notes
 *
 * @param userId - The user's ID
 * @param currentEntryId - Optional ID of the current entry being worked on
 * @returns Structured AI context object
 */
export async function buildAIContext(
  userId: string,
  currentEntryId?: string
): Promise<{
  context: AIContext | null;
  error: any;
}> {
  try {
    // Fetch all data in parallel
    const [notesResult, entriesResult, currentEntryResult] = await Promise.all([
      getAllNotes(userId),
      getRecentEntries(userId), // No days parameter = all entries
      currentEntryId ? getCurrentEntry(currentEntryId) : Promise.resolve({ entry: null, error: null })
    ]);

    // Check for errors
    if (notesResult.error || entriesResult.error || currentEntryResult.error) {
      const error = notesResult.error || entriesResult.error || currentEntryResult.error;
      console.error('Error building AI context:', error);
      return { context: null, error };
    }

    // Build context object
    const context: AIContext = {
      currentEntry: currentEntryResult.entry,
      allEntries: entriesResult.entries,
      allNotes: notesResult.notes,
      metadata: {
        totalNotes: notesResult.notes.length,
        totalEntries: entriesResult.entries.length,
        generatedAt: new Date().toISOString()
      }
    };

    return { context, error: null };
  } catch (error) {
    console.error('Unexpected error building AI context:', error);
    return { context: null, error };
  }
}

/**
 * Format AI context as a text string for sending to AI models
 * Converts the structured context into a readable format
 */
export function formatAIContextAsText(context: AIContext): string {
  let text = '# AI Context\n\n';

  // Current Entry
  if (context.currentEntry) {
    text += '## Current Entry\n';
    text += `Date: ${context.currentEntry.created_at}\n`;
    if (context.currentEntry.title) {
      text += `Title: ${context.currentEntry.title}\n`;
    }
    if (context.currentEntry.mood_rating) {
      text += `Mood: ${context.currentEntry.mood_rating}/5\n`;
    }
    text += `Content:\n${context.currentEntry.content}\n\n`;
  }

  // All Entries
  if (context.allEntries.length > 0) {
    text += `## All Journal Entries (${context.allEntries.length} total)\n\n`;
    context.allEntries.forEach((entry, index) => {
      text += `### Entry ${index + 1} - ${entry.created_at}\n`;
      if (entry.title) {
        text += `Title: ${entry.title}\n`;
      }
      if (entry.mood_rating) {
        text += `Mood: ${entry.mood_rating}/5\n`;
      }
      text += `Content:\n${entry.content}\n\n`;
    });
  }

  // All Notes
  if (context.allNotes.length > 0) {
    text += `## Notes (${context.allNotes.length} total)\n\n`;
    context.allNotes.forEach((note, index) => {
      text += `### Note ${index + 1}: ${note.title}\n`;
      if (note.category) {
        text += `Category: ${note.category}\n`;
      }
      text += `Content:\n${note.content}\n\n`;
    });
  }

  // Metadata
  text += `## Context Metadata\n`;
  text += `Total Notes: ${context.metadata.totalNotes}\n`;
  text += `Total Entries: ${context.metadata.totalEntries}\n`;
  text += `Generated: ${context.metadata.generatedAt}\n`;

  return text;
}
