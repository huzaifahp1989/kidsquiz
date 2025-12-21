import React, { useState } from 'react';
import Link from 'next/link';
import { LogOut, Menu, X } from 'lucide-react';

interface NavbarProps {
  username?: string;
  points?: number;
  level?: string;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ username, points, level, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-islamic-blue to-islamic-green text-white p-4 shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <h1 className="text-xl font-bold">Islamic Kids</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
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
          
          {/* Desktop User Actions */}
          <div className="hidden md:flex flex-col items-end gap-2">
            <div className="flex items-center gap-6">
              {username && (
                <div className="text-sm text-right">
                  <p className="font-semibold">{username}</p>
                  <p className="text-xs opacity-90">{level || 'Beginner'}</p>
                </div>
              )}
              
              {points !== undefined && (
                <div className="bg-white bg-opacity-20 px-3 py-2 rounded-lg">
                  <p className="text-sm">⭐ {points} pts</p>
                </div>
              )}
              
              {onLogout ? (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
                >
                  <LogOut size={18} />
                  <span className="text-sm">Logout</span>
                </button>
              ) : (
                <div className="flex items-center gap-3">
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
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-white/20 space-y-4 animate-fadeIn">
            <div className="flex flex-col gap-3">
              <Link 
                href="/" 
                className="text-white hover:bg-white/10 px-3 py-2 rounded-lg transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/leaderboard" 
                className="text-white hover:bg-white/10 px-3 py-2 rounded-lg transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Leaderboard
              </Link>
            </div>

            {/* Mobile User Stats & Actions */}
            <div className="pt-4 border-t border-white/20">
              {username ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white/10 p-3 rounded-lg">
                    <div>
                      <p className="font-semibold">{username}</p>
                      <p className="text-xs opacity-90">{level || 'Beginner'}</p>
                    </div>
                    {points !== undefined && (
                      <div className="bg-white/20 px-3 py-1 rounded-lg">
                        <p className="text-sm">⭐ {points} pts</p>
                      </div>
                    )}
                  </div>
                  
                  {onLogout && (
                    <button
                      onClick={() => {
                        onLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
                    >
                      <LogOut size={18} />
                      <span className="text-sm">Logout</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/signin"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-center bg-white/0 border border-white/70 text-white font-semibold px-4 py-2 rounded-lg hover:bg-white/10 transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-center bg-white text-islamic-blue font-semibold px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
