'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function ensureProfile(u: User) {
    // First try to fetch existing profile
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', u.id)
      .maybeSingle();

    if (existing) {
      setProfile(existing as Profile);
      return;
    }

    // Profile doesn't exist yet — create it manually
    // (the trigger should have done this, but as a fallback)
    const name = u.user_metadata?.name || u.email?.split('@')[0] || 'User';
    const { data: created } = await supabase
      .from('profiles')
      .insert({
        id: u.id,
        email: u.email || '',
        name,
      })
      .select()
      .maybeSingle();

    if (created) {
      setProfile(created as Profile);
    }
  }

  async function refreshProfile() {
    if (user) await ensureProfile(user);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        ensureProfile(u);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          // Use async IIFE to avoid deadlock in onAuthStateChange
          (async () => {
            await ensureProfile(u);
          })();
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
