console.log('2️⃣ LOADING: AuthContext.tsx');
import React, { createContext, useContext, useEffect, useState } from 'react';
console.log('2️⃣ React imported in AuthContext.tsx');
import { Session } from '@supabase/supabase-js';
console.log('2️⃣ Session imported from @supabase/supabase-js');
import { AuthService, AuthUser } from '../services/authService';
console.log('2️⃣ AuthService imported');

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

console.log('2️⃣ Creating AuthContext with React.createContext...');
console.log('2️⃣ React object:', React);
console.log('2️⃣ createContext function:', createContext);
console.log('2️⃣ typeof createContext:', typeof createContext);
const AuthContext = createContext<AuthContextType | undefined>(undefined);
console.log('2️⃣ AuthContext created successfully:', AuthContext);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    AuthService.getCurrentSession().then((session) => {
      setSession(session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          created_at: session.user.created_at!
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange((user, session) => {
      setUser(user);
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await AuthService.signUp({ email, password });

      if (response.error) {
        return { error: response.error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await AuthService.signIn({ email, password });

      if (response.error) {
        return { error: response.error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await AuthService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const response = await AuthService.resetPassword(email);

      if (response.error) {
        return { error: response.error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};