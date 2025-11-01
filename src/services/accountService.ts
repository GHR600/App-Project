import { supabase } from '../config/supabase';
import { AuthService } from './authService';

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  profile_picture_url?: string;
  created_at: string;
  subscription_status: string;
  free_insights_used: number;
}

export interface UsageStats {
  free_insights_used: number;
  free_insights_limit: number;
  subscription_status: 'free' | 'premium';
}

export class AccountService {
  /**
   * Get user profile data
   */
  static async getUserProfile(): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        return { data: null, error: 'No authenticated user' };
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, email, display_name, profile_picture_url, created_at, subscription_status, free_insights_used')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return { data: null, error };
    }
  }

  /**
   * Update display name
   */
  static async updateDisplayName(displayName: string): Promise<{ error: any | null }> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        return { error: 'No authenticated user' };
      }

      const { error } = await supabase
        .from('users')
        .update({
          display_name: displayName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating display name:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error updating display name:', error);
      return { error };
    }
  }

  /**
   * Update password
   */
  static async updatePassword(newPassword: string): Promise<{ error: any | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error updating password:', error);
        return { error: error.message };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error updating password:', error);
      return { error: error.message || 'An unexpected error occurred' };
    }
  }

  /**
   * Upload profile picture
   */
  static async uploadProfilePicture(uri: string): Promise<{ url: string | null; error: any | null }> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        return { url: null, error: 'No authenticated user' };
      }

      // Convert URI to blob for upload
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create a unique file name
      const fileExt = uri.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading profile picture:', uploadError);
        return { url: null, error: uploadError };
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      // Update user profile with new picture URL
      const { error: updateError } = await supabase
        .from('users')
        .update({
          profile_picture_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile picture URL:', updateError);
        return { url: null, error: updateError };
      }

      return { url: publicUrl, error: null };
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      return { url: null, error };
    }
  }

  /**
   * Delete account permanently
   */
  static async deleteAccount(): Promise<{ error: any | null }> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        return { error: 'No authenticated user' };
      }

      // Delete user data from database (journal entries, preferences, etc.)
      // The database should have CASCADE delete set up for user's data
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (deleteError) {
        console.error('Error deleting user data:', deleteError);
        return { error: deleteError };
      }

      // Delete the auth user
      const { error: authDeleteError } = await supabase.rpc('delete_user');

      if (authDeleteError) {
        console.error('Error deleting auth user:', authDeleteError);
        return { error: authDeleteError };
      }

      // Sign out
      await AuthService.signOut();

      return { error: null };
    } catch (error) {
      console.error('Error deleting account:', error);
      return { error };
    }
  }

  /**
   * Get usage statistics
   */
  static async getUsageStats(): Promise<{ data: UsageStats | null; error: any }> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        return { data: null, error: 'No authenticated user' };
      }

      const { data, error } = await supabase
        .from('users')
        .select('subscription_status, free_insights_used')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching usage stats:', error);
        return { data: null, error };
      }

      const isPremium = data.subscription_status === 'premium';
      const freeInsightsLimit = isPremium ? Infinity : 3;

      return {
        data: {
          free_insights_used: data.free_insights_used || 0,
          free_insights_limit: freeInsightsLimit,
          subscription_status: data.subscription_status as 'free' | 'premium'
        },
        error: null
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return { data: null, error };
    }
  }
}
