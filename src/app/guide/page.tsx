import React from 'react';
import Link from 'next/link';
import { BookOpen, CalendarDays, Gift, HelpCircle, Shield, Sparkles, Star, Trophy } from 'lucide-react';

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0fdfa] via-white to-[#fff5f5] px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8 rounded-3xl border border-[#14b8a6]/15 bg-white/90 p-6 shadow-xl backdrop-blur">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f0fdfa] px-3 py-1 text-xs font-extrabold text-[#0d9488]">
            <Sparkles size={14} />
            Kids Zone Guide
          </div>
          <h1 className="mt-4 text-3xl font-black text-[#1f2937] sm:text-4xl">How to take part in the competition</h1>
          <p className="mt-3 text-sm text-slate-700 sm:text-base">
            The best way to win is to show up most days, complete your daily activities, and keep learning. Some weeks you can
            win even if your points are not the highest.
          </p>
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            To enter our weekly winner draw you must take part in at least 3 activities in the app each week: Daily Quiz, Pledge
            Durood, and play any game.
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/signin"
              className="rounded-2xl bg-gradient-to-r from-[#14b8a6] to-[#0d9488] px-4 py-2 text-sm font-bold text-white shadow-md hover:opacity-95"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-2xl border border-[#e5c9a3]/40 bg-white px-4 py-2 text-sm font-bold text-[#6a422d] shadow-sm hover:bg-[#f9f0e6]"
            >
              Create an account
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0fdfa] text-[#0d9488]">
              <CalendarDays size={20} />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">Daily routine (best chance)</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>Do the Daily Quiz (you can do up to 2 attempts per day).</li>
              <li>Play at least 1 game and try a new activity.</li>
              <li>Complete your daily missions and claim the bonus when it appears.</li>
              <li>Come back most days — consistency matters.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff5f5] text-[#ff6b6b]">
              <Trophy size={20} />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">How winners are chosen</h2>
            <p className="mt-3 text-sm text-slate-700">
              Every week, the winner is chosen from kids who earned points that week. The winner is picked randomly from the
              top scorers (top 20), so you can still win even if you are not #1.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              New winner will be announced every Friday. Tip: Keep your weekly points active by doing something most days.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0fdfa] text-[#0d9488]">
              <Star size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Points, limits, and bonuses</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">Daily points limit</p>
                  <p className="mt-1 text-sm text-slate-700">You can earn up to 100 points per day.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">Daily Quiz attempts</p>
                  <p className="mt-1 text-sm text-slate-700">Up to 2 attempts per day.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">Daily missions bonus</p>
                  <p className="mt-1 text-sm text-slate-700">Finish all daily missions to unlock a bonus reward.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">Badges & levels</p>
                  <p className="mt-1 text-sm text-slate-700">Earn points to collect badges and level up over time.</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Some quizzes may lock for a short time after you complete them, so try different topics and activities.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0fdfa] text-[#0d9488]">
              <BookOpen size={20} />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">What to do in Kids Zone</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>
                <span className="font-bold">Daily Quiz:</span> answer questions and earn points.
              </li>
              <li>
                <span className="font-bold">Games:</span> fun learning games that also help you earn points (new games are added to help you gain more points).
              </li>
              <li>
                <span className="font-bold">Tasks:</span> extra ways to earn rewards (like referrals).
              </li>
              <li>
                <span className="font-bold">Leaderboard:</span> see your rank and weekly progress.
              </li>
              <li>
                <span className="font-bold">Rewards:</span> check prizes and achievements.
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff5f5] text-[#ff6b6b]">
              <Gift size={20} />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">Referrals & extra rewards</h2>
            <p className="mt-3 text-sm text-slate-700">
              You can invite friends to join. Referrals and special tasks can give you extra rewards.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Go to <Link href="/tasks" className="font-bold text-[#0d9488] hover:underline">Tasks</Link> to see what you can do.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0fdfa] text-[#0d9488]">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Fair play</h2>
              <p className="mt-2 text-sm text-slate-700">
                Be honest, play fairly, and focus on learning. The goal is to build good habits and keep improving.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff5f5] text-[#ff6b6b]">
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Need help?</h2>
              <p className="mt-2 text-sm text-slate-700">
                If you have issues signing up, message WhatsApp{' '}
                <a className="font-bold text-[#0d9488] hover:underline" href="https://wa.me/447404644610" target="_blank" rel="noopener noreferrer">
                  07404644610
                </a>{' '}
                and we will send you login details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
