import React, { useState, useEffect } from 'react';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export const MultiplayerLobby: React.FC = () => {
  const { profile } = useAuth();
  const { onlineUsers, isConnected, createRoom, joinRoom, error } = useMultiplayer();
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [selectedGame, setSelectedGame] = useState<'quiz' | 'word-scramble' | 'hangman' | 'quran-verses' | 'prophet-timeline' | 'dua-completion'>('quiz');
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [showRoomPreview, setShowRoomPreview] = useState(true);
  const router = useRouter();

  // Simulate fetching active rooms from backend
  useEffect(() => {
    if (isConnected) {
      setActiveRooms([
        { code: 'QUIZ01', game: 'quiz', players: 2, maxPlayers: 4, level: 'medium' },
        { code: 'WORD02', game: 'word-scramble', players: 1, maxPlayers: 4, level: 'easy' },
        { code: 'HANG03', game: 'hangman', players: 3, maxPlayers: 4, level: 'hard' },
      ]);
    }
  }, [isConnected]);

  const handleCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const room = await createRoom(selectedGame);
      if (room) {
        router.push(`/multiplayer/room/${room.code}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode) return;
    const success = await joinRoom(joinCode.toUpperCase());
    if (success) {
      router.push(`/multiplayer/room/${joinCode.toUpperCase()}`);
    }
  };

  const gameOptions = [
    { id: 'quiz', name: 'Islamic Quiz', icon: '❓', color: 'indigo' },
    { id: 'word-scramble', name: 'Word Scramble', icon: '🔤', color: 'purple' },
    { id: 'hangman', name: 'Hangman', icon: '🏗️', color: 'orange' },
    { id: 'quran-verses', name: 'Quran Verses', icon: '📜', color: 'green' },
    { id: 'prophet-timeline', name: 'Prophet Timeline', icon: '📜', color: 'blue' },
    { id: 'dua-completion', name: 'Dua Completion', icon: '🙏', color: 'pink' },
  ];

  if (!profile) {
    return (
       <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-gray-100">
         <div className="text-4xl mb-4">🔒</div>
         <h3 className="text-xl font-bold text-gray-800 mb-2">Login Required</h3>
         <p className="text-gray-500 mb-6">Please sign in to join the multiplayer arena.</p>
         <button 
           onClick={() => router.push('/signin')}
           className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
         >
           Go to Login
         </button>
       </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2">Find or Create a Game</h2>
        <p className="text-indigo-100 mb-6">Challenge friends and earn points together in real-time</p>
        
        {/* Game Mode Selection - Quick Scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {gameOptions.map((game: any) => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id as any)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-semibold transition-all ${
                selectedGame === game.id 
                  ? 'bg-white text-indigo-600 shadow-lg' 
                  : 'bg-indigo-500 text-white hover:bg-indigo-400'
              }`}
            >
              {game.icon} {game.name}
            </button>
          ))}
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between ${
        isConnected 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className={`font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
            {isConnected ? `Connected • ${onlineUsers.length} online` : error ? `Error: ${error}` : 'Connecting...'}
          </span>
        </div>
        <span className="text-sm font-semibold">
          {activeRooms.filter((r) => r.game === selectedGame).length} active
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Actions */}
        <div className="space-y-4">
          {/* Create Room Button */}
          <button 
            onClick={handleCreate}
            disabled={!isConnected || isCreating}
            className={`w-full p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 ${
              !isConnected || isCreating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div className="text-4xl mb-2">🎲</div>
            <div className="text-xl font-bold">{isCreating ? 'Creating...' : 'Create Room'}</div>
            <div className="text-indigo-100 text-sm">Start a new game</div>
          </button>

          {/* Join Room Button */}
          {!showJoinForm ? (
            <button 
              onClick={() => setShowJoinForm(true)}
              disabled={!isConnected}
              className={`w-full p-6 rounded-2xl bg-white border-2 border-gray-300 hover:border-indigo-400 text-gray-700 shadow-sm hover:shadow-md transition-all ${
                !isConnected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className="text-4xl mb-2">🔐</div>
              <div className="text-xl font-bold">Join with Code</div>
              <div className="text-gray-500 text-sm">Enter room code</div>
            </button>
          ) : (
            <div className="p-6 rounded-2xl bg-white border-2 border-indigo-300 shadow-md">
              <div className="text-lg font-bold mb-4 text-gray-800">Enter Room Code</div>
              <input 
                type="text" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full border rounded-lg px-4 py-3 uppercase tracking-widest font-mono text-lg text-center mb-3 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                placeholder="ABCD"
                maxLength={6}
                autoFocus
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleJoin}
                  disabled={!joinCode}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Join
                </button>
                <button 
                  onClick={() => setShowJoinForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Middle: Active Rooms */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">🏠</span> 
            Open Rooms ({activeRooms.filter((r) => r.game === selectedGame).length})
          </h3>
          
          {activeRooms.filter((r) => r.game === selectedGame).length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
              <div className="text-5xl mb-4">🎪</div>
              <p className="text-gray-600 font-semibold mb-4">No rooms for {gameOptions.find((g) => g.id === selectedGame)?.name}</p>
              <p className="text-gray-500 text-sm">Create one to invite friends!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {activeRooms
                .filter((r) => r.game === selectedGame)
                .map((room: any) => (
                  <div
                    key={room.code}
                    className="bg-white rounded-xl p-4 border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      setJoinCode(room.code);
                      handleJoin();
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-bold text-gray-800 mb-1">Room {room.code}</div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>👥 {room.players}/{room.maxPlayers}</span>
                          <span className="capitalize">{room.level} level</span>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
                        Join →
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Online Players Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">👥</span> Players Online Now ({onlineUsers.length})
        </h3>
        
        {onlineUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2">⏳</div>
            <p>Waiting for friends to join...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {onlineUsers.map((user) => (
              <div key={user.user_id} className="p-3 rounded-xl border border-gray-200 bg-gradient-to-br from-indigo-50 to-purple-50 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-lg mb-2 mx-auto">
                  👤
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-700 text-sm truncate">{user.username}</div>
                  <div className="text-xs text-indigo-600 font-bold capitalize">{user.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center">
          <span className="mr-3 text-lg">⚠️</span>
          <div>
            <div className="font-bold">Connection Error</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4">
        <h4 className="font-bold text-blue-900 mb-2">💡 Tips for Multiplayer Success</h4>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>✓ Faster answers = bonus points!</li>
          <li>✓ Beat your friends on the leaderboard</li>
          <li>✓ Multiple rooms = play with different friends</li>
          <li>✓ Earn badges for winning streaks</li>
        </ul>
      </div>
    </div>
  );
};
