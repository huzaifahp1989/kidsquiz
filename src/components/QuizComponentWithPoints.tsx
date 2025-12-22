/**
 * Example: Quiz Component with Points Integration
 * Shows how to integrate the points system into a quiz component
 */

'use client'

import { useState, useEffect } from 'react'
import { awardPoints, checkDailyAllowance, getUserPoints } from '@/lib/points-service'

export function QuizComponent({ quizId, questions }: any) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [pointsAwarded, setPointsAwarded] = useState<any>(null)
  const [allowance, setAllowance] = useState<any>(null)
  const [userPoints, setUserPoints] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load user's current points on mount
  useEffect(() => {
    async function loadUserData() {
      const points = await getUserPoints()
      setUserPoints(points)

      const allowanceData = await checkDailyAllowance()
      setAllowance(allowanceData)
    }
    loadUserData()
  }, [])

  // Handle answer selection
  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(score + 1)
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Quiz is complete
      setIsComplete(true)
      handleQuizComplete()
    }
  }

  // Handle quiz completion - award points
  const handleQuizComplete = async () => {
    setLoading(true)
    setError(null)

    try {
      // Calculate points based on score
      // Example: 80% score = 20 points, 60% score = 10 points
      const percentage = (score / questions.length) * 100
      const pointsToAward =
        percentage >= 80
          ? 20
          : percentage >= 70
            ? 15
            : percentage >= 60
              ? 10
              : 5

      // Call the award_points function
      const result = await awardPoints(pointsToAward)

      if (result.success) {
        setPointsAwarded(result)
        // Refresh user points
        const updatedPoints = await getUserPoints()
        setUserPoints(updatedPoints)
      } else {
        // Daily limit or other error
        setError(result.message)
        setPointsAwarded(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to award points')
    } finally {
      setLoading(false)
    }
  }

  // Show quiz in progress
  if (!isComplete) {
    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <h2>{questions[currentQuestion]?.question}</h2>
          <p className="progress">
            Question {currentQuestion + 1} of {questions.length}
          </p>
          {allowance && (
            <p className="daily-limit">
              Daily Allowance: {allowance.today_points}/100 (+{allowance.remaining} remaining)
            </p>
          )}
        </div>

        <div className="answers">
          {questions[currentQuestion]?.answers.map((answer: any, idx: number) => (
            <button
              key={idx}
              onClick={() => handleAnswer(answer.isCorrect)}
              className="answer-btn"
            >
              {answer.text}
            </button>
          ))}
        </div>

        <div className="quiz-progress">
          <div
            className="progress-bar"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>
    )
  }

  // Show results screen
  return (
    <div className="quiz-results">
      <h2>Quiz Complete! 🎉</h2>

      <div className="score-section">
        <p className="final-score">
          Score: {score}/{questions.length} ({Math.round((score / questions.length) * 100)}%)
        </p>
      </div>

      {loading && (
        <div className="loading">
          <p>Awarding points...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      {pointsAwarded && !loading && (
        <div className={pointsAwarded.success ? 'success-message' : 'warning-message'}>
          {pointsAwarded.success ? (
            <>
              <h3>✨ Points Awarded! ✨</h3>
              <p className="points-earned">+{pointsAwarded.points_awarded} points</p>
              <div className="points-breakdown">
                <div>
                  <p className="label">Total Points</p>
                  <p className="value">{pointsAwarded.total_points}</p>
                </div>
                <div>
                  <p className="label">Today</p>
                  <p className="value">{pointsAwarded.today_points}/100</p>
                </div>
                <div>
                  <p className="label">Weekly</p>
                  <p className="value">{pointsAwarded.weekly_points}</p>
                </div>
                <div>
                  <p className="label">Monthly</p>
                  <p className="value">{pointsAwarded.monthly_points}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <h3>Daily Limit Reached</h3>
              <p>{pointsAwarded.message}</p>
              <p className="daily-status">You've earned {pointsAwarded.today_points} points today</p>
              <p className="comeback">Come back tomorrow to earn more!</p>
            </>
          )}
        </div>
      )}

      {userPoints && (
        <div className="user-stats">
          <h3>Your Stats</h3>
          <div className="stats-grid">
            <div className="stat">
              <p className="stat-label">Total Points</p>
              <p className="stat-value">{userPoints.total_points}</p>
            </div>
            <div className="stat">
              <p className="stat-label">Weekly Points</p>
              <p className="stat-value">{userPoints.weekly_points}</p>
            </div>
            <div className="stat">
              <p className="stat-label">Monthly Points</p>
              <p className="stat-value">{userPoints.monthly_points}</p>
            </div>
            <div className="stat">
              <p className="stat-label">Today's Earning</p>
              <p className="stat-value">{userPoints.today_points}/100</p>
            </div>
          </div>
        </div>
      )}

      <div className="action-buttons">
        <button onClick={() => window.location.href = '/quiz'} className="btn-primary">
          Take Another Quiz
        </button>
        <button onClick={() => window.location.href = '/profile'} className="btn-secondary">
          View Profile
        </button>
      </div>

      <style jsx>{`
        .quiz-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .quiz-header {
          margin-bottom: 2rem;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 1rem;
        }

        .quiz-header h2 {
          font-size: 1.5rem;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .progress {
          color: #666;
          font-size: 0.9rem;
        }

        .daily-limit {
          color: #ff9800;
          font-weight: 500;
          margin-top: 0.5rem;
          font-size: 0.9rem;
        }

        .answers {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .answer-btn {
          padding: 1rem;
          border: 2px solid #ddd;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s;
        }

        .answer-btn:hover {
          border-color: #4caf50;
          background: #f0f8f0;
        }

        .quiz-progress {
          width: 100%;
          height: 4px;
          background: #e0e0e0;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #4caf50, #45a049);
          transition: width 0.3s;
        }

        /* Results Page Styles */
        .quiz-results {
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .quiz-results h2 {
          text-align: center;
          color: #4caf50;
          font-size: 2rem;
          margin-bottom: 1.5rem;
        }

        .score-section {
          text-align: center;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .final-score {
          font-size: 1.3rem;
          color: #333;
          margin: 0;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: #ff9800;
        }

        .error-message {
          background: #ffebee;
          border-left: 4px solid #f44336;
          padding: 1rem;
          border-radius: 4px;
          margin: 1rem 0;
        }

        .error-message p {
          color: #c62828;
          margin: 0;
        }

        .success-message {
          background: linear-gradient(135deg, #4caf50, #45a049);
          color: white;
          padding: 2rem;
          border-radius: 12px;
          margin: 1.5rem 0;
          text-align: center;
        }

        .success-message h3 {
          font-size: 1.5rem;
          margin: 0 0 1rem 0;
        }

        .points-earned {
          font-size: 2rem;
          font-weight: bold;
          margin: 0.5rem 0;
        }

        .points-breakdown {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-top: 1rem;
        }

        .points-breakdown > div {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.5rem;
          border-radius: 6px;
        }

        .points-breakdown .label {
          font-size: 0.8rem;
          margin: 0;
          opacity: 0.9;
        }

        .points-breakdown .value {
          font-size: 1.2rem;
          font-weight: bold;
          margin: 0.25rem 0 0 0;
        }

        .warning-message {
          background: #fff3cd;
          border-left: 4px solid #ff9800;
          padding: 1.5rem;
          border-radius: 8px;
          margin: 1.5rem 0;
          text-align: center;
        }

        .warning-message h3 {
          color: #ff9800;
          margin: 0 0 0.5rem 0;
        }

        .daily-status {
          color: #333;
          margin: 0.5rem 0;
          font-weight: 500;
        }

        .comeback {
          color: #666;
          margin: 0.5rem 0 0 0;
          font-size: 0.9rem;
        }

        .user-stats {
          background: #f5f5f5;
          padding: 1.5rem;
          border-radius: 8px;
          margin: 1.5rem 0;
        }

        .user-stats h3 {
          margin: 0 0 1rem 0;
          color: #333;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .stat {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          text-align: center;
          border-top: 3px solid #4caf50;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #999;
          margin: 0 0 0.5rem 0;
          text-transform: uppercase;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #4caf50;
          margin: 0;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
          justify-content: center;
        }

        .btn-primary,
        .btn-secondary {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: #4caf50;
          color: white;
        }

        .btn-primary:hover {
          background: #45a049;
        }

        .btn-secondary {
          background: #e0e0e0;
          color: #333;
        }

        .btn-secondary:hover {
          background: #d0d0d0;
        }

        @media (max-width: 600px) {
          .answers {
            grid-template-columns: 1fr;
          }

          .points-breakdown,
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Usage in your page:
 * 
 * import { QuizComponent } from '@/components/QuizComponent'
 * 
 * export default function QuizPage() {
 *   const questions = [
 *     {
 *       question: "What is the first pillar of Islam?",
 *       answers: [
 *         { text: "Shahada", isCorrect: true },
 *         { text: "Salah", isCorrect: false },
 *         { text: "Zakat", isCorrect: false },
 *         { text: "Hajj", isCorrect: false }
 *       ]
 *     },
 *     // More questions...
 *   ]
 * 
 *   return <QuizComponent quizId="quiz-1" questions={questions} />
 * }
 */
