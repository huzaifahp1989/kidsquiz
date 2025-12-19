"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/user-profile';
import Link from 'next/link';
import { Button } from '@/components/Button';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      if (!data.user?.id) {
        throw new Error('Sign-in succeeded but no user ID returned');
      }

      console.log('Sign-in successful, user ID:', data.user.id, 'Email:', data.user.email);
      
      // Just redirect home - Auth Context will load the existing profile
      router.push('/');
    } catch (err: any) {
      let msg = err?.message || 'Failed to sign in. Please try again.';
      if (typeof msg === 'string' && msg.toLowerCase().includes('email not confirmed')) {
        msg = 'Email not confirmed. Check your inbox or disable email confirmation in Supabase for development.';
      }
      if (err?.code === 'invalid_credentials') {
        msg = 'Invalid email or password. Please try again.';
      }
      if (err?.code === 'email_not_confirmed') {
        msg = 'Email not confirmed. Please check your inbox to verify your account.';
      }
      setError(msg);
      console.error('Sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 py-8">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">Welcome Back</h1>
        <p className="text-center text-gray-600 mb-6 text-sm sm:text-base">Sign in to continue learning</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
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
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </div>

          <p className="text-sm text-center text-gray-600">
            New here?{' '}
            <Link href="/signup" className="text-islamic-blue font-semibold hover:underline">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
