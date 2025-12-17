'use client';

import React from 'react';
import { NavCard, StatsCard } from '@/components';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { profile, loading } = useAuth();
  const user = {
    username: profile?.name || 'Friend',
    points: profile?.points ?? 0,
    level: profile?.level || 'Beginner',
    streak: 0,
    totalDaysLearned: 0,
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'text-gray-600';
      case 'Learner': return 'text-green-600';
      case 'Explorer': return 'text-blue-600';
      case 'Young Scholar': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-islamic-light to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-islamic-light to-white">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-islamic-blue to-islamic-green text-white py-8 px-4 text-center">
        <h2 className="text-4xl font-bold mb-3 islamic-shadow">
          Assalamu Alaikum, {loading ? '...' : user.username}! 👋
        </h2>
        <p className="text-xl mb-2">Let's learn Islam in a fun way!</p>
        <p className="text-sm opacity-90">
          You're doing amazing! Keep up the great work. 🌟
        </p>
      </div>

      {/* Stats Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard label="Total Points" value={user.points} icon="⭐" color="blue" />
          <StatsCard
            label="Level"
            value={user.level}
            icon="🏆"
            color="green"
          />
          <StatsCard
            label="Current Streak"
            value={`${user.streak} days`}
            icon="🔥"
            color="yellow"
          />
          <StatsCard
            label="Days Learning"
            value={user.totalDaysLearned}
            icon="📅"
            color="purple"
          />
        </div>

        {/* Level Progress */}
        <div className="mb-8 bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-islamic-dark">Your Level Progress</h3>
          <div className="mb-2 flex justify-between text-sm">
            <span>Progress to Young Scholar</span>
            <span className="font-bold">{user.points} / 500 points</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-islamic-green to-islamic-blue h-full transition-all duration-500"
              style={{ width: `${(user.points / 500) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Main Navigation Cards */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-islamic-dark mb-6 text-center">
            What would you like to do today?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <NavCard
              href="/games"
              icon="🎮"
              title="Islamic Games"
              description="Play fun matching, memory, and quiz games to earn points!"
              color="blue"
            />
            <NavCard
              href="/quiz"
              icon="📝"
              title="Daily Quiz"
              description="Answer 5 questions daily and test your Islamic knowledge!"
              color="green"
            />
            <NavCard
              href="/quran"
              icon="📖"
              title="Learn Quran"
              description="Read Quranic Surahs with meanings and beautiful facts!"
              color="purple"
            />
            <NavCard
              href="/hadith"
              icon="📜"
              title="Learn Hadith"
              description="Discover authentic Hadith with practical examples!"
              color="pink"
            />
            <NavCard
              href="/rewards"
              icon="⭐"
              title="Rewards & Badges"
              description="Unlock badges and watch your progress grow!"
              color="orange"
            />
            <NavCard
              href="/leaderboard"
              icon="🏆"
              title="Leaderboard"
              description="See how you rank with friends! (Top performers this week)"
              color="yellow"
            />
          </div>
        </div>

        {/* Daily Streak Message */}
        {user.streak >= 3 && (
          <div className="bg-gradient-to-r from-orange-100 to-yellow-100 border-l-4 border-orange-500 p-6 rounded-lg mb-8">
            <h4 className="text-lg font-bold text-orange-700 mb-2">🔥 Great Streak!</h4>
            <p className="text-orange-600">
              You've been learning for {user.streak} days in a row! Keep this amazing momentum going!
            </p>
          </div>
        )}

        {/* Tips Section */}
        <div className="bg-blue-50 border-l-4 border-islamic-blue p-6 rounded-lg">
          <h4 className="text-lg font-bold text-islamic-blue mb-3">💡 Daily Tips</h4>
          <ul className="space-y-2 text-sm">
            <li>✓ Come back daily to keep your learning streak alive!</li>
            <li>✓ Read at least one Surah from the Quran section</li>
            <li>✓ Play games to practice what you learned</li>
            <li>✓ Answer the daily quiz to earn bonus points</li>
            <li>✓ Share your progress with family and friends!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
