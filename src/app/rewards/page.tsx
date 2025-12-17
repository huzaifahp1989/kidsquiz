'use client';

import React from 'react';

const rewards = [
  {
    name: 'Star Starter',
    icon: '⭐',
    requirement: '100 Points',
    description: 'Earn your first 100 points',
    achieved: true,
    earnedDate: '2025-01-15',
  },
  {
    name: 'Quiz Master',
    icon: '🎯',
    requirement: 'Complete 10 Quizzes',
    description: 'You\'re getting really good at this!',
    achieved: true,
    earnedDate: '2025-01-20',
  },
  {
    name: 'Quran Lover',
    icon: '📖',
    requirement: 'Read 5 Surahs',
    description: 'Discover the beauty of the Quran',
    achieved: false,
    progress: 3,
    total: 5,
  },
  {
    name: 'Hadith Scholar',
    icon: '📜',
    requirement: 'Read 10 Hadiths',
    description: 'Learn from the Prophet\'s teachings',
    achieved: false,
    progress: 6,
    total: 10,
  },
  {
    name: 'Fire Streak',
    icon: '🔥',
    requirement: '7-Day Streak',
    description: 'Learn something new every day!',
    achieved: false,
    progress: 4,
    total: 7,
  },
  {
    name: 'Game Champion',
    icon: '🏆',
    requirement: 'Score 500 Points in Games',
    description: 'Master all the games!',
    achieved: false,
    progress: 350,
    total: 500,
  },
  {
    name: 'Speed Learner',
    icon: '⚡',
    requirement: 'Complete Learning in 7 Days',
    description: 'Learn quickly and efficiently',
    achieved: false,
    progress: 5,
    total: 7,
  },
  {
    name: 'Knowledge Seeker',
    icon: '🧠',
    requirement: 'Earn 500 Points Total',
    description: 'You\'re becoming a true scholar!',
    achieved: false,
    progress: 250,
    total: 500,
  },
];

export default function RewardsPage() {
  const achievedCount = rewards.filter(r => r.achieved).length;
  const totalRewards = rewards.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-islamic-light to-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-islamic-dark mb-2 islamic-shadow">
            ⭐ Rewards & Badges
          </h1>
          <p className="text-lg text-gray-600">
            Unlock special achievements as you learn!
          </p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-6 rounded-2xl">
            <p className="text-sm opacity-90 mb-2">Badges Earned</p>
            <p className="text-5xl font-bold">{achievedCount}</p>
            <p className="text-sm mt-2 opacity-90">out of {totalRewards}</p>
          </div>

          <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-6 rounded-2xl">
            <p className="text-sm opacity-90 mb-2">Total Points</p>
            <p className="text-5xl font-bold">250</p>
            <p className="text-sm mt-2 opacity-90">Keep learning!</p>
          </div>

          <div className="bg-gradient-to-r from-purple-400 to-purple-600 text-white p-6 rounded-2xl">
            <p className="text-sm opacity-90 mb-2">Current Level</p>
            <p className="text-5xl font-bold">Learner</p>
            <p className="text-sm mt-2 opacity-90">🎯 Next: Explorer</p>
          </div>
        </div>

        {/* Level Progression */}
        <div className="bg-white border-4 border-islamic-blue p-8 rounded-2xl mb-8">
          <h2 className="text-2xl font-bold text-islamic-dark mb-6">📊 Level Progression</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">Beginner</span>
                <span className="text-sm text-gray-600">0 - 100 pts</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                <div className="bg-green-500 h-full" style={{ width: '100%' }}></div>
              </div>
              <p className="text-xs text-green-700 mt-1">✓ Completed</p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">Learner</span>
                <span className="text-sm text-gray-600">100 - 250 pts</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                <div className="bg-islamic-blue h-full" style={{ width: '60%' }}></div>
              </div>
              <p className="text-xs text-islamic-blue mt-1">🎯 Current Level - 150/150 more points to reach Explorer</p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">Explorer</span>
                <span className="text-sm text-gray-600">250 - 400 pts</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                <div className="bg-gray-400 h-full" style={{ width: '0%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">Young Scholar</span>
                <span className="text-sm text-gray-600">400+ pts</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                <div className="bg-gray-400 h-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        <h2 className="text-2xl font-bold text-islamic-dark mb-6">🎖️ Badges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {rewards.map((reward, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl text-center border-4 transition ${
                reward.achieved
                  ? 'bg-yellow-50 border-yellow-400 shadow-lg'
                  : 'bg-gray-50 border-gray-300 opacity-75'
              }`}
            >
              <div className={`text-6xl mb-3 ${reward.achieved ? '' : 'opacity-50'}`}>
                {reward.icon}
              </div>
              <h3 className="font-bold text-lg text-islamic-dark mb-1">{reward.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{reward.requirement}</p>
              <p className="text-xs text-gray-700 mb-3">{reward.description}</p>

              {reward.achieved ? (
                <div className="bg-green-200 text-green-800 px-3 py-2 rounded-lg text-xs font-bold">
                  ✓ Earned on {reward.earnedDate}
                </div>
              ) : (
                <div>
                  <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className="bg-islamic-blue h-full transition-all"
                      style={{
                        width: `${reward.progress && reward.total ? (reward.progress / reward.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600">
                    {reward.progress ?? 0}/{reward.total ?? 0}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Achievement Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-yellow-50 border-l-4 border-islamic-gold p-6 rounded-lg">
            <h3 className="font-bold text-yellow-700 mb-3 text-lg">🎯 How to Earn Badges</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✓ Play games every day</li>
              <li>✓ Complete daily quizzes</li>
              <li>✓ Read Quranic Surahs</li>
              <li>✓ Study authentic Hadiths</li>
              <li>✓ Maintain a learning streak</li>
              <li>✓ Earn points to reach new levels</li>
            </ul>
          </div>

          <div className="bg-blue-50 border-l-4 border-islamic-blue p-6 rounded-lg">
            <h3 className="font-bold text-islamic-blue mb-3 text-lg">💡 Remember</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>🌟 Every badge represents your growth</li>
              <li>🌟 Learning is a lifelong journey</li>
              <li>🌟 Celebrate small victories</li>
              <li>🌟 Help friends achieve their goals too</li>
              <li>🌟 Badges are digital, no prizes involved</li>
              <li>🌟 Focus on learning, not just points!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
