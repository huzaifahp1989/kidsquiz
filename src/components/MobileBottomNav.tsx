import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const MobileBottomNav = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/quiz', label: 'Quiz', icon: '🧠' },
    { href: '/games', label: 'Games', icon: '🎮' },
    { href: '/pledge', label: 'Pledge', icon: '🌹' },
    { href: '/leaderboard', label: 'Ranks', icon: '🏆' },
    { href: '/rewards', label: 'Rewards', icon: '🎁' },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:hidden">
      {isOpen && (
        <div className="mb-3 w-56 rounded-2xl border border-[#14b8a6]/20 bg-white/95 p-2 shadow-2xl backdrop-blur-md">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-[#f0fdfa] text-[#0d9488]'
                      : 'text-[#6a422d] hover:bg-[#f9f0e6] hover:text-[#0d9488]'
                  }`}
                >
                  <span className={`${isActive ? 'drop-shadow-sm' : 'opacity-80'}`}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#14b8a6] to-[#0d9488] text-2xl text-white shadow-xl transition-transform hover:scale-105"
      >
        {isOpen ? '✕' : '☰'}
      </button>
    </div>
  );
};
