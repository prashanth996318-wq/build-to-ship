import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function toUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize from existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ? toUser(data.session.user) : null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ? toUser(session.user) : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { user, session, loading, login, register, logout };
}

// ---------------------------------------------------------------------------
// Context consumer hook
// ---------------------------------------------------------------------------

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return ctx;
}
