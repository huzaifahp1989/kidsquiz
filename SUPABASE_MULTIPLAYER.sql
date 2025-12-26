-- ============================================================================
-- MULTIPLAYER GAME SYSTEM SETUP
-- ============================================================================

-- 1. Create Rooms Table
CREATE TABLE IF NOT EXISTS public.multiplayer_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL,
    host_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'waiting', -- waiting, playing, finished
    game_type TEXT DEFAULT 'quiz',
    current_question_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint on code if not exists (handling potential re-runs)
DO $$ BEGIN
    ALTER TABLE public.multiplayer_rooms ADD CONSTRAINT multiplayer_rooms_code_key UNIQUE (code);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 2. Create Players Table (Junction)
CREATE TABLE IF NOT EXISTS public.multiplayer_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    username TEXT, -- Cache username for faster display
    score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ready', -- ready, answering, answered
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for user per room
DO $$ BEGIN
    ALTER TABLE public.multiplayer_players ADD CONSTRAINT multiplayer_players_room_user_key UNIQUE (room_id, user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 3. Enable RLS
ALTER TABLE public.multiplayer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_players ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Rooms
DROP POLICY IF EXISTS "Anyone can read rooms" ON public.multiplayer_rooms;
CREATE POLICY "Anyone can read rooms" ON public.multiplayer_rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users can create rooms" ON public.multiplayer_rooms;
CREATE POLICY "Auth users can create rooms" ON public.multiplayer_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Host can update room" ON public.multiplayer_rooms;
CREATE POLICY "Host can update room" ON public.multiplayer_rooms FOR UPDATE USING (auth.uid() = host_id);

-- 5. Policies for Players
DROP POLICY IF EXISTS "Anyone can read players" ON public.multiplayer_players;
CREATE POLICY "Anyone can read players" ON public.multiplayer_players FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users can join" ON public.multiplayer_players;
CREATE POLICY "Auth users can join" ON public.multiplayer_players FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own status" ON public.multiplayer_players;
CREATE POLICY "Users can update own status" ON public.multiplayer_players FOR UPDATE USING (auth.uid() = user_id);

-- 6. Realtime Publication
-- Add tables to the realtime publication so clients receive updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.multiplayer_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.multiplayer_players;
