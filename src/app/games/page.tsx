'use client';

import React, { useState } from 'react';
import { Button } from '@/components';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { calculateLevel } from '@/lib/utils';

interface GameOption {
  id: number;
  text: string;
  correct?: boolean;
}

const games = [
  {
    id: 'game-1',
    title: 'Matching Ayah to Meaning',
    icon: '🎯',
    description: 'Match Quranic verses to their meanings',
    type: 'matching',
  },
  {
    id: 'game-2',
    title: 'Memory Cards',
    icon: '🧠',
    description: 'Find matching pairs of Islamic terms',
    type: 'memory',
  },
  {
    id: 'game-3',
    title: 'True or False',
    icon: '✅',
    description: 'Answer true/false Islamic questions',
    type: 'trueFalse',
  },
  {
    id: 'game-4',
    title: 'Multiple Choice',
    icon: '❓',
    description: 'Choose the correct Islamic answer',
    type: 'multipleChoice',
  },
];

const gameQuestions = [
  {
    question: 'In which year did the Prophet ﷺ make the Hijrah from Makkah to Madinah?',
    options: ['610 CE', '622 CE', '632 CE', '650 CE'],
    answer: 1,
    points: 5,
  },
  {
    question: 'To which city did the Prophet ﷺ migrate during the Hijrah?',
    options: ['Taif', 'Jerusalem', 'Madinah', 'Cairo'],
    answer: 2,
    points: 5,
  },
  {
    question: 'Where was the first revelation received?',
    options: ['Cave Hira near Makkah', 'Masjid al-Aqsa', 'Mount Uhud', 'Cave Thawr'],
    answer: 0,
    points: 5,
  },
  {
    question: 'Which surah contains the first revealed verses?',
    options: ['Al-Fatihah', 'Al-Alaq (1-5)', 'Al-Baqarah', 'Al-Ikhlas'],
    answer: 1,
    points: 5,
  },
  {
    question: 'How many daily prayers are obligatory?',
    options: ['Three', 'Four', 'Five', 'Seven'],
    answer: 2,
    points: 5,
  },
  {
    question: 'Which companion accompanied the Prophet ﷺ during the Hijrah?',
    options: ['Umar ibn al-Khattab', 'Abu Bakr as-Siddiq', 'Ali ibn Abi Talib', 'Uthman ibn Affan'],
    answer: 1,
    points: 5,
  },
  {
    question: 'Which surah is the longest in the Quran?',
    options: ['Al-Imran', 'An-Nisa', 'Al-Baqarah', 'Al-Ma’idah'],
    answer: 2,
    points: 5,
  },
  {
    question: 'Which surah is among the shortest in the Quran?',
    options: ['Al-Ikhlas', 'Al-Kawthar', 'Al-Fil', 'Al-Qariah'],
    answer: 1,
    points: 5,
  },
  {
    question: 'The hadith “Actions are by intentions” is narrated by which Imam?',
    options: ['Imam Bukhari', 'Imam Malik', 'Imam Ahmad', 'Imam Abu Dawud'],
    answer: 0,
    points: 5,
  },
  {
    question: 'Which collection is widely regarded as the most authentic hadith compilation?',
    options: ['Sunan an-Nasa’i', 'Sahih al-Bukhari', 'Muwatta Malik', 'Musnad Ahmad'],
    answer: 1,
    points: 5,
  },
];

export default function GamesPage() {
  const { user, refreshProfile } = useAuth();
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [points, setPoints] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [awaitedAnswers, setAwaitedAnswers] = useState<Set<number>>(new Set());

  const handleSelectGame = (game: any) => {
    setSelectedGame(game);
    setGameStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setPoints(0);
    setFeedback('');
    setShowFeedback(false);
  };

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    const currentQuestion = gameQuestions[currentQuestionIndex];
    
    if (answerIndex === currentQuestion.answer) {
      setFeedback('🎉 Correct! Great job!');
      const newPoints = points + currentQuestion.points;
      setPoints(newPoints);
      // Persist points to Supabase for the signed-in user (additive)
      if (user?.id) {
        void (async () => {
          const earned = currentQuestion.points;
          
          const { data: row, error: readErr } = await supabase
            .from('users')
            .select('points,weeklypoints,monthlypoints')
            .eq('uid', user.id)
            .maybeSingle();

          if (readErr || !row) {
            console.error('[games] read failed:', readErr);
            setToast('❌ Failed');
            return;
          }

          const nextTotal = (row.points || 0) + earned;

          const { error } = await supabase
            .from('users')
            .update({
              points: nextTotal,
              weeklypoints: (row.weeklypoints || 0) + earned,
              monthlypoints: (row.monthlypoints || 0) + earned,
              level: calculateLevel(nextTotal),
            })
            .eq('uid', user.id);

          if (!error) {
            setToast(`⭐ +${earned} points!`);
            setTimeout(() => setToast(null), 2000);
            // Refresh profile to show updated points
            await refreshProfile();
          } else {
            console.error('[games] update failed:', error);
            setToast('⚠️ Sync failed');
          }
        })();
      }
    } else {
      setFeedback('Try again! 💪');
    }
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < gameQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setFeedback('');
      setShowFeedback(false);
    } else {
      setGameStarted(false);
      setSelectedGame(null);
    }
  };

  const handleQuitGame = () => {
    setGameStarted(false);
    setSelectedGame(null);
    setCurrentQuestionIndex(0);
    setPoints(0);
    setShowFeedback(false);
    setPracticeMode(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-islamic-light to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-islamic-dark mb-2 islamic-shadow">
            🎮 Islamic Games
          </h1>
          <p className="text-lg text-gray-600">
            Have fun learning while earning points!
          </p>
        </div>

        {!gameStarted ? (
          <div>
            {/* Games Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {games.map(game => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game)}
                  className="p-8 border-4 border-gray-300 rounded-2xl hover:border-islamic-blue hover:shadow-lg transition bg-white"
                >
                  <div className="text-6xl mb-4">{game.icon}</div>
                  <h3 className="text-2xl font-bold text-islamic-dark mb-2">{game.title}</h3>
                  <p className="text-gray-600 mb-4">{game.description}</p>
                  <div className="text-sm text-islamic-blue font-semibold">
                    Play Now →
                  </div>
                </button>
              ))}
            </div>

            {/* How to Play */}
            <div className="bg-yellow-50 border-l-4 border-islamic-gold p-6 rounded-lg">
              <h4 className="font-bold text-yellow-700 mb-3 text-lg">🎯 How to Play</h4>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Choose a game from above</li>
                <li>✓ Answer the questions correctly</li>
                <li>✓ Earn points for each correct answer</li>
                <li>✓ Complete all games to earn special rewards</li>
                <li>✓ Challenge your friends on the leaderboard!</li>
              </ul>
            </div>
          </div>
        ) : selectedGame && !showFeedback ? (
          <div className="space-y-6">
            {/* Game Header */}
            <div className="bg-gradient-to-r from-islamic-blue to-islamic-green text-white p-8 rounded-2xl">
              <div className="text-5xl mb-3">{selectedGame.icon}</div>
              <h2 className="text-3xl font-bold mb-4">{selectedGame.title}</h2>
              <div className="flex justify-between items-center text-lg">
                <span>Question {currentQuestionIndex + 1}/{gameQuestions.length}</span>
                <span>⭐ {points} Points</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-islamic-green h-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / gameQuestions.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Question */}
            <div className="bg-blue-50 p-8 rounded-2xl border-2 border-islamic-blue">
              <h3 className="text-2xl font-bold text-islamic-dark mb-6">
                {gameQuestions[currentQuestionIndex].question}
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {gameQuestions[currentQuestionIndex].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className="w-full p-4 text-lg font-semibold bg-white border-2 border-gray-300 rounded-lg hover:border-islamic-blue hover:shadow-md transition text-left"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Quit Button */}
            <Button
              onClick={handleQuitGame}
              variant="secondary"
              className="w-full"
            >
              🏠 Quit Game
            </Button>
            {practiceMode && (
              <div className="text-center text-sm text-gray-600 mt-2">
                Practice mode: points award once per day.
              </div>
            )}
          </div>
        ) : selectedGame && showFeedback ? (
          <div className="space-y-6">
            {/* Feedback */}
            <div className={`p-8 rounded-2xl text-center ${
              feedback.includes('Correct')
                ? 'bg-green-100 border-4 border-green-500'
                : 'bg-yellow-100 border-4 border-yellow-500'
            }`}>
              <div className={`text-6xl mb-4 ${
                feedback.includes('Correct') ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {feedback.includes('Correct') ? '✅' : '💪'}
              </div>
              <h3 className="text-3xl font-bold mb-2">
                {feedback.includes('Correct')
                  ? 'Awesome!'
                  : 'Not this time...'}
              </h3>
              <p className={`text-lg font-semibold ${
                feedback.includes('Correct')
                  ? 'text-green-700'
                  : 'text-yellow-700'
              }`}>
                {feedback}
              </p>
            </div>

            {/* Points Display */}
            {feedback.includes('Correct') && (
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-6 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-2">Points Earned</p>
                <p className="text-4xl font-bold text-islamic-gold">
                  +{gameQuestions[currentQuestionIndex].points}
                </p>
                <p className="text-sm text-gray-600 mt-2">Total: {points} points</p>
              </div>
            )}

            {/* Correct Answer */}
            <div className="bg-blue-50 border-l-4 border-islamic-blue p-6 rounded-lg">
              <p className="text-gray-700">
                <strong>Question:</strong> {gameQuestions[currentQuestionIndex].question}
              </p>
              <p className="text-green-700 font-bold mt-2">
                <strong>Correct Answer:</strong> {gameQuestions[currentQuestionIndex].options[gameQuestions[currentQuestionIndex].answer]}
              </p>
            </div>

            {/* Next Button */}
            <Button
              onClick={handleNext}
              variant="success"
              size="lg"
              className="w-full"
            >
              {currentQuestionIndex < gameQuestions.length - 1
                ? '➡️ Next Question'
                : '🏁 Finish Game'}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
