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
      const newPoints = (profile?.points ?? 0) + 10;
      const { data, error } = await supabase
        .from('users')
        .update({ 
          points: newPoints,
          weeklypoints: (profile?.weeklyPoints ?? 0) + 10,
          monthlypoints: (profile?.monthlyPoints ?? 0) + 10,
        })
        .eq('uid', user?.id)
        .select();
      if (error) {
        setTestResult(`❌ Update failed:\nCode: ${error.code}\nMessage: ${error.message}\nDetails: ${error.details}`);
      } else {
        setTestResult(`✅ Update success:\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (err: any) {
      setTestResult(`❌ Error: ${err.message}`);
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
              {testing ? '...' : '⭐ Add 10 Points'}
            </button>
            <button
              onClick={testSignOut}
              disabled={!user?.id || testing}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 text-sm font-semibold"
            >
              {testing ? '...' : '🚪 Sign Out'}
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
