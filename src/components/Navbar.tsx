import React from 'react';
import Link from 'next/link';
import { LogOut } from 'lucide-react';

interface NavbarProps {
  username?: string;
  points?: number;
  level?: string;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ username, points, level, onLogout }) => {
  return (
    <nav className="bg-gradient-to-r from-islamic-blue to-islamic-green text-white p-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <h1 className="text-xl font-bold">Islamic Kids</h1>
          </Link>
          <Link 
            href="/" 
            className="text-white hover:text-white/80 font-medium transition"
          >
            Home
          </Link>
          <Link 
            href="/leaderboard" 
            className="text-white hover:text-white/80 font-medium transition"
          >
            Leaderboard
          </Link>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-6">
          {username && (
            <div className="text-sm">
              <p className="font-semibold">{username}</p>
              <p className="text-xs opacity-90">{level || 'Beginner'}</p>
            </div>
          )}
          
          {points !== undefined && (
            <div className="bg-white bg-opacity-20 px-3 py-2 rounded-lg">
              <p className="text-sm">⭐ {points} pts</p>
            </div>
          )}
          
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
            >
              <LogOut size={18} />
              <span className="text-sm">Logout</span>
            </button>
          )}

          {!onLogout && (
            <>
              <Link
                href="/signin"
                className="bg-white/0 border border-white/70 text-white font-semibold px-4 py-2 rounded-lg hover:bg-white/10 transition"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-white text-islamic-blue font-semibold px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
              >
                Sign Up
              </Link>
            </>
          )}
          </div>
        </div>
      </div>
    </nav>
  );
};
