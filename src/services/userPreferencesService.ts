import { supabase } from '../config/supabase';
import { UserPreferences } from '../config/supabase';

export interface CreatePreferencesData {
  focusAreas: string[];
  personalityType?: string;
  preferredTime?: string;
  reminderEnabled?: boolean;
}

export interface UpdatePreferencesData {
  focusAreas?: string[];
  personalityType?: string;
  preferredTime?: string;
  reminderEnabled?: boolean;
}

export class UserPreferencesService {
  // Create initial user preferences during onboarding
  static async createPreferences(userId: string, data: CreatePreferencesData): Promise<{
    preferences: UserPreferences | null;
    error: any;
  }> {
    try {
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          focus_areas: data.focusAreas,
          personality_type: data.personalityType,
          preferred_time: data.preferredTime,
          reminder_enabled: data.reminderEnabled ?? true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user preferences:', error);
        return { preferences: null, error };
      }

      return { preferences, error: null };
    } catch (error) {
      console.error('Unexpected error creating preferences:', error);
      return { preferences: null, error };
    }
  }

  // Get user preferences
  static async getUserPreferences(userId: string): Promise<{
    preferences: UserPreferences | null;
    error: any;
  }> {
    try {
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no preferences found, that's okay - user might need to complete onboarding
        if (error.code === 'PGRST116') {
          return { preferences: null, error: null };
        }
        console.error('Error fetching user preferences:', error);
        return { preferences: null, error };
      }

      return { preferences, error: null };
    } catch (error) {
      console.error('Unexpected error fetching preferences:', error);
      return { preferences: null, error };
    }
  }

  // Update user preferences
  static async updatePreferences(userId: string, data: UpdatePreferencesData): Promise<{
    preferences: UserPreferences | null;
    error: any;
  }> {
    try {
      const updateData: any = {};

      if (data.focusAreas !== undefined) updateData.focus_areas = data.focusAreas;
      if (data.personalityType !== undefined) updateData.personality_type = data.personalityType;
      if (data.preferredTime !== undefined) updateData.preferred_time = data.preferredTime;
      if (data.reminderEnabled !== undefined) updateData.reminder_enabled = data.reminderEnabled;

      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user preferences:', error);
        return { preferences: null, error };
      }

      return { preferences, error: null };
    } catch (error) {
      console.error('Unexpected error updating preferences:', error);
      return { preferences: null, error };
    }
  }

  // Delete user preferences (for account deletion)
  static async deletePreferences(userId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting user preferences:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected error deleting preferences:', error);
      return { error };
    }
  }

  // Get user's current mood trend based on recent entries
  static async getRecentMoodTrend(userId: string): Promise<'positive' | 'neutral' | 'negative'> {
    try {
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('mood_rating')
        .eq('user_id', userId)
        .not('mood_rating', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error || !entries || entries.length === 0) {
        return 'neutral';
      }

      const averageMood = entries.reduce((sum, entry) => sum + (entry.mood_rating || 0), 0) / entries.length;

      if (averageMood >= 4) return 'positive';
      if (averageMood <= 2) return 'negative';
      return 'neutral';
    } catch (error) {
      console.error('Error calculating mood trend:', error);
      return 'neutral';
    }
  }

  // Get user context for AI insights
  static async getUserContext(userId: string): Promise<{
    focusAreas: string[];
    recentMoodTrend: 'positive' | 'neutral' | 'negative';
    subscriptionStatus: 'free' | 'premium';
  }> {
    try {
      // Get user preferences and subscription status
      const [preferencesResult, userResult] = await Promise.all([
        this.getUserPreferences(userId),
        supabase.from('users').select('subscription_status').eq('id', userId).single()
      ]);

      const focusAreas = preferencesResult.preferences?.focus_areas || [];
      const subscriptionStatus = userResult.data?.subscription_status || 'free';
      const recentMoodTrend = await this.getRecentMoodTrend(userId);

      return {
        focusAreas,
        recentMoodTrend,
        subscriptionStatus: subscriptionStatus as 'free' | 'premium'
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return {
        focusAreas: [],
        recentMoodTrend: 'neutral',
        subscriptionStatus: 'free'
      };
    }
  }
}