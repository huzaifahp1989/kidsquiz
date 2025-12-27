'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components';
import { MultiplayerTabs, Tab } from '@/components/multiplayer/MultiplayerTabs';
import { MultiplayerLobby } from '@/components/multiplayer/MultiplayerLobby';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function MultiplayerPage() {
  const { profile, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('lobby');
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      const fetchLeaderboard = async () => {
        const { data } = await supabase
          .from('multiplayer_players')
          .select('username, score, created_at')
          .order('score', { ascending: false })
          .limit(10);
        if (data) setLeaders(data);
      };
      fetchLeaderboard();
    }
  }, [activeTab]);

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
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar user={profile} onLogout={logout} />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Multiplayer Arena</h1>
          <p className="text-gray-600">Challenge friends and learn together!</p>
        </div>

        {/* Tabs */}
        <MultiplayerTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content Area */}
        <div className="transition-all duration-300">
          {activeTab === 'lobby' && <MultiplayerLobby />}
          
          {activeTab === 'leaderboard' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-center justify-center mb-2">
                  <div className="text-4xl mr-3">🏆</div>
                  <h3 className="text-2xl font-bold text-gray-800">Recent High Scores</h3>
                </div>
                <p className="text-center text-gray-600">Top performers across all games</p>
              </div>
              
              {leaders.length === 0 ? (
                <div className="text-center py-12">
                   <p className="text-gray-500">No scores recorded yet. Be the first!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {leaders.map((leader, index) => (
                    <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4
                          ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                            index === 1 ? 'bg-gray-100 text-gray-700' : 
                            index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-700'}
                        `}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">{leader.username || 'Anonymous'}</div>
                          <div className="text-xs text-gray-500">{new Date(leader.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-indigo-600 text-lg">
                        {leader.score} pts
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
