import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export const MobileBottomNav = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/quiz', label: 'Quiz', icon: '🧠' },
    { href: '/games', label: 'Games', icon: '🎮' },
    { href: '/stories', label: 'Stories', icon: '📖' },
    { href: '/pledge', label: 'Pledge', icon: '🌹' },
    { href: '/leaderboard', label: 'Ranks', icon: '🏆' },
    { href: '/rewards', label: 'Rewards', icon: '🎁' },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:hidden">
      <AnimatePresence>
        {isOpen && (
        <motion.div
          className="mb-3 w-56 rounded-2xl border border-[#14b8a6]/20 bg-white/95 p-2 shadow-2xl backdrop-blur-md"
          initial={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.96 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-all interactive-focus touch-target ${
                    isActive
                      ? 'bg-[#f0fdfa] text-[#0d9488]'
                      : 'text-[#6a422d] hover:bg-[#f9f0e6] hover:text-[#0d9488]'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={`${isActive ? 'drop-shadow-sm' : 'opacity-80'}`}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        whileTap={reduceMotion ? undefined : { scale: 0.93 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#14b8a6] to-[#0d9488] text-2xl text-white shadow-xl transition-transform hover:scale-105 interactive-focus"
      >
        {isOpen ? '✕' : '☰'}
      </motion.button>
    </div>
  );
};
