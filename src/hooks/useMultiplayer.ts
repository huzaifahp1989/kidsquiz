import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export type UserPresence = {
  user_id: string;
  username: string;
  online_at: string;
  status: 'idle' | 'in-game' | 'looking-for-match';
};

export function useMultiplayer() {
  const { profile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeRooms, setActiveRooms] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;

    // Fetch initial active rooms
    const fetchRooms = async () => {
      const { data } = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false });
      
      if (data) setActiveRooms(data);
    };

    fetchRooms();

    // Subscribe to room changes
    const channel = supabase.channel('room_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'multiplayer_rooms' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            if (payload.new.status === 'waiting') {
              setActiveRooms(prev => [payload.new, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.status !== 'waiting') {
              setActiveRooms(prev => prev.filter(r => r.id !== payload.new.id));
            } else {
               setActiveRooms(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
            }
          } else if (payload.eventType === 'DELETE') {
            setActiveRooms(prev => prev.filter(r => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const globalChannel = supabase.channel('global_lobby', {
      config: {
        presence: {
          key: profile.uid,
        },
      },
    });

    console.log('Attempting to connect to global_lobby...');

    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence synced');
        const newState = channel.presenceState<UserPresence>();
        const users = Object.values(newState).flat();
        const uniqueUsers = Array.from(new Map(users.map(u => [u.user_id, u])).values());
        setOnlineUsers(uniqueUsers);
      })
      .subscribe(async (status, err) => {
        console.log('Subscription status:', status, err);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
          await channel.track({
            user_id: profile.uid,
            username: profile.name || 'Anonymous',
            online_at: new Date().toISOString(),
            status: 'idle',
          });
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setError(`Connection error: ${err?.message || 'Unknown error'}`);
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          setError('Connection timed out. Retrying...');
        } else {
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const createRoom = async (gameType: 'quiz' | 'word-scramble' | 'hangman' | 'quran-verses' | 'prophet-timeline' | 'dua-completion' = 'quiz') => {
    if (!profile) return null;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
      const { data: room, error: roomError } = await supabase
        .from('multiplayer_rooms')
        .insert({
          code,
          host_id: profile.uid,
          status: 'waiting',
          game_type: gameType,
        })
        .select()
        .single();

      if (roomError) throw roomError;
      
      // Join as host
      const joined = await joinRoom(room.code);
      if (!joined) throw new Error('Failed to join created room');

      return room;
    } catch (e: any) {
      console.error('Create room error:', e);
      setError(e.message || 'Failed to create room');
      return null;
    }
  };

  const joinRoom = async (code: string) => {
    if (!profile) return false;

    try {
      // Get room id
      const { data: room, error: fetchError } = await supabase
        .from('multiplayer_rooms')
        .select('id')
        .eq('code', code)
        .single();

      if (fetchError || !room) {
        throw new Error('Room not found');
      }

      const { error: joinError } = await supabase
        .from('multiplayer_players')
        .insert({
          room_id: room.id,
          user_id: profile.uid,
          username: profile.name || 'Anonymous',
        });

      if (joinError) {
         // If unique violation, we are already joined, which is fine
         if (!joinError.message.includes('unique constraint')) {
           throw joinError;
         }
      }

      return true;
    } catch (e: any) {
      console.error('Join room error:', e);
      setError(e.message || 'Failed to join room');
      return false;
    }
  };

  return { onlineUsers, isConnected, createRoom, joinRoom, error, activeRooms };
}
