import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export type Player = {
  id: string;
  user_id: string;
  username: string;
  score: number;
  status: 'ready' | 'answering' | 'answered';
};

export type RoomState = {
  id: string;
  code: string;
  host_id: string;
  status: 'waiting' | 'playing' | 'finished';
  current_question_index: number;
  game_type: 'quiz' | 'word-scramble' | 'hangman';
};

// MVP: Hardcoded questions for now. In a real app, fetch from a 'questions' table or JSON column.
export const MULTIPLAYER_QUESTIONS = [
  {
    id: 1,
    question: "Which Prophet built the Kaaba with his son?",
    options: ["Prophet Musa (AS)", "Prophet Ibrahim (AS)", "Prophet Nuh (AS)", "Prophet Isa (AS)"],
    correct: 1, // Index
  },
  {
    id: 2,
    question: "What is the first Surah in the Quran?",
    options: ["Surah Al-Baqarah", "Surah Al-Ikhlas", "Surah Al-Fatiha", "Surah Yasin"],
    correct: 2,
  },
  {
    id: 3,
    question: "How many prayers are obligatory in a day?",
    options: ["3", "4", "5", "6"],
    correct: 2,
  },
  {
    id: 4,
    question: "Which month is the month of fasting?",
    options: ["Shawwal", "Ramadan", "Muharram", "Rajab"],
    correct: 1,
  },
  {
    id: 5,
    question: "Who was the first Caliph of Islam?",
    options: ["Abu Bakr (RA)", "Umar (RA)", "Uthman (RA)", "Ali (RA)"],
    correct: 0,
  }
];

export const HANGMAN_WORDS = [
  { word: "MUHAMMAD", hint: "The Seal of Prophets" },
  { word: "RAMADAN", hint: "Month of Fasting" },
  { word: "MAKKAH", hint: "Holiest City" },
  { word: "ZAKAT", hint: "Charity" },
  { word: "QURAN", hint: "Holy Book" },
  { word: "BILAL", hint: "First Muezzin" },
  { word: "KAABA", hint: "House of Allah" },
  { word: "ZAMZAM", hint: "Blessed Water" }
];

export function useMultiplayerGame(roomCode: string) {
  const { profile, loading: authLoading } = useAuth();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Computed
  const isHost = room?.host_id === profile?.uid;
  const currentQuestion = room ? MULTIPLAYER_QUESTIONS[room.current_question_index] : null;
  const isGameOver = room?.status === 'finished';

  // Initial Fetch
  useEffect(() => {
    if (authLoading) return;
    
    if (!profile) {
      setLoading(false);
      setError("Please sign in to join the game");
      return;
    }

    if (!roomCode) return;

    const fetchRoomData = async () => {
      try {
        // 1. Get Room
        const { data: roomData, error: roomError } = await supabase
          .from('multiplayer_rooms')
          .select('*')
          .eq('code', roomCode)
          .single();

        if (roomError) throw roomError;
        setRoom(roomData);

        // 2. Get Players
        const { data: playersData, error: playersError } = await supabase
          .from('multiplayer_players')
          .select('*')
          .eq('room_id', roomData.id);

        if (playersError) throw playersError;
        setPlayers(playersData || []);
        
        setLoading(false);
      } catch (e: any) {
        console.error("Error fetching room:", e);
        setError(e.message);
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomCode, profile, authLoading]);

  // Realtime Subscriptions
  useEffect(() => {
    if (!room?.id) return;

    const channel = supabase.channel(`room_${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'multiplayer_rooms', filter: `id=eq.${room.id}` },
        (payload) => {
          setRoom(payload.new as RoomState);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'multiplayer_players', filter: `room_id=eq.${room.id}` },
        (payload) => {
           // Refetch all players to ensure consistency, or handle delta updates.
           // For simplicity in MVP, we'll just refetch players when any player changes.
           // Optimization: Manually update state based on payload.eventType
           fetchPlayers(room.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id]);

  const fetchPlayers = async (roomId: string) => {
      const { data } = await supabase
          .from('multiplayer_players')
          .select('*')
          .eq('room_id', roomId)
          .order('score', { ascending: false });
      
      if (data) setPlayers(data);
  };

  // Actions
  const startGame = async () => {
    if (!isHost || !room) return;
    await supabase
      .from('multiplayer_rooms')
      .update({ status: 'playing', current_question_index: 0 })
      .eq('id', room.id);
  };

  const nextQuestion = async () => {
    if (!isHost || !room) return;
    const nextIndex = room.current_question_index + 1;
    
    // Check if game is over based on type
    let maxQuestions = MULTIPLAYER_QUESTIONS.length;
    if (room.game_type === 'word-scramble') maxQuestions = 8;
    if (room.game_type === 'hangman') maxQuestions = HANGMAN_WORDS.length;
    
    if (nextIndex >= maxQuestions) {
      await supabase
        .from('multiplayer_rooms')
        .update({ status: 'finished' })
        .eq('id', room.id);
    } else {
      await supabase
        .from('multiplayer_rooms')
        .update({ current_question_index: nextIndex })
        .eq('id', room.id);
      
      // Reset player status
      await supabase
          .from('multiplayer_players')
          .update({ status: 'answering' })
          .eq('room_id', room.id);
    }
  };

  const submitAnswer = async (value: number) => {
    if (!room || !profile) return;
    
    let points = 0;

    if (room.game_type === 'word-scramble') {
        // For Scramble, value passed is the points directly (e.g. 10)
        points = value;
    } else if (room.game_type === 'hangman') {
        // For Hangman, value is points (10)
        points = value;
    } else {
        // For Quiz, value is the option index
        const isCorrect = currentQuestion?.correct === value;
        points = isCorrect ? 10 : 0;
    }

    // Optimistic update
    setPlayers(prev => prev.map(p => 
        p.user_id === profile.uid 
        ? { ...p, score: p.score + points, status: 'answered' } 
        : p
    ));

    // DB Update
    const me = players.find(p => p.user_id === profile.uid);
    const newScore = (me?.score || 0) + points;

    await supabase
      .from('multiplayer_players')
      .update({ 
          score: newScore,
          status: 'answered' 
      })
      .eq('room_id', room.id)
      .eq('user_id', profile.uid);
  };

  return {
    room,
    players,
    loading,
    error,
    isHost,
    currentQuestion,
    isGameOver,
    startGame,
    nextQuestion,
    submitAnswer
  };
}
