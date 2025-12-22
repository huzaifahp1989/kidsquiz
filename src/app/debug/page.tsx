'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { ensureUserProfile } from '@/lib/user-profile';

export default function DebugPage() {
  const { user, profile, loading } = useAuth();
  const [testResult, setTestResult] = useState<string>('');
  const [testing, setTesting] = useState(false);
  const [authDetails, setAuthDetails] = useState<string>('');

  // Show auth session details on load
  useEffect(() => {
    (async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setAuthDetails(JSON.stringify({
        sessionUser: session?.user ? { id: session.user.id, email: session.user.email } : null,
        authUser: authUser ? { id: authUser.id, email: authUser.email } : null,
        error,
      }, null, 2));
    })();
  }, []);

  const testCheckProfile = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', user?.id)
        .maybeSingle();
      if (error) {
        setTestResult(`❌ Query failed: ${error.message}\nCode: ${error.code}`);
      } else {
        setTestResult(`✅ Profile found:\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (err: any) {
      setTestResult(`❌ Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const testCreateProfile = async () => {
    setTesting(true);
    try {
      const result = await ensureUserProfile(user?.id || '');
      setTestResult(`ensureUserProfile returned: ${result}\n\nNow checking...`);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', user?.id)
        .maybeSingle();
      if (error) {
        setTestResult(prev => prev + `\n❌ Profile check failed: ${error.message}`);
      } else {
        setTestResult(prev => prev + `\n✅ Profile exists:\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (err: any) {
      setTestResult(`❌ Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const testUpdatePoints = async () => {
    setTesting(true);
    try {
      // STEP 1: Verify auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTestResult('❌ Not logged in. Please sign in first.');
        setTesting(false);
        return;
      }
      
      setTestResult('Testing award_points RPC function...\n\nStep 1: Checking auth...');
      
      // STEP 2: Test auth.uid()
      const { data: testUid, error: testError } = await supabase.rpc('test_uid');
      const uidTest = `\nStep 2: test_uid() => ${JSON.stringify(testUid || testError, null, 2)}`;
      setTestResult(prev => prev + uidTest);
      
      if (!testUid?.is_authenticated) {
        setTestResult(prev => prev + '\n\n❌ RPC cannot see authenticated user. Session not persisted.');
        setTesting(false);
        return;
      }
      
      // STEP 3: Award points
      setTestResult(prev => prev + '\n\nStep 3: Calling award_points...');
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('award_points', {
          p_points: 10,
        });

      if (rpcError) {
        setTestResult(prev => prev + `\n\n❌ award_points failed:\nCode: ${rpcError.code}\nMessage: ${rpcError.message}`);
      } else {
        setTestResult(prev => prev + `\n\n✅ RPC Success:\n${JSON.stringify(rpcData, null, 2)}`);
      }
    } catch (err: any) {
      setTestResult(`❌ Exception: ${err.message}\n${err.stack}`);
    } finally {
      setTesting(false);
    }
  };

  const fixProfile = async () => {
    setTesting(true);
    try {
      setTestResult('Fixing profile NULL values...');
      const { data: current, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('uid', user?.id)
        .maybeSingle();

      if (fetchError) {
        setTestResult(`❌ Fetch failed: ${fetchError.message}`);
        setTesting(false);
        return;
      }

      if (!current) {
        setTestResult('❌ Profile not found');
        setTesting(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          points: current.points ?? 0,
          weeklypoints: current.weeklypoints ?? 0,
          monthlypoints: current.monthlypoints ?? 0,
          badges: current.badges ?? 0,
          daily_games_played: current.daily_games_played ?? 0,
          last_game_date: current.last_game_date ?? new Date().toISOString().split('T')[0],
          level: current.level ?? 'Beginner',
          updatedat: new Date().toISOString(),
        })
        .eq('uid', user?.id);

      if (updateError) {
        setTestResult(`❌ Fix failed: ${updateError.message}`);
      } else {
        setTestResult('✅ Profile fixed! All NULL values reset to defaults.');
      }
    } catch (err: any) {
      setTestResult(`❌ Exception: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const testSignOut = async () => {
    setTesting(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setTestResult(`❌ Sign out failed: ${error.message}`);
      } else {
        setTestResult(`✅ Signed out. Refresh to continue.`);
      }
    } catch (err: any) {
      setTestResult(`❌ Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔧 Debug Dashboard</h1>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Auth Status */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-xl font-bold mb-4">📱 Auth Context</h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Loading:</span> {loading ? '✓ true' : '✗ false'}</p>
              <p><span className="font-semibold">User ID:</span> {user?.id ? `✓ ${user.id.slice(0, 12)}...` : '❌ None'}</p>
              <p><span className="font-semibold">User Email:</span> {user?.email || 'N/A (anonymous)'}</p>
              <p><span className="font-semibold">Profile Name:</span> {profile?.name || '❌ No profile'}</p>
              <p><span className="font-semibold">Points:</span> {profile?.points || 0}</p>
              <p><span className="font-semibold">Level:</span> {profile?.level || 'N/A'}</p>
            </div>
          </div>

          {/* Supabase Session */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-xl font-bold mb-4">🔑 Supabase Session</h2>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40 font-mono">
              {authDetails || 'Loading...'}
            </pre>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg p-6 shadow mb-6">
          <h2 className="text-xl font-bold mb-4">🧪 Tests</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={testCheckProfile}
              disabled={!user?.id || testing}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 text-sm font-semibold"
            >
              {testing ? '...' : '📖 Read Profile'}
            </button>
            <button
              onClick={testCreateProfile}
              disabled={!user?.id || testing}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 text-sm font-semibold"
            >
              {testing ? '...' : '✨ Ensure Profile'}
            </button>
            <button
              onClick={testUpdatePoints}
              disabled={!user?.id || testing}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300 text-sm font-semibold"
            >
              {testing ? '...' : '⭐ Test Add Points (+10)'}
            </button>
            <button
              onClick={fixProfile}
              disabled={!user?.id || testing}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-300 text-sm font-semibold"
            >
              {testing ? '...' : '🔧 Fix Profile NULLs'}
            </button>
            <button
              onClick={testSignOut}
              disabled={!user?.id || testing}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 text-sm font-semibold col-span-2"
            >
              {testing ? '...' : '🚪 Sign Out & Clear Session'}
            </button>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className="bg-gray-900 text-white rounded-lg p-6 font-mono text-xs whitespace-pre-wrap overflow-auto max-h-80">
            {testResult}
          </div>
        )}
      </div>
    </div>
  );
}
