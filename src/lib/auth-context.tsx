"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type KidProfile = {
  uid: string;
  role: 'kid' | 'admin' | string;
  name: string;
  age: number;
  email: string;
  points: number;
  weeklyPoints?: number;
  monthlyPoints?: number;
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
          return;
        }

        if (sessionErr) {
          console.error('Session check error:', sessionErr);
        }

        // No session; stay signed out. UI can prompt to sign in.
      } catch (err) {
        console.error('Auth init error:', err);
        // Leave user null on error
      }
    };

    initAuth();

    // Also listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
        const profile: KidProfile = {
          uid: data.uid,
          role: data.role,
          name: data.name,
          age: data.age,
          email: data.email,
          points: data.points || 0,
          weeklyPoints: data.weeklypoints || 0,
          monthlyPoints: data.monthlypoints || 0,
          level: data.level,
        };
        console.log('Profile mapped:', profile);
        setProfile(profile);
      } else {
        console.log('No profile data found for user');
        setProfile(null);
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
          const updatedProfile: KidProfile = {
            uid: newRow.uid,
            role: newRow.role,
            name: newRow.name,
            age: newRow.age,
            email: newRow.email,
            points: newRow.points || 0,
            weeklyPoints: newRow.weeklypoints || 0,
            monthlyPoints: newRow.monthlypoints || 0,
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
      const profile: KidProfile = {
        uid: data.uid,
        role: data.role,
        name: data.name,
        age: data.age,
        email: data.email,
        points: data.points || 0,
        weeklyPoints: data.weeklypoints || 0,
        monthlyPoints: data.monthlypoints || 0,
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
