'use client';

import React, { useEffect, useState } from 'react';
import { GameRoom } from '@/components/multiplayer/GameRoom';
import { Navbar } from '@/components';
import { useAuth } from '@/lib/auth-context';
import { useParams } from 'next/navigation';

export default function RoomPage() {
  const { profile, logout } = useAuth();
  const params = useParams();
  const [ready, setReady] = useState(false);
  
  // Ensure we are mounted before accessing params to avoid hydration mismatches
  useEffect(() => {
    setReady(true);
  }, []);

  const code = params?.code as string;

  if (!ready || !code) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar user={profile} onLogout={logout} />
      <GameRoom code={code} />
    </div>
  );
}
