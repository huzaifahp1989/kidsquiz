'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

type Entry = { uid: string; name: string; level: string; points: number; weeklyPoints?: number; monthlyPoints?: number };

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { profile } = useAuth();

  const loadLeaderboard = useCallback(async () => {
    const orderField = activeTab === 'weekly' ? 'weeklypoints' : 'monthlypoints';
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order(orderField, { ascending: false, nullsFirst: false })
      .limit(50);
    if (!error && data) {
      const list: Entry[] = data.map((row: any) => ({
        uid: row.uid,
        name: row.name ?? 'Learner',
        level: row.level ?? 'Beginner',
        points: row.points ?? 0,
        weeklyPoints: row.weeklypoints ?? row.points ?? 0,
        monthlyPoints: row.monthlypoints ?? row.points ?? 0,
      }));
      setEntries(list);
    }
  }, [activeTab]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLeaderboard();
  }, [loadLeaderboard]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const leaderboardData = useMemo(() => {
    const field = activeTab === 'weekly' ? 'weeklyPoints' : 'monthlyPoints';
    return [...entries].sort((a, b) => (b[field] ?? 0) - (a[field] ?? 0)).map((e, idx) => ({
      rank: idx + 1,
      username: e.name,
      level: e.level,
      points: activeTab === 'weekly' ? (e.weeklyPoints ?? 0) : (e.monthlyPoints ?? 0),
      uid: e.uid,
    }));
  }, [entries, activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-islamic-dark mb-2">🌟 Leaderboard</h1>
          <p className="text-gray-700">See who is leading this week and month.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 justify-center flex-wrap">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-6 py-3 rounded-lg font-bold text-lg transition ${
              activeTab === 'weekly'
                ? 'bg-islamic-blue text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📊 Weekly
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-6 py-3 rounded-lg font-bold text-lg transition ${
              activeTab === 'monthly'
                ? 'bg-islamic-blue text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📅 Monthly
          </button>
          <button
            onClick={handleRefresh}
            className={`px-6 py-3 rounded-lg font-bold text-lg transition ${
              refreshing
                ? 'bg-gray-400 text-white'
                : 'bg-green-200 text-green-700 hover:bg-green-300'
            }`}
            disabled={refreshing}
          >
            {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Leaderboard Content */}
        {(activeTab === 'weekly' || activeTab === 'monthly') && (
          <div className="space-y-4">
            {/* Top 3 Special Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {leaderboardData.slice(0, 3).map(entry => (
                <div
                  key={entry.rank}
                  className={`p-6 rounded-2xl text-center text-white ${
                    entry.rank === 1
                      ? 'bg-gradient-to-b from-yellow-400 to-yellow-600 transform scale-105 shadow-2xl'
                      : entry.rank === 2
                      ? 'bg-gradient-to-b from-gray-400 to-gray-600'
                      : 'bg-gradient-to-b from-orange-400 to-orange-600'
                  }`}
                >
                  <div className="text-6xl mb-3">
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                  </div>
                  <p className="text-3xl font-bold mb-2">#{entry.rank}</p>
                  <p className="text-2xl font-bold mb-1">{entry.username}</p>
                  <p className="text-sm opacity-90 mb-2">{entry.level}</p>
                  <p className="text-2xl font-bold">⭐ {entry.points}</p>
                </div>
              ))}
            </div>

            {/* Full Leaderboard */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-islamic-blue to-islamic-green text-white">
                <h2 className="text-2xl font-bold">
                  {activeTab === 'weekly' ? 'Weekly Leaderboard' : 'Monthly Leaderboard'}
                </h2>
                <p className="text-sm opacity-90 mt-1">
                  {activeTab === 'weekly'
                    ? 'Resets every Sunday'
                    : 'Resets every first day of the month'}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-6 py-4 text-left font-bold text-islamic-dark">Rank</th>
                      <th className="px-6 py-4 text-left font-bold text-islamic-dark">Username</th>
                      <th className="px-6 py-4 text-left font-bold text-islamic-dark">Points</th>
                      <th className="px-6 py-4 text-left font-bold text-islamic-dark">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((entry, index) => (
                      <tr
                        key={entry.rank}
                        className={`border-b ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } hover:bg-blue-50 transition`}
                      >
                        <td className="px-6 py-4">
                          <span className="text-2xl font-bold text-islamic-blue">
                            #{entry.rank}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">🌍</span>
                            <span className="font-bold text-islamic-dark">{entry.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xl font-bold text-islamic-green">
                            ⭐ {entry.points}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full font-semibold text-white text-sm ${
                            entry.level === 'Young Scholar'
                              ? 'bg-purple-500'
                              : entry.level === 'Explorer'
                              ? 'bg-blue-500'
                              : entry.level === 'Learner'
                              ? 'bg-green-500'
                              : 'bg-gray-500'
                          }`}>
                            {entry.level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Your Ranking */}
            <div className="bg-gradient-to-r from-islamic-blue to-islamic-green text-white p-6 rounded-2xl">
              <h3 className="text-xl font-bold mb-3">👤 Your Ranking</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-2 rounded-lg bg-white/10 sm:bg-transparent">
                  <p className="text-sm opacity-90 mb-1">Your Rank</p>
                  <p className="text-4xl font-bold">{
                    (() => {
                      const idx = leaderboardData.findIndex(e => e.username === (profile?.name || ''));
                      return idx >= 0 ? `#${idx + 1}` : '—';
                    })()
                  }</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/10 sm:bg-transparent">
                  <p className="text-sm opacity-90 mb-1">Your Points</p>
                  <p className="text-4xl font-bold">{
                    activeTab === 'weekly' ? (profile?.weeklyPoints ?? profile?.points ?? 0) : (profile?.monthlyPoints ?? profile?.points ?? 0)
                  }</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/10 sm:bg-transparent">
                  <p className="text-sm opacity-90 mb-1">Your Level</p>
                  <p className="text-2xl font-bold mt-1">{profile?.level ?? 'Beginner'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-lg mt-8">
          <h4 className="font-bold text-purple-700 mb-3">💡 Leaderboard Tips</h4>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li>✓ The leaderboard resets weekly and monthly to give everyone a fair chance</li>
            <li>✓ Earn points by playing games, taking quizzes, and reading content</li>
            <li>✓ Reach new levels to show your progress on the leaderboard</li>
            <li>✓ Be kind and respectful - we celebrate learning, not competition</li>
            <li>✓ Every learner has value, regardless of ranking!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
