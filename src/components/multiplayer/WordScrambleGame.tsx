import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export const SCRAMBLE_WORDS = [
  { word: "RAMADAN", hint: "Month of Fasting" },
  { word: "MADINAH", hint: "City of the Prophet (SAW)" },
  { word: "QURAN", hint: "Holy Book of Islam" },
  { word: "KAABA", hint: "House of Allah" },
  { word: "ZAKAT", hint: "Charity" },
  { word: "SALAH", hint: "Prayer" },
  { word: "JUMMAH", hint: "Friday Prayer" },
  { word: "EID", hint: "Festival" },
];

interface WordScrambleGameProps {
  room: any;
  players: any[];
  isHost: boolean;
  onNextRound: () => void;
  onSubmit: (score: number) => void;
  currentRoundIndex: number;
}

export const WordScrambleGame: React.FC<WordScrambleGameProps> = ({
  room,
  players,
  isHost,
  onNextRound,
  onSubmit,
  currentRoundIndex
}) => {
  const [currentWordObj, setCurrentWordObj] = useState(SCRAMBLE_WORDS[0]);
  const [scrambledWord, setScrambledWord] = useState('');
  const [userGuess, setUserGuess] = useState('');
  const [message, setMessage] = useState('');
  const [isRoundOver, setIsRoundOver] = useState(false);

  useEffect(() => {
    const index = currentRoundIndex % SCRAMBLE_WORDS.length;
    const wordObj = SCRAMBLE_WORDS[index];
    setCurrentWordObj(wordObj);
    
    // Scramble logic
    const scramble = (w: string) => {
      const arr = w.split('');
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr.join('');
    };
    
    // Ensure scrambled is different from original
    let s = scramble(wordObj.word);
    while (s === wordObj.word) {
      s = scramble(wordObj.word);
    }
    setScrambledWord(s);
    
    setUserGuess('');
    setMessage('');
    setIsRoundOver(false);
  }, [currentRoundIndex]);

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRoundOver) return;

    if (userGuess.toUpperCase().trim() === currentWordObj.word) {
      setMessage('✅ Correct! +10 Points');
      setIsRoundOver(true);
      onSubmit(10);
    } else {
      setMessage('❌ Try again!');
      setTimeout(() => setMessage(''), 1000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-6">
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm font-mono font-bold text-purple-600">
          Round: {currentRoundIndex + 1} / {SCRAMBLE_WORDS.length}
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
        <div className="mb-8">
          <p className="text-gray-500 text-sm mb-2 uppercase tracking-widest font-bold">Unscramble This Word</p>
          <h2 className="text-5xl font-mono font-bold text-purple-600 tracking-widest mb-4">
            {scrambledWord}
          </h2>
          {/* Hint removed as per user request */}
          {/* <div className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            Hint: {currentWordObj.hint}
          </div> */}
        </div>

        <form onSubmit={handleGuess} className="max-w-md mx-auto space-y-4">
          <input 
            type="text" 
            value={userGuess}
            onChange={(e) => setUserGuess(e.target.value)}
            disabled={isRoundOver}
            className="w-full text-center text-2xl p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none uppercase"
            placeholder="Type your answer..."
          />
          
          <button 
            type="submit"
            disabled={isRoundOver || !userGuess}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition disabled:opacity-50"
          >
            Submit Answer
          </button>
        </form>

        {message && (
          <div className={`mt-4 text-lg font-bold ${message.includes('Correct') ? 'text-green-600' : 'text-red-500'}`}>
            {message}
          </div>
        )}
      </div>

      {/* Footer / Host Controls */}
      <div className="mt-6 flex justify-between items-center">
         <div className="text-sm text-gray-500">
           {isRoundOver ? "Waiting for next round..." : "Be the first to solve it!"}
         </div>
         
         {isHost && (
           <button
             onClick={onNextRound}
             className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition"
           >
             Next Round ➡️
           </button>
         )}
      </div>
    </div>
  );
};
