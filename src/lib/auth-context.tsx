"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
  badges?: number;
  dailyGamesPlayed?: number;
  gamesRemaining?: number;
  level: string;
};

interface AuthContextValue {
  user: { id: string; email?: string | null } | null;
  profile: KidProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [profile, setProfile] = useState<KidProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // First, try to get existing session
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        
        if (isMounted && sessionData.session?.user) {
          console.log('Found existing session:', sessionData.session.user.id);
          setUser({ id: sessionData.session.user.id, email: sessionData.session.user.email });
          setLoading(false);
          return;
        }

        if (sessionErr) {
          console.error('Session check error:', sessionErr);
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

  useEffect(() => {
    (async () => {
      if (!user) {
        console.log('No user, clearing profile');
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      console.log('Fetching profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', user.id)
        .maybeSingle();
      if (error) {
        console.error('Profile fetch error:', error.message);
        setProfile(null);
      } else if (data) {
        console.log('Profile raw data:', data);
        const dailyGamesPlayed = data.daily_games_played || 0;
        const profile: KidProfile = {
          uid: data.uid,
          role: data.role,
          name: data.name,
          age: data.age,
          email: data.email,
          points: data.points || 0,
          weeklyPoints: data.weeklypoints || 0,
          monthlyPoints: data.monthlypoints || 0,
          badges: data.badges || 0,
          dailyGamesPlayed: dailyGamesPlayed,
          gamesRemaining: Math.max(0, 3 - dailyGamesPlayed),
          level: data.level,
        };
        console.log('Profile mapped:', profile);
        setProfile(profile);
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
            const dailyGamesPlayed = refetched.daily_games_played || 0;
            const profile: KidProfile = {
              uid: refetched.uid,
              role: refetched.role,
              name: refetched.name,
              age: refetched.age,
              email: refetched.email,
              points: refetched.points || 0,
              weeklyPoints: refetched.weeklypoints || 0,
              monthlyPoints: refetched.monthlypoints || 0,
              badges: refetched.badges || 0,
              dailyGamesPlayed: dailyGamesPlayed,
              gamesRemaining: Math.max(0, 3 - dailyGamesPlayed),
              level: refetched.level,
            };
            setProfile(profile);
          } else {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      }
      setLoading(false);
    })();
  }, [user]);

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
      }, (payload: any) => {
        console.log('Real-time update received:', payload);
        const newRow = payload.new ?? payload.old;
        if (newRow) {
          const dailyGamesPlayed = newRow.daily_games_played || 0;
          const updatedProfile: KidProfile = {
            uid: newRow.uid,
            role: newRow.role,
            name: newRow.name,
            age: newRow.age,
            email: newRow.email,
            points: newRow.points || 0,
            weeklyPoints: newRow.weeklypoints || 0,
            monthlyPoints: newRow.monthlypoints || 0,
            badges: newRow.badges || 0,
            dailyGamesPlayed: dailyGamesPlayed,
            gamesRemaining: Math.max(0, 3 - dailyGamesPlayed),
            level: newRow.level,
          };
          console.log('Updated profile from real-time:', updatedProfile);
          setProfile(updatedProfile);
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const refreshProfile = async () => {
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
      const dailyGamesPlayed = data.daily_games_played || 0;
      const profile: KidProfile = {
        uid: data.uid,
        role: data.role,
        name: data.name,
        age: data.age,
        email: data.email,
        points: data.points || 0,
        weeklyPoints: data.weeklypoints || 0,
        monthlyPoints: data.monthlypoints || 0,
        badges: data.badges || 0,
        dailyGamesPlayed: dailyGamesPlayed,
        gamesRemaining: Math.max(0, 3 - dailyGamesPlayed),
        level: data.level,
      };
      console.log('Profile refreshed:', profile);
      setProfile(profile);
    }
  };

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    logout: async () => { await supabase.auth.signOut(); },
    refreshProfile,
  }), [user, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
