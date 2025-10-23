import { supabase } from '../config/supabase';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { loginRevenueCat } from './subscriptionService';

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

export interface SignUpData {
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  session: Session | null;
  error: AuthError | null;
}

export class AuthService {
  // Sign up new user
  static async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password
      });

      if (error) {
        return { user: null, session: null, error };
      }

      // Create user profile after successful signup
      if (authData.user && authData.session) {
        // Set the session to ensure RLS recognizes the authenticated user
        await supabase.auth.setSession(authData.session);

        // Small delay to ensure session is fully established
        await new Promise(resolve => setTimeout(resolve, 100));

        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            subscription_status: 'free',
            free_insights_used: 0,
            streak_count: 0,
            onboarding_completed: false
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Don't fail the entire signup for profile creation errors
        }

        // Identify user in RevenueCat
        try {
          await loginRevenueCat(authData.user.id);
        } catch (error) {
          console.error('Error identifying user in RevenueCat:', error);
          // Don't fail signup for RevenueCat errors
        }
      }

      return {
        user: authData.user ? {
          id: authData.user.id,
          email: authData.user.email!,
          created_at: authData.user.created_at!
        } : null,
        session: authData.session,
        error: null
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as AuthError
      };
    }
  }

  // Sign in existing user
  static async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error) {
        return { user: null, session: null, error };
      }

      // Identify user in RevenueCat after successful sign in
      if (authData.user) {
        try {
          await loginRevenueCat(authData.user.id);
        } catch (error) {
          console.error('Error identifying user in RevenueCat:', error);
          // Don't fail sign in for RevenueCat errors
        }
      }

      return {
        user: authData.user ? {
          id: authData.user.id,
          email: authData.user.email!,
          created_at: authData.user.created_at!
        } : null,
        session: authData.session,
        error: null
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as AuthError
      };
    }
  }

  // Sign out user
  static async signOut(): Promise<{ error: AuthError | null }> {
    try {
      // Log out from RevenueCat first
      const { logoutRevenueCat } = await import('./subscriptionService');
      try {
        await logoutRevenueCat();
      } catch (error) {
        console.error('Error logging out from RevenueCat:', error);
        // Continue with sign out even if RevenueCat logout fails
      }

      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email!,
        created_at: user.created_at!
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get current session
  static async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: AuthUser | null, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ? {
        id: session.user.id,
        email: session.user.email!,
        created_at: session.user.created_at!
      } : null;

      callback(user, session);
    });
  }

  // Reset password
  static async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'exp://localhost:8081/reset-password' // For development, replace with your app's deep link in production
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  // Update password
  static async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  // Check if user needs to complete onboarding
  static async needsOnboarding(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return true;

      const { data, error } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        return true;
      }

      return !data?.onboarding_completed;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return true;
    }
  }

  // Mark onboarding as complete
  static async completeOnboarding(): Promise<{ error: any | null }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { error: 'No authenticated user' };
      }

      const { error } = await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      return { error };
    } catch (error) {
      return { error };
    }
  }
}