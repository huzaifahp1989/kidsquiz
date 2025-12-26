import React, { useEffect, useState } from 'react';
import { useMultiplayerGame, MULTIPLAYER_QUESTIONS } from '@/hooks/useMultiplayerGame';
import { WordScrambleGame, SCRAMBLE_WORDS } from './WordScrambleGame';
import { MultiplayerHangman } from './MultiplayerHangman';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export const GameRoom = ({ code }: { code: string }) => {
  const { 
    room, 
    players, 
    loading, 
    error, 
    isHost, 
    startGame, 
    currentQuestion, 
    submitAnswer,
    nextQuestion,
    isGameOver 
  } = useMultiplayerGame(code);

  const { profile } = useAuth();
  const router = useRouter();
  const [hasAnswered, setHasAnswered] = useState(false);

  // Reset local answer state when question changes
  useEffect(() => {
    setHasAnswered(false);
  }, [room?.current_question_index]);

  if (loading) return <div className="p-10 text-center">Loading game room...</div>;
  if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  if (!room) return <div className="p-10 text-center">Room not found</div>;

  // --- WAITING LOBBY ---
  if (room.status === 'waiting') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className={`p-8 text-center text-white ${room.game_type === 'word-scramble' ? 'bg-purple-600' : room.game_type === 'hangman' ? 'bg-orange-600' : 'bg-indigo-600'}`}>
            <div className="text-xl opacity-80 mb-2">Room Code</div>
            <div className="text-5xl font-mono font-bold tracking-wider mb-4">{code}</div>
            <p>Share this code with your friends!</p>
            <div className="mt-4 inline-block bg-white bg-opacity-20 px-4 py-1 rounded-full text-sm font-bold">
              Mode: {room.game_type === 'word-scramble' ? 'Word Scramble 🔤' : room.game_type === 'hangman' ? 'Hangman Race 🏗️' : 'Islamic Quiz ❓'}
            </div>
          </div>
          
          <div className="p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center justify-between">
              <span>Players Joined</span>
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
                {players.length}
              </span>
            </h3>

            <div className="space-y-3 mb-8">
              {players.map(player => (
                <div key={player.id} className="flex items-center p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                    {player.username[0].toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-700">{player.username}</span>
                  {player.user_id === room.host_id && (
                    <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">HOST</span>
                  )}
                </div>
              ))}
            </div>

            {isHost ? (
              <button 
                onClick={startGame}
                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg transform transition hover:-translate-y-1"
              >
                Start Game 🚀
              </button>
            ) : (
              <div className="text-center text-gray-500 italic animate-pulse">
                Waiting for host to start the game...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- GAME RESULTS ---
  if (room.status === 'finished') {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Game Over!</h2>
          <p className="text-gray-600 mb-8">Here are the final results</p>

          <div className="space-y-4 mb-8">
            {sortedPlayers.map((player, index) => (
              <div 
                key={player.id} 
                className={`flex items-center p-4 rounded-xl border-2 ${
                  index === 0 ? 'border-yellow-400 bg-yellow-50' : 'border-gray-100'
                }`}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4
                  ${index === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 text-gray-600'}
                `}>
                  {index + 1}
                </div>
                <div className="font-bold text-lg text-gray-800">{player.username}</div>
                <div className="ml-auto font-mono font-bold text-indigo-600">{player.score} pts</div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => router.push('/multiplayer')}
            className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // --- ACTIVE GAME: WORD SCRAMBLE ---
  if (room.game_type === 'word-scramble') {
    return (
      <WordScrambleGame 
        room={room}
        players={players}
        isHost={isHost}
        onNextRound={nextQuestion}
        onSubmit={(points) => submitAnswer(points)} // Generic points handling
        currentRoundIndex={room.current_question_index}
      />
    );
  }

  // --- ACTIVE GAME: HANGMAN ---
  if (room.game_type === 'hangman') {
    return (
      <MultiplayerHangman
        room={room}
        players={players}
        isHost={isHost}
        onNextRound={nextQuestion}
        onSubmit={(points) => submitAnswer(points)}
        currentRoundIndex={room.current_question_index}
      />
    );
  }

  // --- ACTIVE GAME: QUIZ ---
  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-6">
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm font-mono font-bold text-indigo-600">
          Q: {room.current_question_index + 1} / {MULTIPLAYER_QUESTIONS.length}
        </div>
        <div className="flex -space-x-2">
           {players.map(p => (
             <div key={p.id} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs" title={`${p.username}: ${p.score}`}>
               {p.username[0]}
             </div>
           ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 leading-relaxed">
            {currentQuestion?.question}
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {currentQuestion?.options.map((option, idx) => {
              // Determine button style
              let btnClass = "p-4 rounded-xl text-left border-2 transition-all font-medium text-lg ";
              
              if (hasAnswered) {
                if (idx === currentQuestion.correct) {
                  btnClass += "bg-green-100 border-green-500 text-green-800";
                } else {
                   btnClass += "bg-gray-50 border-gray-200 text-gray-400 opacity-50";
                }
              } else {
                btnClass += "bg-white border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 text-gray-700";
              }

              return (
                <button
                  key={idx}
                  disabled={hasAnswered}
                  onClick={() => {
                    setHasAnswered(true);
                    submitAnswer(idx); // Index based for quiz
                  }}
                  className={btnClass}
                >
                  <span className="inline-block w-8 font-bold opacity-50">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer / Host Controls */}
        <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-between items-center">
           <div className="text-sm text-gray-500">
             {hasAnswered ? "Answer submitted! Waiting for next question..." : "Choose the best answer."}
           </div>
           
           {isHost && (
             <button
               onClick={nextQuestion}
               className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition"
             >
               Next Question ➡️
             </button>
           )}
        </div>
      </div>
    </div>
  );
};
