'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { NavCard, StatsCard } from '@/components';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { profile, loading } = useAuth();
  const user = useMemo(() => {
    const extras = (profile as unknown as { streak?: number; total_days?: number; totalDays?: number }) || {};
    return {
      username: profile?.name || 'Friend',
      points: profile?.points ?? 0,
      level: profile?.level || 'Beginner',
      streak: extras.streak ?? 0,
      totalDaysLearned: extras.total_days ?? extras.totalDays ?? 0,
    };
  }, [profile]);

  const progressPercent = useMemo(() => {
    const pct = (user.points / 500) * 100;
    return Math.max(2, Math.min(100, pct));
  }, [user.points]);

  const questCards = [
    {
      title: 'Play & Earn',
      desc: 'Finish one game and collect a badge.',
      href: '/games',
      icon: '🎮',
      accent: 'from-blue-50 to-blue-100 border-blue-200',
    },
    {
      title: 'Quiz of the Day',
      desc: 'Answer 5 questions to keep your streak.',
      href: '/quiz',
      icon: '🧠',
      accent: 'from-sky-50 to-sky-100 border-sky-200',
    },
    {
      title: 'New Surah Fact',
      desc: 'Learn a quick fact from the Qur’an section.',
      href: '/quran',
      icon: '📖',
      accent: 'from-amber-50 to-amber-100 border-amber-200',
    },
  ];

  const learningTracks = [
    {
      title: 'Qur’an Journey',
      desc: 'Short surahs, meanings, and gentle stories.',
      href: '/quran',
      icon: '🌙',
      tone: 'from-cyan-50 to-sky-100 border-sky-200',
      tag: 'Great for ages 6-10',
    },
    {
      title: 'Hadith in Action',
      desc: 'See how Sunnah guides real-life moments.',
      href: '/hadith',
      icon: '🧭',
      tone: 'from-sky-50 to-sky-100 border-sky-200',
      tag: 'Try 1 scenario today',
    },
    {
      title: 'Games Arcade',
      desc: 'Word hunts, decision quests, and timelines.',
      href: '/games',
      icon: '⚡',
      tone: 'from-indigo-50 to-indigo-100 border-indigo-200',
      tag: 'Earn bonus points',
    },
    {
      title: 'Rewards & Badges',
      desc: 'See what you unlocked and what is next.',
      href: '/rewards',
      icon: '🏅',
      tone: 'from-rose-50 to-rose-100 border-rose-200',
      tag: 'Claim your prize',
    },
    {
      title: 'Multiplayer Arena',
      desc: 'Challenge friends in real-time quizzes.',
      href: '/multiplayer',
      icon: '🏰',
      tone: 'from-purple-50 to-purple-100 border-purple-200',
      tag: 'New!',
    },
  ];

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
    <div className="min-h-screen bg-gradient-to-b from-[#e8f3ff] via-white to-[#f0f9ff]">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-islamic-blue to-islamic-green text-white shadow-xl">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute right-6 top-6 text-5xl opacity-70">⭐</div>
          <div className="relative flex flex-col md:flex-row items-center md:items-end justify-between gap-6 px-6 py-8 md:px-8 md:py-10">
            <div>
              <p className="text-sm uppercase tracking-wide text-white/80">As-salamu alaykum</p>
              <h1 className="text-3xl md:text-4xl font-bold islamic-shadow">{user.username}, ready to learn?</h1>
              <p className="text-white/90 mt-2 max-w-xl">Pick a quest, play a game, and climb to Young Scholar. Short, joyful, and parent-approved.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/quiz" className="bg-white text-islamic-blue font-semibold px-4 py-2 rounded-xl shadow-sm hover:bg-white/90 transition">Take today&apos;s quiz</Link>
                <Link href="/games" className="bg-white/10 border border-white/30 text-white font-semibold px-4 py-2 rounded-xl hover:bg-white/20 transition">Jump into games</Link>
              </div>
            </div>
            <div className="bg-white/15 rounded-2xl px-5 py-4 text-sm text-white/90 backdrop-blur">
              <p className="font-semibold mb-1">Current level</p>
              <p className="text-2xl font-bold">{user.level}</p>
              <p className="text-white/80">{user.points} pts • {user.streak || 'No'} day streak</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard label="Total Points" value={user.points} icon="⭐" color="blue" />
          <StatsCard label="Level" value={user.level} icon="🏆" color="green" />
          <StatsCard label="Current Streak" value={`${user.streak || 0} days`} icon="🔥" color="yellow" />
          <StatsCard label="Days Learning" value={user.totalDaysLearned || 0} icon="📅" color="purple" />
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
          <div className="flex items-center justify-between mb-3 text-sm text-slate-700">
            <span>Path to Young Scholar</span>
            <span className="font-semibold">{user.points} / 500 pts</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-islamic-green to-islamic-blue h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">Earn points by finishing a game, a quiz, and one learning track each day.</p>
        </div>

        {/* Today’s quests */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            <h3 className="text-2xl font-bold text-islamic-dark">Today&apos;s kid-friendly quests</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {questCards.map(card => (
              <Link
                key={card.title}
                href={card.href}
                className={`group relative overflow-hidden rounded-2xl border ${card.accent} p-5 shadow-sm hover:shadow-xl transition`}
              >
                <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/40 blur-2xl" />
                <div className="text-4xl mb-3">{card.icon}</div>
                <p className="text-lg font-semibold text-islamic-dark">{card.title}</p>
                <p className="text-sm text-slate-600 mt-1">{card.desc}</p>
                <div className="mt-3 text-sm font-semibold text-islamic-blue group-hover:translate-x-1 transition">Start now →</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Learning tracks */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛤️</span>
            <h3 className="text-2xl font-bold text-islamic-dark">Pick a learning track</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {learningTracks.map(track => (
              <Link
                key={track.title}
                href={track.href}
                className={`group relative overflow-hidden rounded-2xl border ${track.tone} p-6 shadow-sm hover:shadow-xl transition`}
              >
                <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-white/30 blur-3xl" />
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{track.icon}</div>
                  <div className="space-y-2">
                    <p className="text-xl font-semibold text-islamic-dark">{track.title}</p>
                    <p className="text-sm text-slate-600">{track.desc}</p>
                    <span className="inline-flex items-center gap-2 bg-white/70 text-xs font-semibold text-slate-700 px-3 py-1 rounded-full group-hover:bg-white">
                      {track.tag}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Spotlight games */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <h3 className="text-2xl font-bold text-islamic-dark">Mini-games spotlight</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <NavCard
              href="/games"
              icon="🧩"
              title="Word & Story Hunts"
              description="Find words in Seerah and Qur’an grids, then answer follow-ups."
              color="blue"
            />
            <NavCard
              href="/games"
              icon="🛡️"
              title="Decisions & Scenarios"
              description="Pick what a Sahabi would do or solve wudu fixes to earn bonus points."
              color="green"
            />

          </div>
        </section>

        {/* Family callout */}
        <div className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-100 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-orange-700">Family Challenge</p>
            <h4 className="text-xl font-bold text-islamic-dark mt-1">Learn together for 15 minutes tonight.</h4>
            <p className="text-sm text-slate-700 mt-1">Pick any track, then let a parent ask you one question from the quiz. Share what you loved most.</p>
          </div>
          <Link href="/leaderboard" className="bg-white text-orange-700 font-semibold px-4 py-2 rounded-xl shadow hover:shadow-md transition">See leaderboard</Link>
        </div>
      </div>
    </div>
  );
}
