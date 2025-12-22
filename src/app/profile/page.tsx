'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/user-profile';
import Link from 'next/link';
import { Button } from '@/components/Button';

export default function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setAge(typeof profile.age === 'number' ? profile.age : '');
    }
  }, [profile]);

  const canEdit = useMemo(() => !!user?.id, [user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
    setMessage('Profile refreshed!');
    setTimeout(() => setMessage(null), 2000);
  };

  const createIfMissing = async () => {
    if (!user?.id) return;
    setError(null);
    setMessage(null);
    const ok = await ensureUserProfile(user.id);
    if (ok) {
      setMessage('Profile ensured. If not visible, refresh once.');
    } else {
      setError('Could not create profile (RLS or auth issue). Try reloading and signing in again.');
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setError(null);
    setMessage(null);
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (age === '' || Number.isNaN(age)) {
      setError('Please enter your age.');
      return;
    }
    setSaving(true);
    try {
      console.log('Updating profile:', { name, age, uid: user.id });
      const { data, error } = await supabase
        .from('users')
        .update({
          name,
          age: Number(age),
        })
        .eq('uid', user.id);
      
      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      
      console.log('Profile updated successfully');
      // Refresh profile to show changes immediately
      await refreshProfile();
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!user && loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-gray-600">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-6 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Profile</h1>
          <p className="text-gray-600 mb-4">You need to sign in to view your profile.</p>
          <Link href="/signin" className="text-islamic-blue font-semibold hover:underline">Go to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-xl bg-white shadow-lg rounded-xl p-6">
        <h1 className="text-2xl font-bold text-center mb-2">Your Profile</h1>
        <p className="text-center text-gray-600 mb-6">Manage your details and see your progress</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
        )}
        {message && (
          <div className="mb-4 rounded-lg bg-green-50 text-green-700 px-4 py-3 text-sm">{message}</div>
        )}

        {!profile && (
          <div className="mb-6 rounded-lg border border-dashed p-4 text-sm text-gray-700">
            No profile found yet. You can create it now.
            <div className="mt-3">
              <Button onClick={createIfMissing}>Create Profile</Button>
            </div>
          </div>
        )}
user?.email ?? 
        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={profile?.email ?? ''}
              disabled
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-islamic-blue"
              disabled={!canEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Age</label>
            <input
              type="number"
              min={5}
              max={14}
              value={age}
              onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-islamic-blue"
              disabled={!canEdit}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center rounded-lg bg-blue-50 p-3">
              <div className="text-xs text-gray-600">Total Points</div>
              <div className="text-xl font-bold text-islamic-blue">{profile?.points ?? 0}</div>
            </div>
            <div className="text-center rounded-lg bg-green-50 p-3">
              <div className="text-xs text-gray-600">Daily Points</div>
              <div className="text-xl font-bold text-islamic-green">{profile?.weeklyPoints ?? 0}/100</div>
            </div>
            <div className="text-center rounded-lg bg-yellow-50 p-3">
              <div className="text-xs text-gray-600">Badges</div>
              <div className="text-xl font-bold text-yellow-600">🏆 {profile?.badges ?? 0}</div>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="button" 
              disabled={refreshing}
              onClick={handleRefresh}
              variant="secondary"
              className="w-full mb-3"
            >
              {refreshing ? '🔄 Refreshing...' : '🔄 Refresh Stats'}
            </Button>
            <Button type="submit" disabled={!canEdit || saving} className="w-full">
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
