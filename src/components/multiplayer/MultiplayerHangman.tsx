import React, { useEffect, useState } from 'react';
import { HANGMAN_WORDS } from '@/hooks/useMultiplayerGame';

interface MultiplayerHangmanProps {
  room: any;
  players: any[];
  isHost: boolean;
  onNextRound: () => void;
  onSubmit: (score: number) => void;
  currentRoundIndex: number;
}

export const MultiplayerHangman: React.FC<MultiplayerHangmanProps> = ({
  room,
  players,
  isHost,
  onNextRound,
  onSubmit,
  currentRoundIndex
}) => {
  const [currentWordObj, setCurrentWordObj] = useState(HANGMAN_WORDS[0]);
  const [guesses, setGuesses] = useState<Set<string>>(new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const [isRoundOver, setIsRoundOver] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const index = currentRoundIndex % HANGMAN_WORDS.length;
    setCurrentWordObj(HANGMAN_WORDS[index]);
    setGuesses(new Set());
    setWrongCount(0);
    setIsRoundOver(false);
    setMessage('');
  }, [currentRoundIndex]);

  const handleGuess = (char: string) => {
    if (isRoundOver || guesses.has(char)) return;

    const newGuesses = new Set(guesses);
    newGuesses.add(char);
    setGuesses(newGuesses);

    const word = currentWordObj.word.toUpperCase();
    if (!word.includes(char)) {
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      if (newWrong >= 6) {
        setMessage(`❌ Game Over! The word was ${word}`);
        setIsRoundOver(true);
        // No points for failure
      }
    } else {
      // Check win
      const isComplete = [...word].every(c => newGuesses.has(c));
      if (isComplete) {
        setMessage('🎉 MashaAllah! You solved it! +10 Points');
        setIsRoundOver(true);
        onSubmit(10);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
       {/* Header Info */}
      <div className="flex justify-between items-center mb-6">
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm font-mono font-bold text-purple-600">
          Round: {currentRoundIndex + 1} / {HANGMAN_WORDS.length}
        </div>
        <div className="flex -space-x-2">
           {players.map(p => (
             <div key={p.id} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs" title={`${p.username}: ${p.score}`}>
               {p.username[0]}
             </div>
           ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center">
        <div className="flex flex-col items-center">
            {/* Hangman Visual */}
            <div className="mb-6 relative w-48 h-48 border-b-4 border-gray-800 bg-gray-50 rounded-lg shadow-inner">
                {/* Gallows */}
                <div className="absolute bottom-0 left-8 w-2 h-40 bg-gray-800"></div>
                <div className="absolute top-4 left-8 w-24 h-2 bg-gray-800"></div>
                <div className="absolute top-4 left-28 w-2 h-8 bg-gray-800"></div>
                
                {/* Stick Figure */}
                {wrongCount >= 1 && <div className="absolute top-12 left-[102px] w-8 h-8 rounded-full border-4 border-gray-800"></div>}
                {wrongCount >= 2 && <div className="absolute top-20 left-[116px] w-1 h-14 bg-gray-800"></div>}
                {wrongCount >= 3 && <div className="absolute top-24 left-[116px] w-8 h-1 bg-gray-800 transform -rotate-45 origin-left"></div>}
                {wrongCount >= 4 && <div className="absolute top-24 left-[116px] w-8 h-1 bg-gray-800 transform rotate-45 origin-left"></div>}
                {wrongCount >= 5 && <div className="absolute top-32 left-[116px] w-8 h-1 bg-gray-800 transform -rotate-45 origin-left"></div>}
                {wrongCount >= 6 && <div className="absolute top-32 left-[116px] w-8 h-1 bg-gray-800 transform rotate-45 origin-left"></div>}
            </div>

            {/* Word Display */}
            <div className="flex gap-2 mb-8 flex-wrap justify-center">
            {currentWordObj.word.split('').map((char, idx) => (
                <div key={idx} className="w-10 h-12 flex items-center justify-center border-b-4 border-gray-800 text-2xl font-bold uppercase bg-white rounded-t shadow-sm">
                    {guesses.has(char.toUpperCase()) ? char.toUpperCase() : ''}
                </div>
            ))}
            </div>

            {/* Keyboard */}
            <div className="grid grid-cols-7 gap-2 max-w-lg w-full mb-6">
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(char => {
                const isGuessed = guesses.has(char);
                const word = currentWordObj.word.toUpperCase();
                const isWrong = isGuessed && !word.includes(char);
                const isRight = isGuessed && word.includes(char);
                
                return (
                <button
                    key={char}
                    onClick={() => handleGuess(char)}
                    disabled={isGuessed || isRoundOver}
                    className={`p-2 rounded font-bold text-lg transition-colors shadow-sm ${
                    isRight ? 'bg-green-500 text-white' :
                    isWrong ? 'bg-red-500 text-white' :
                    'bg-white border border-gray-200 hover:bg-blue-50 text-gray-800'
                    } ${isGuessed ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {char}
                </button>
                );
            })}
            </div>

             {message && (
                <div className={`mb-6 p-4 rounded-lg font-bold ${message.includes('MashaAllah') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message}
                </div>
            )}
            
            {/* Host Controls */}
            {isHost && isRoundOver && (
                <button
                    onClick={onNextRound}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg"
                >
                    Next Word ➡️
                </button>
            )}
             {!isHost && isRoundOver && (
                <div className="text-gray-500 animate-pulse">
                    Waiting for host to start next round...
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
