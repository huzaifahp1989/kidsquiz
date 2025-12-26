"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/user-profile';
import { Button } from '@/components/Button';

const DB_FIX_SQL = `-- QUICK FIX: Run the full repair script from the repo
-- In Supabase SQL Editor, paste the contents of SUPABASE_FIX_AWARD_POINTS.sql
-- Path in repo: SUPABASE_FIX_AWARD_POINTS.sql
-- This script creates users + users_points, trigger, RLS, grants, award_points RPC
-- Steps:
-- 1) Open Supabase SQL Editor
-- 2) Open SUPABASE_FIX_AWARD_POINTS.sql from your repo and copy all contents
-- 3) Paste and Run
-- 4) Re-try signup
`;

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [debugUid, setDebugUid] = useState<string | null>(null);
  const [debugClaims, setDebugClaims] = useState<Record<string, any> | null>(null);
  const isDev = process.env.NODE_ENV !== 'production';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim()) return setError('Please enter your name.');
    if (age === '' || Number.isNaN(age)) return setError('Please enter your age.');
    if (Number(age) < 5 || Number(age) > 14) return setError('Age must be between 5 and 14.');
    if (!email) return setError('Please enter your email.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    try {
      setLoading(true);
      
      // Attempt signup WITHOUT metadata first to minimize trigger issues
      const { data: signUpRes, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        // We do NOT send metadata here to avoid confusing any broken triggers.
        // We will insert the profile manually below.
      });

      if (signUpErr) throw signUpErr;

      // Try to ensure we have a session right away (no email confirmation flow)
      const { data: sessionData } = await supabase.auth.getSession();
      let session = signUpRes.session ?? sessionData.session;

      if (!session?.user) {
        // Some projects still don't return a session on sign-up; try an immediate sign-in to obtain tokens
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;
        session = signInData.session;
      }

      if (!session?.user) {
        throw new Error('Could not obtain a session after sign-up. Please try again.');
      }

      const uid = session.user.id;
      setDebugUid(uid);
      setDebugClaims({ sub: session.user.id, email: session.user.email, role: session.user.role });

      // Create user profile with provided details now that we have an authenticated session
      console.log('Creating profile for:', uid, email, name, age);
      const { data: profileData, error: insertErr } = await supabase
        .from('users')
        .upsert({
          uid,
          role: 'kid',
          name,
          age: Number(age),
          email,
          points: 0,
          weeklypoints: 0,
          monthlypoints: 0,
          level: 'Beginner',
        }, { onConflict: 'uid', ignoreDuplicates: false })
        .select();
      
      if (insertErr) {
        console.error('Profile creation failed:', insertErr);
        throw insertErr;
      }
      console.log('Profile created:', profileData);

      // Show success message before redirecting
      setSuccess(true);
      
      // Wait 2 seconds then redirect to signin
      setTimeout(() => {
        router.push('/signin');
      }, 2000);
    } catch (err: any) {
      console.error('Signup process error FULL OBJECT:', err);
      let msg = err?.message || 'Failed to sign up. Please try again.';
      
      // More detailed error messages for common database issues
      if (err?.code === '42501') {
        msg = 'Database permission denied. Please run the FIX_SIGNUP_AND_DB_SCHEMA.sql script in Supabase.';
      } else if (err?.code === '42703') {
        msg = 'Database column missing. Please run the FIX_SIGNUP_AND_DB_SCHEMA.sql script in Supabase.';
      } else if (err?.code === 'unexpected_failure' || (err?.message && err.message.includes('Database error saving new user'))) {
        // This is often a generic 500 from Supabase/PostgREST.
        // It could mean the Trigger failed.
        msg = 'Database Error: The "handle_new_user" trigger likely failed. Please run FIX_SIGNUP_AND_DB_SCHEMA.sql in Supabase SQL Editor.';
      } else if (typeof msg === 'string' && msg.toLowerCase().includes('duplicate key')) {
        msg = 'That email is already registered. Try signing in instead.';
      } else if (err?.code === 'email_exists' || err?.code === '23505') {
        msg = 'That email is already registered. Try signing in instead.';
      } else if (err?.code === 'email_not_confirmed') {
        msg = 'Email not confirmed. Check your inbox or disable email confirmation in Supabase.';
      }
      
      // Append the actual error code for easier debugging
      if (err?.code) {
        msg += ` (Code: ${err.code})`;
      } else if (err?.details) {
         msg += ` (${err.details})`;
      }

      setError(msg);
      setErrorCode(err?.code || err?.name || null);
      if (isDev) {
        console.error('Signup error', { code: err?.code, name: err?.name, message: err?.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 py-8">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">Create Your Account</h1>
        <p className="text-center text-gray-600 mb-6 text-sm sm:text-base">For kids ages 5–14</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
            <p className="font-bold text-lg">⚠️ Signup Failed</p>
            <p className="mb-2">{error}</p>
            
            {(errorCode === 'unexpected_failure' || error.includes('Database Error') || error.includes('database error')) && (
               <div className="mt-3 bg-white p-4 rounded border-2 border-red-500 shadow-lg animate-pulse-border">
                 <p className="text-sm font-bold text-red-600 mb-2 uppercase">
                   Action Required: Fix Database
                 </p>
                 <ol className="list-decimal list-inside text-sm space-y-2 mb-3 text-gray-800">
                   <li>
                     <a 
                       href="https://supabase.com/dashboard/project/jlqrbbqsuksncrxjcmbc/sql/new" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-blue-600 underline font-bold hover:text-blue-800"
                     >
                       Click here to open Supabase SQL Editor
                     </a>
                   </li>
                   <li>Copy the code below</li>
                   <li>Paste it into the SQL Editor</li>
                   <li>Click the green <strong>"Run"</strong> button</li>
                 </ol>
                 
                 <div className="relative">
                   <textarea 
                     readOnly 
                     className="w-full h-40 text-[11px] font-mono bg-gray-100 border border-gray-400 p-2 rounded focus:ring-2 focus:ring-red-500 focus:outline-none text-black"
                     value={DB_FIX_SQL}
                     onClick={(e) => e.currentTarget.select()}
                   />
                   <div className="absolute top-2 right-2 bg-white/80 px-2 py-1 rounded text-xs pointer-events-none">
                     Click to Select All
                   </div>
                 </div>
                 
                 <p className="text-xs text-center text-gray-500 mt-2 font-medium">
                   After running this, try signing up again.
                 </p>
               </div>
            )}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 text-green-700 px-4 py-3 text-sm font-medium">
            ✓ Successfully signed up! Please log in.
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-islamic-blue"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Aisha"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Age</label>
            <input
              type="number"
              min={5}
              max={14}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-islamic-blue"
              value={age}
              onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="5-14"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-islamic-blue"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kid@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-islamic-blue"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-islamic-blue"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              autoComplete="new-password"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating account…' : 'Sign Up'}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By signing up, you confirm you have parent/guardian permission.
          </p>

          <p className="text-sm text-center text-gray-600">
            Already have an account?{' '}
            <a href="/signin" className="text-islamic-blue font-semibold hover:underline">Sign in</a>
          </p>
        </form>

        {isDev && error && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
            <p className="font-semibold mb-2">Debug (dev only)</p>
            <div className="space-y-1 text-gray-700">
              <p><span className="font-medium">Error code:</span> {errorCode || 'n/a'}</p>
              <p><span className="font-medium">UID:</span> {debugUid || 'n/a'}</p>
              <p><span className="font-medium">Has token claims:</span> {debugClaims ? 'yes' : 'no'}</p>
              {debugClaims && (
                <details className="mt-2">
                  <summary className="cursor-pointer">Show claims JSON</summary>
                  <pre className="mt-2 overflow-auto bg-white p-2 rounded border text-xs">{JSON.stringify(debugClaims, null, 2)}</pre>
                </details>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
