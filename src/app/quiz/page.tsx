'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { quizzes } from '@/data/quizzes';
import { Button, Modal } from '@/components';
import { CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { calculateLevel } from '@/lib/utils';
import { addPoints as addPointsFallback } from '@/lib/profile-service';

// Seeded random number generator for daily quiz rotation
const seededRandom = (seed: number) => {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

const shuffleArray = <T,>(array: T[], seed: number): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function QuizPage() {
  const [category, setCategory] = useState<'Seerah' | 'Hadith' | 'Prophets' | 'Quran Stories' | 'Akhlaq' | ''>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [resultToast, setResultToast] = useState<string | null>(null);
  const [hasAwarded, setHasAwarded] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);
  const { user, profile, refreshProfile, logout } = useAuth();

  // Get daily seed based on current date
  const dailySeed = useMemo(() => {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  }, []);

  // Select 5 random questions from category based on daily seed
  const filteredQuestions = quizzes.filter(q => q.category === category);
  const currentQuestions = useMemo(() => {
    if (!category) return [];
    const shuffled = shuffleArray(filteredQuestions, dailySeed + category.charCodeAt(0));
    return shuffled.slice(0, 5); // Only take 5 questions
  }, [category, dailySeed, filteredQuestions]);
  
  const currentQuestion = currentQuestions[currentQuestionIndex];

  const handleSelectAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    setShowExplanation(true);

    if (answerIndex === currentQuestion.correctAnswer) {
      setScore(score + 2); // 2 points per correct answer
    }
    setAnsweredCount(answeredCount + 1);
  };

  const handleNext = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleStartQuiz = (cat: 'Seerah' | 'Hadith' | 'Prophets' | 'Quran Stories' | 'Akhlaq') => {
    setCategory(cat);
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnsweredCount(0);
    setQuizComplete(false);
    setHasAwarded(false);
    setResultToast(null);
  };

  const handleResetQuiz = () => {
    setQuizStarted(false);
    setCategory('');
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnsweredCount(0);
    setQuizComplete(false);
    setHasAwarded(false);
    setPracticeMode(false);
    setResultToast(null);
  };

  // Load completed quizzes for this user
  useEffect(() => {
    const loadCompletedQuizzes = async () => {
      if (!user?.id) {
        setCompletedQuizzes([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('quiz_progress')
          .select('category')
          .eq('uid', user.id);
        
        if (error) {
          console.error('Error loading completed quizzes:', error?.message || error);
          setResultToast('⚠️ Could not load completed quizzes. Please re-sign in.');
        } else {
          setCompletedQuizzes(data?.map(q => q.category) || []);
        }
      } catch (err) {
        console.error('Error fetching quiz_progress:', (err as any)?.message || err);
        setResultToast('⚠️ Network issue loading quizzes. Please try again.');
      }
    };

    loadCompletedQuizzes();
  }, [user?.id]);

  // Award points to the signed-in user when the quiz finishes
  useEffect(() => {
    if (!quizComplete || !user?.id || score <= 0 || hasAwarded) {
      console.log('[quiz] Skip award:', { quizComplete, userId: user?.id, score, hasAwarded });
      return;
    }

    let cancelled = false;
    (async () => {
      console.log('[quiz] Awarding points for user:', user.id, 'score:', score);
      
      // Use the database function to add points
      const { data, error } = await supabase
        .rpc('add_points', {
          p_uid: user.id,
          p_points_to_add: score,
        });

      console.log('[quiz] Database response:', { data, error });

      if (cancelled) return;

      setHasAwarded(true);
      
      const handleSuccess = async (awarded: number) => {
        const pointsAwarded = awarded;
        const badgesEarned = data?.badges_earned ?? 0;

        let toastMsg = `⭐ +${pointsAwarded} points!`;
        if (badgesEarned > 0) {
          toastMsg += ` 🏆 ${badgesEarned} badge(s)!`;
        }

        setResultToast(toastMsg);

        const { error: markError } = await supabase
          .rpc('mark_quiz_completed', {
            uid: user.id,
            category: category,
            score_val: score,
          });

        if (markError) {
          console.error('[quiz] Error marking completion:', markError);
        } else {
          setCompletedQuizzes(prev => [...new Set([...prev, category])]);
        }

        await refreshProfile();
      };

      if (error) {
        console.error('[quiz] RPC failed:', error);
        const message = error?.message || 'Could not award points.';
        if (message.toLowerCase().includes('invalid refresh token')) {
          setResultToast('⚠️ Session expired. Please sign in again.');
          await logout?.();
          return;
        }

        // Fallback: direct update via profile-service
        const fallback = await addPointsFallback(user.id, score);
        if (fallback) {
          await handleSuccess(score);
        } else {
          setResultToast(`⚠️ Could not award points (${message}). Please complete your profile first.`);
        }
      } else if (data && !data.success) {
        setResultToast(`⚠️ ${data.reason}`);
      } else if (data && data.success) {
        await handleSuccess(data.points_awarded || score);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [quizComplete, user?.id, score, hasAwarded, refreshProfile, logout, category]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-islamic-light to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-islamic-dark mb-2 islamic-shadow">
            📝 Islamic Knowledge Quizzes
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Test your Islamic knowledge and earn points!
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{profile?.badges || 0}</div>
              <div className="text-xs text-blue-700 font-semibold">🏆 Badges</div>
              <div className="text-xs text-gray-600">(1 per 250 pts)</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{profile?.points || 0}</div>
              <div className="text-xs text-purple-700 font-semibold">⭐ Total Points</div>
              <div className="text-xs text-gray-600">All-time</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-islamic-blue rounded-lg p-4 mt-4">
            <p className="text-sm font-semibold text-islamic-dark mb-1">
              🎯 Points System: 2 points per correct answer | 5 questions per quiz = 10 points max
            </p>
            <p className="text-sm text-gray-700">
              ⭐ Daily Points: Earn up to 100 points per day (resets at midnight)
            </p>
            <p className="text-xs text-gray-600 mt-2">
              🏆 Questions change daily! Play unlimited quizzes and earn 1 badge per 250 points.
            </p>
          </div>
          
          {/* Daily Limit Rules */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">📊</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-green-800 mb-2">Daily Points Limit Rules</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✅ <strong>Play unlimited quizzes</strong> - no restrictions on how many you can take!</li>
                  <li>⭐ <strong>Earn up to 100 points per day</strong> - 2 points per correct answer (5 questions/quiz)</li>
                  <li>🔄 <strong>Questions change daily</strong> - new random questions every day!</li>
                  <li>🕛 <strong>Resets at midnight</strong> - come back tomorrow to earn 100 more points</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {!quizStarted ? (
          <div>
            {/* Category Selection */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-islamic-dark text-center mb-6">
                Choose a Category
              </h2>

              <div className="grid gap-4">
                {/* Seerah */}
                <button
                  onClick={() => handleStartQuiz('Seerah')}
                  disabled={completedQuizzes.includes('Seerah')}
                  className={`p-6 border-4 border-sky-300 rounded-xl hover:shadow-lg transition ${
                    completedQuizzes.includes('Seerah')
                      ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                      : 'bg-sky-50 hover:bg-sky-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-4xl mb-2">🕌</div>
                      <h3 className="text-2xl font-bold text-sky-700 mb-2">Seerah</h3>
                      <p className="text-gray-700 mb-2">Life of Prophet Muhammad ﷺ</p>
                      <p className="text-sm text-gray-600">10 questions • 1 point each</p>
                    </div>
                    {completedQuizzes.includes('Seerah') && (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="text-sky-600 w-8 h-8" />
                        <span className="text-xs text-sky-600 font-bold mt-1">Completed</span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Hadith */}
                <button
                  onClick={() => handleStartQuiz('Hadith')}
                  disabled={completedQuizzes.includes('Hadith')}
                  className={`p-6 border-4 border-yellow-300 rounded-xl hover:shadow-lg transition ${
                    completedQuizzes.includes('Hadith')
                      ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                      : 'bg-yellow-50 hover:bg-yellow-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-4xl mb-2">📖</div>
                      <h3 className="text-2xl font-bold text-yellow-700 mb-2">Hadith</h3>
                      <p className="text-gray-700 mb-2">Sayings of the Prophet ﷺ</p>
                      <p className="text-sm text-gray-600">10 questions • 1 point each</p>
                    </div>
                    {completedQuizzes.includes('Hadith') && (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="text-green-600 w-8 h-8" />
                        <span className="text-xs text-green-600 font-bold mt-1">Completed</span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Prophets */}
                <button
                  onClick={() => handleStartQuiz('Prophets')}
                  disabled={completedQuizzes.includes('Prophets')}
                  className={`p-6 border-4 border-purple-300 rounded-xl hover:shadow-lg transition ${
                    completedQuizzes.includes('Prophets')
                      ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                      : 'bg-purple-50 hover:bg-purple-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-4xl mb-2">⭐</div>
                      <h3 className="text-2xl font-bold text-purple-700 mb-2">Prophets / Ambiya</h3>
                      <p className="text-gray-700 mb-2">Stories of the Prophets</p>
                      <p className="text-sm text-gray-600">10 questions • 1 point each</p>
                    </div>
                    {completedQuizzes.includes('Prophets') && (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="text-green-600 w-8 h-8" />
                        <span className="text-xs text-green-600 font-bold mt-1">Completed</span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Quran Stories */}
                <button
                  onClick={() => handleStartQuiz('Quran Stories')}
                  disabled={completedQuizzes.includes('Quran Stories')}
                  className={`p-6 border-4 border-blue-300 rounded-xl hover:shadow-lg transition ${
                    completedQuizzes.includes('Quran Stories')
                      ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                      : 'bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-4xl mb-2">📕</div>
                      <h3 className="text-2xl font-bold text-blue-700 mb-2">Qur'an Stories</h3>
                      <p className="text-gray-700 mb-2">Stories from the Qur'an</p>
                      <p className="text-sm text-gray-600">10 questions • 1 point each</p>
                    </div>
                    {completedQuizzes.includes('Quran Stories') && (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="text-green-600 w-8 h-8" />
                        <span className="text-xs text-green-600 font-bold mt-1">Completed</span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Akhlaq */}
                <button
                  onClick={() => handleStartQuiz('Akhlaq')}
                  disabled={completedQuizzes.includes('Akhlaq')}
                  className={`p-6 border-4 border-pink-300 rounded-xl hover:shadow-lg transition ${
                    completedQuizzes.includes('Akhlaq')
                      ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                      : 'bg-pink-50 hover:bg-pink-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-4xl mb-2">💖</div>
                      <h3 className="text-2xl font-bold text-pink-700 mb-2">Akhlaq</h3>
                      <p className="text-gray-700 mb-2">Islamic Manners & Character</p>
                      <p className="text-sm text-gray-600">10 questions • 1 point each</p>
                    </div>
                    {completedQuizzes.includes('Akhlaq') && (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="text-green-600 w-8 h-8" />
                        <span className="text-xs text-green-600 font-bold mt-1">Completed</span>
                      </div>
                    )}
                  </div>
                </button>
              </div>

              {/* Quiz Info */}
              <div className="bg-blue-50 border-l-4 border-islamic-blue p-6 rounded-lg mt-8">
                <h4 className="font-bold text-islamic-blue mb-3">ℹ️ How it Works</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>✓ Each quiz has 10 questions from the selected category</li>
                  <li>✓ Each correct answer earns you 1 point (10 points maximum per quiz)</li>
                  <li>✓ You can take multiple quizzes up to the weekly limit of 250 points</li>
                  <li>✓ Wrong answers show you the correct answer with explanation</li>
                  <li>✓ Each quiz can only be completed ONCE to prevent cheating 🛡️</li>
                  <li>✓ Reach 1000 monthly points to earn a special badge! 🏆</li>
                </ul>
              </div>
            </div>
          </div>
        ) : quizComplete ? (
          <div className="space-y-6">
            {/* Quiz Complete */}
            <div className="bg-gradient-to-r from-green-400 to-islamic-green text-white p-8 rounded-2xl text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-4xl font-bold mb-4">Quiz Complete!</h2>
              <p className="text-xl mb-6">Great job, student!</p>
            </div>

            {/* Score Display */}
            <div className="bg-white border-4 border-islamic-blue p-8 rounded-2xl text-center">
              <p className="text-sm text-gray-600 mb-2">Your Score</p>
              <div className="text-6xl font-bold text-islamic-blue mb-4">{score}</div>
              <p className="text-lg text-gray-600">Points Earned!</p>
            </div>

            {resultToast && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-center text-blue-700 font-semibold">
                {resultToast}
              </div>
            )}

            {/* Results Breakdown */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold text-islamic-dark mb-4">Results:</h3>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <strong>Category:</strong> {category}
                </p>
                <p className="text-gray-700">
                  <strong>Questions:</strong> {answeredCount} / {currentQuestions.length}
                </p>
                <p className="text-gray-700">
                  <strong>Points Earned:</strong> {score} points
                </p>
              </div>
            </div>

            {/* Encouragement */}
            <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-lg">
              <h4 className="font-bold text-purple-700 mb-2">👏 Excellent Work!</h4>
              <p className="text-gray-700 mb-4">
                You've completed the {category} quiz. Your points have been added to your total score!
              </p>
              {score >= 8 && (
                <p className="text-gray-700 font-semibold text-yellow-600">
                  🌟 Great score! Keep learning and earning points towards your 1000 monthly badge!
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button variant="primary" size="lg" className="w-full" onClick={handleResetQuiz}>
                🏠 Back to Home
              </Button>
              <Button variant="secondary" size="lg" className="w-full" onClick={handleResetQuiz}>
                📚 Try Another Quiz
              </Button>
              <Button variant="success" size="lg" className="w-full" onClick={handleResetQuiz}>
                🔁 Play Again
              </Button>
              {practiceMode && (
                <div className="text-center text-sm text-gray-600">
                  You can practice unlimited times; points award once daily.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress */}
            <div className="bg-white p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-islamic-dark">
                  Question {currentQuestionIndex + 1} of {currentQuestions.length}
                </span>
                <span className="font-semibold text-islamic-green">⭐ {score} Points</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-islamic-blue h-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / currentQuestions.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Question */}
            <div className="bg-gradient-to-r from-islamic-blue to-islamic-green text-white p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6">{currentQuestion.question}</h2>
              <p className="text-sm opacity-90">Category: {currentQuestion.category}</p>
            </div>

            {/* Options */}

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !showResult && handleSelectAnswer(index)}
                  disabled={showResult}
                  className={`w-full p-4 text-left text-lg font-semibold rounded-lg border-2 transition ${
                    selectedAnswer === index
                      ? index === currentQuestion.correctAnswer
                        ? 'border-green-500 bg-green-100 text-green-800'
                        : 'border-red-500 bg-red-100 text-red-800'
                      : showResult && index === currentQuestion.correctAnswer
                      ? 'border-green-500 bg-green-100 text-green-800'
                      : 'border-gray-300 hover:border-islamic-blue'
                  } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    {showResult && selectedAnswer === index && index === currentQuestion.correctAnswer && (
                      <CheckCircle className="text-green-600" size={24} />
                    )}
                    {showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                      <XCircle className="text-red-600" size={24} />
                    )}
                    {showResult && index === currentQuestion.correctAnswer && selectedAnswer !== index && (
                      <CheckCircle className="text-green-600" size={24} />
                    )}
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className="bg-blue-50 border-l-4 border-islamic-blue p-6 rounded-lg">
                <h4 className="font-bold text-islamic-blue mb-2">📖 Explanation</h4>
                <p className="text-gray-800">{currentQuestion.explanation}</p>
                {selectedAnswer === currentQuestion.correctAnswer && (
                  <p className="mt-3 text-green-700 font-semibold">✓ Correct!</p>
                )}
                {selectedAnswer !== currentQuestion.correctAnswer && (
                  <p className="mt-3 text-red-700 font-semibold">
                    The correct answer is: <strong>{currentQuestion.options[currentQuestion.correctAnswer]}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Next Button */}
            {showResult && (
              <Button
                onClick={handleNext}
                variant="success"
                size="lg"
                className="w-full"
              >
                {currentQuestionIndex < currentQuestions.length - 1
                  ? '➡️ Next Question'
                  : '✓ Finish Quiz'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
