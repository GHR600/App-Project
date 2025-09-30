import { supabase } from '../config/supabase';
import { DatabaseNote } from '../config/supabase';

export interface CreateNoteData {
  title: string;
  content: string;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
}

export class NotesService {
  /**
   * Get all notes for a user
   */
  static async getUserNotes(userId: string): Promise<{
    notes: DatabaseNote[];
    error: any;
  }> {
    try {
      const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notes:', error);
        return { notes: [], error };
      }

      return { notes: notes || [], error: null };
    } catch (error) {
      console.error('Unexpected error fetching notes:', error);
      return { notes: [], error };
    }
  }

  /**
   * Create a new note
   */
  static async createNote(userId: string, data: CreateNoteData): Promise<{
    note: DatabaseNote | null;
    error: any;
  }> {
    try {
      const insertData = {
        user_id: userId,
        title: data.title,
        content: data.content
      };

      const { data: note, error } = await supabase
        .from('notes')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating note:', error);
        return { note: null, error };
      }

      return { note, error: null };
    } catch (error) {
      console.error('Unexpected error creating note:', error);
      return { note: null, error };
    }
  }

  /**
   * Get a specific note
   */
  static async getNote(userId: string, noteId: string): Promise<{
    note: DatabaseNote | null;
    error: any;
  }> {
    try {
      const { data: note, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .eq('id', noteId)
        .single();

      if (error) {
        console.error('Error fetching note:', error);
        return { note: null, error };
      }

      return { note, error: null };
    } catch (error) {
      console.error('Unexpected error fetching note:', error);
      return { note: null, error };
    }
  }

  /**
   * Update a note
   */
  static async updateNote(userId: string, noteId: string, data: UpdateNoteData): Promise<{
    note: DatabaseNote | null;
    error: any;
  }> {
    try {
      const updateData: any = {};

      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content;

      const { data: note, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('user_id', userId)
        .eq('id', noteId)
        .select()
        .single();

      if (error) {
        console.error('Error updating note:', error);
        return { note: null, error };
      }

      return { note, error: null };
    } catch (error) {
      console.error('Unexpected error updating note:', error);
      return { note: null, error };
    }
  }

  /**
   * Delete a note
   */
  static async deleteNote(userId: string, noteId: string): Promise<{
    success: boolean;
    error: any;
  }> {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('user_id', userId)
        .eq('id', noteId);

      if (error) {
        console.error('Error deleting note:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Unexpected error deleting note:', error);
      return { success: false, error };
    }
  }

  /**
   * Search notes by title or content
   */
  static async searchNotes(userId: string, query: string): Promise<{
    notes: DatabaseNote[];
    error: any;
  }> {
    try {
      const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching notes:', error);
        return { notes: [], error };
      }

      return { notes: notes || [], error: null };
    } catch (error) {
      console.error('Unexpected error searching notes:', error);
      return { notes: [], error };
    }
  }
}