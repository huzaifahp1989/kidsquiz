'use client';

import React, { useState, useEffect } from 'react';
import { quizzes } from '@/data/quizzes';
import { Button, Modal } from '@/components';
import { CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { calculateLevel } from '@/lib/utils';

export default function QuizPage() {
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Hijrah'>('Easy');
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
  const { user, refreshProfile } = useAuth();

  const isHijrah = difficulty === 'Hijrah';
  const filteredQuestions = quizzes.filter(q =>
    isHijrah ? q.difficulty === 'Hijrah' : q.difficulty === difficulty
  );
  const currentQuestions = isHijrah ? filteredQuestions : filteredQuestions.slice(0, 5);
  const currentQuestion = currentQuestions[currentQuestionIndex];

  const handleSelectAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    setShowExplanation(true);

    if (answerIndex === currentQuestion.correctAnswer) {
      setScore(score + currentQuestion.points);
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

  const handleStartQuiz = (level: 'Easy' | 'Medium' | 'Hard' | 'Hijrah') => {
    setDifficulty(level);
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

  // Award points to the signed-in user when the quiz finishes
  useEffect(() => {
    if (!quizComplete || !user?.id || score <= 0 || hasAwarded) {
      console.log('[quiz] Skip award:', { quizComplete, userId: user?.id, score, hasAwarded });
      return;
    }

    let cancelled = false;
    (async () => {
      console.log('[quiz] Awarding points for user:', user.id, 'score:', score);
      
      const { data: row, error: readErr } = await supabase
        .from('users')
        .select('points,weeklypoints,monthlypoints')
        .eq('uid', user.id)
        .maybeSingle();

      if (readErr || !row) {
        console.error('[quiz] read failed:', readErr);
      }

      console.log('[quiz] Current row:', row);

      if (cancelled) return;

      const nextTotal = (row?.points || 0) + score;

      const { error } = await supabase
        .from('users')
        .update({
          points: nextTotal,
          weeklypoints: (row?.weeklypoints || 0) + score,
          monthlypoints: (row?.monthlypoints || 0) + score,
          level: calculateLevel(nextTotal),
        })
        .eq('uid', user.id);

      console.log('[quiz] Update result:', { error, nextTotal });

      if (!cancelled) {
        setHasAwarded(true);
        if (!error) {
          setResultToast(`⭐ +${score} points!`);
          // Refresh profile to show updated points
          await refreshProfile();
        } else {
          console.error('[quiz] update failed:', error);
          setResultToast('⚠️ Sync failed');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [quizComplete, user?.id, score, hasAwarded, refreshProfile]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-islamic-light to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-islamic-dark mb-2 islamic-shadow">
            📝 Daily Quiz
          </h1>
          <p className="text-lg text-gray-600">
            Test your Islamic knowledge and earn points!
          </p>
        </div>

        {!quizStarted ? (
          <div>
            {/* Difficulty Selection */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-islamic-dark text-center mb-6">
                Choose Your Quiz
              </h2>

              <div className="grid gap-4">
                {/* Easy */}
                <button
                  onClick={() => handleStartQuiz('Easy')}
                  className="p-6 border-4 border-green-300 rounded-xl hover:shadow-lg transition bg-green-50"
                >
                  <div className="text-4xl mb-2">😊</div>
                  <h3 className="text-2xl font-bold text-green-700 mb-2">Easy</h3>
                  <p className="text-gray-700 mb-2">For ages 5-7 years old</p>
                  <p className="text-sm text-gray-600">10 points per correct answer</p>
                </button>

                {/* Medium */}
                <button
                  onClick={() => handleStartQuiz('Medium')}
                  className="p-6 border-4 border-yellow-300 rounded-xl hover:shadow-lg transition bg-yellow-50"
                >
                  <div className="text-4xl mb-2">🙂</div>
                  <h3 className="text-2xl font-bold text-yellow-700 mb-2">Medium</h3>
                  <p className="text-gray-700 mb-2">For ages 8-10 years old</p>
                  <p className="text-sm text-gray-600">15 points per correct answer</p>
                </button>

                {/* Hard */}
                <button
                  onClick={() => handleStartQuiz('Hard')}
                  className="p-6 border-4 border-purple-300 rounded-xl hover:shadow-lg transition bg-purple-50"
                >
                  <div className="text-4xl mb-2">🤓</div>
                  <h3 className="text-2xl font-bold text-purple-700 mb-2">Hard</h3>
                  <p className="text-gray-700 mb-2">For ages 11-14 years old</p>
                  <p className="text-sm text-gray-600">20 points per correct answer</p>
                </button>

                {/* Hijrah Special */}
                <button
                  onClick={() => handleStartQuiz('Hijrah')}
                  className="p-6 border-4 border-blue-300 rounded-xl hover:shadow-lg transition bg-blue-50"
                >
                  <div className="text-4xl mb-2">🕌</div>
                  <h3 className="text-2xl font-bold text-blue-700 mb-2">Hijrah</h3>
                  <p className="text-gray-700 mb-2">10 questions on the Hijrah journey</p>
                  <p className="text-sm text-gray-600">20 points per correct answer</p>
                </button>
              </div>

              {/* Quiz Info */}
              <div className="bg-blue-50 border-l-4 border-islamic-blue p-6 rounded-lg mt-8">
                <h4 className="font-bold text-islamic-blue mb-3">ℹ️ How it Works</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>✓ Complete all questions in your chosen quiz (5 for standard levels, 10 for Hijrah)</li>
                  <li>✓ Each correct answer earns you points based on the quiz type</li>
                  <li>✓ You can take one quiz per day</li>
                  <li>✓ Bonus points for completing the daily quiz!</li>
                  <li>✓ Wrong answers show you the correct answer with explanation</li>
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
                  <strong>Quiz:</strong> {difficulty}
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
                You've completed the quiz. Your points have been added to your total score!
              </p>
              {score > 40 && (
                <p className="text-gray-700 font-semibold text-yellow-600">
                  🌟 You earned a BONUS! Come back tomorrow for the daily quiz!
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
