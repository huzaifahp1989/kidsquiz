'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export default function DebugPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);

  const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toISOString().slice(11, 19)} ${msg}`]);

  const runDiagnostics = async () => {
    setLogs([]);
    addLog('Starting diagnostics...');

    if (!user) {
      addLog('❌ No user logged in');
      return;
    }
    addLog(`User ID: ${user.id}`);

    // 1. Check 'users' table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('uid', user.id)
      .maybeSingle();

    if (userError) addLog(`❌ 'users' fetch error: ${userError.message}`);
    else addLog(`✅ 'users' data: ${JSON.stringify(userData)}`);

    // 2. Check 'users_points' table
    const { data: pointsData, error: pointsError } = await supabase
      .from('users_points')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (pointsError) addLog(`❌ 'users_points' fetch error: ${pointsError.message}`);
    else addLog(`✅ 'users_points' data: ${JSON.stringify(pointsData)}`);

    // 3. Test RPC
    addLog('Testing award_points RPC (adding 0 points)...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('award_points', { p_points: 0 });
    
    if (rpcError) addLog(`❌ RPC error: ${rpcError.message}`);
    else addLog(`✅ RPC result: ${JSON.stringify(rpcData)}`);

    setDbStatus({
      users: userData,
      points: pointsData,
      rpc: rpcData
    });
  };

  return (
    <div className="p-8 font-mono text-sm">
      <h1 className="text-xl font-bold mb-4">Debug Console</h1>
      <button 
        onClick={runDiagnostics}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700"
      >
        Run Diagnostics
      </button>
      
      <div className="bg-gray-100 p-4 rounded border border-gray-300 min-h-[300px]">
        {logs.map((log, i) => (
          <div key={i} className="mb-1 border-b border-gray-200 pb-1">{log}</div>
        ))}
      </div>

      <pre className="mt-4 bg-black text-green-400 p-4 rounded overflow-auto">
        {JSON.stringify(dbStatus, null, 2)}
      </pre>
    </div>
  );
}
