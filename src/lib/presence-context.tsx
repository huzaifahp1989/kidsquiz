'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type PresenceContextType = {
  onlineUserIds: Set<string>;
};

const PresenceContext = createContext<PresenceContextType | null>(null);

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const { profile } = useAuth();
  const presenceChannelRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clean up old channel and heartbeat if they exist
    if (presenceChannelRef.current) {
      presenceChannelRef.current.unsubscribe();
      presenceChannelRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Only create a new channel if user is logged in
    if (!profile?.uid) return;

    const presenceChannel = supabase.channel('global-presence', { config: { broadcast: { self: true } } });
    presenceChannelRef.current = presenceChannel;

    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      const activeUsers = new Set<string>();
      
      Object.entries(state).forEach(([userId, presences]) => {
        if (Array.isArray(presences) && presences.length > 0) {
          activeUsers.add(userId);
        }
      });
      
      setOnlineUserIds(activeUsers);
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track presence immediately
        await presenceChannel.track({ uid: profile.uid, name: profile.name, timestamp: Date.now() });
        
        // Set up heartbeat to keep presence active
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = setInterval(async () => {
          await presenceChannel.track({ uid: profile.uid, name: profile.name, timestamp: Date.now() });
        }, 30000); // Update presence every 30 seconds
      }
    });

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [profile?.uid, profile?.name]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  return (
    <PresenceContext.Provider value={{ onlineUserIds }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within PresenceProvider');
  }
  return context;
}
