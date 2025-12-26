"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/user-profile';

type KidProfile = {
  uid: string;
  role: 'kid' | 'admin' | string;
  name: string;
  age: number;
  email: string;
  points: number;
  weeklyPoints?: number;
  monthlyPoints?: number;
  todayPoints?: number;
  dailyLimit?: number;
  badges?: number;
  level: string;
};

interface AuthContextValue {
  user: { id: string; email?: string | null } | null;
  profile: KidProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateLocalProfile: (updates: Partial<KidProfile>) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
  refreshProfile: async () => {},
  updateLocalProfile: () => {},
});

const DAILY_LIMIT = 100;

const mapProfile = (userRow: any, pointsRow?: any): KidProfile => {
  const todayPoints = pointsRow?.today_points ?? 0;
  const points = pointsRow?.total_points ?? userRow.points ?? 0;
  const weeklyPoints = pointsRow?.weekly_points ?? userRow.weeklyPoints ?? userRow.weeklypoints ?? 0;
  const monthlyPoints = pointsRow?.monthly_points ?? userRow.monthlyPoints ?? userRow.monthlypoints ?? 0;
  return {
    uid: userRow.uid,
    role: userRow.role,
    name: userRow.name,
    age: userRow.age,
    email: userRow.email,
    points,
    weeklyPoints,
    monthlyPoints,
    todayPoints,
    dailyLimit: DAILY_LIMIT,
    badges: userRow.badges || 0,
    level: userRow.level,
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [profile, setProfile] = useState<KidProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Define refreshProfile early so it can be used in effects
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    
    console.log('Manually refreshing profile for:', user.id);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('uid', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Profile refresh error:', error.message);
    } else if (data) {
      const { data: pointsRow, error: pointsError } = await supabase
        .from('users_points')
        .select('total_points, weekly_points, monthly_points, today_points')
        .eq('user_id', user.id)
        .maybeSingle();

      if (pointsError) {
        console.warn('users_points fetch error on refresh:', pointsError.message);
      }

      const mapped = mapProfile(data, pointsRow);
      console.log('Profile refreshed:', mapped);
      setProfile(mapped);
    } else {
      console.log('No profile data found for user; ensuring default profile');
      const created = await ensureUserProfile(user.id);
      if (created) {
        const { data: refetched } = await supabase
          .from('users')
          .select('*')
          .eq('uid', user.id)
          .maybeSingle();
          
        if (refetched) {
          const { data: pointsRow, error: pointsError } = await supabase
            .from('users_points')
            .select('total_points, weekly_points, monthly_points, today_points')
            .eq('user_id', user.id)
            .maybeSingle();

          if (pointsError) {
            console.warn('users_points fetch error after ensure:', pointsError.message);
          }

          const mapped = mapProfile(refetched, pointsRow);
          setProfile(mapped);
        }
      }
    }
  }, [user]);

  const updateLocalProfile = useCallback((updates: Partial<KidProfile>) => {
    setProfile(prev => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // First, try to get existing session
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        
        if (sessionErr) {
          console.error('Session check error:', sessionErr);
          // If refresh token is invalid, force a clean logout
          if (sessionErr.message && (
              sessionErr.message.includes('Refresh Token Not Found') || 
              sessionErr.message.includes('Invalid Refresh Token')
          )) {
            console.log('Detected invalid refresh token, forcing cleanup...');
            await supabase.auth.signOut();
            setUser(null);
            setLoading(false);
            return;
          }
        }
        
        if (isMounted && sessionData.session?.user) {
          console.log('Found existing session:', sessionData.session.user.id);
          setUser({ id: sessionData.session.user.id, email: sessionData.session.user.email });
          setLoading(false);
          return;
        }

        // No session; stay signed out. UI can prompt to sign in.
        if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        // Leave user null on error
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Also listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, 'Session:', session?.user?.id);
      if (isMounted) {
        const u = session?.user ? { id: session.user.id, email: session.user.email } : null;
        console.log('Auth state changed:', u?.id);
        setUser(u);
      }
    });

    return () => {
      isMounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Initial profile load
  useEffect(() => {
    (async () => {
      if (!user) {
        console.log('No user, clearing profile');
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      await refreshProfile();
      setLoading(false);
    })();
  }, [user, refreshProfile]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    
    console.log('Setting up real-time subscription for user:', user.id);
    const channel = supabase
      .channel(`user-profile-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `uid=eq.${user.id}`,
      }, (payload) => {
        console.log('Real-time update received (users):', payload);
        refreshProfile();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users_points',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        console.log('Real-time update received (users_points):', payload);
        refreshProfile();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshProfile]);

  // Re-fetch on window focus (vital for mobile app state consistency)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        console.log('Window focused, refreshing profile...');
        refreshProfile();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, refreshProfile]);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    logout: async () => {
      try {
        console.log('Logging out...');
        
        // 1. Force clear local storage first (most important)
        if (typeof window !== 'undefined') {
          try {
            const keys = Object.keys(window.localStorage);
            for (const k of keys) {
              if (k.startsWith('supabase') || k.startsWith('sb-')) {
                window.localStorage.removeItem(k);
              }
            }
          } catch (e) { console.error('LocalStorage cleanup error', e); }
        }

        // 2. Clear state
        setUser(null);
        setProfile(null);

        // 3. Try to notify Supabase (but don't block/fail on it)
        try {
           await supabase.auth.signOut();
        } catch (e) {
           console.warn('Supabase signOut failed, ignoring:', e);
        }

        // 4. Redirect
        if (typeof window !== 'undefined') {
          window.location.replace('/signin');
        }
      } catch (err) {
        console.error('Logout exception:', err);
        // Fallback redirect
        if (typeof window !== 'undefined') {
          window.location.replace('/signin');
        }
      }
    },
    refreshProfile,
    updateLocalProfile,
  }), [user, profile, loading, refreshProfile, updateLocalProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
