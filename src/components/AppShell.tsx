"use client";

import React from 'react';
import { Navbar } from '@/components';
import { useAuth } from '@/lib/auth-context';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth();
  return (
    <>
      <Navbar
        username={profile?.name}
        points={profile?.points}
        level={profile?.level}
        onLogout={profile ? logout : undefined}
      />
      <main className="min-h-screen">{children}</main>
      <footer className="bg-islamic-dark text-white p-4 text-center text-sm mt-12">
        <p>&copy; 2025 Islamic Kids Learning Platform. All rights reserved. For educational purposes.</p>
      </footer>
    </>
  );
}
