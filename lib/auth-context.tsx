'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type UserRole = 'creator' | 'brand';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  full_name: string | null;
  role: UserRole;
  creatorId: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
});

async function fetchProfile(userId: string): Promise<{ role: UserRole; creator_id: string | null; display_name: string | null } | null> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role, creator_id, display_name')
      .eq('id', userId)
      .maybeSingle();
    return data as { role: UserRole; creator_id: string | null; display_name: string | null } | null;
  } catch {
    return null;
  }
}

async function fetchCreator(creatorId: string): Promise<{ username: string; avatar_url: string | null; full_name: string | null } | null> {
  try {
    const { data } = await supabase
      .from('creators')
      .select('username, avatar_url, full_name')
      .eq('id', creatorId)
      .maybeSingle();
    return data as { username: string; avatar_url: string | null; full_name: string | null } | null;
  } catch {
    return null;
  }
}

function buildAuthUser(session: Session, profile: { role: UserRole; creator_id: string | null; display_name: string | null } | null, creatorData: { username: string; avatar_url: string | null; full_name: string | null } | null): AuthUser {
  return {
    id: session.user.id,
    email: session.user.email || '',
    username: creatorData?.username || profile?.display_name || session.user.email?.split('@')[0] || 'user',
    avatar_url: creatorData?.avatar_url || null,
    full_name: creatorData?.full_name || profile?.display_name || null,
    role: profile?.role || 'creator',
    creatorId: profile?.creator_id || null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (mounted) setLoading(false);
          return;
        }

        const profile = await fetchProfile(session.user.id);
        let creatorData = null;
        if (profile?.creator_id) {
          creatorData = await fetchCreator(profile.creator_id);
        }

        if (mounted) {
          setUser(buildAuthUser(session, profile, creatorData));
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      (async () => {
        if (event === 'SIGNED_OUT' || !session) {
          if (mounted) setUser(null);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          const profile = await fetchProfile(session.user.id);
          let creatorData = null;
          if (profile?.creator_id) {
            creatorData = await fetchCreator(profile.creator_id);
          }
          if (mounted) {
            setUser(buildAuthUser(session, profile, creatorData));
          }
        }
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback((u: AuthUser) => {
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
