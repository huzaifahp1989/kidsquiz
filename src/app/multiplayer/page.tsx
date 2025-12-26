'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components';
import { MultiplayerTabs, Tab } from '@/components/multiplayer/MultiplayerTabs';
import { MultiplayerLobby } from '@/components/multiplayer/MultiplayerLobby';
import { useAuth } from '@/lib/auth-context';

export default function MultiplayerPage() {
  const { profile, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('lobby');

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
          
          {activeTab === 'active' && (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Games</h3>
              <p className="text-gray-500">Join a lobby to start playing!</p>
            </div>
          )}
          
          {activeTab === 'leaderboard' && (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Weekly Champions</h3>
              <p className="text-gray-500">Coming soon...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
