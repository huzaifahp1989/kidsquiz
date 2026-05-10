import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

const colorClasses = {
  blue: 'from-cyan-50 to-teal-100 text-teal-800',
  green: 'from-emerald-50 to-teal-100 text-emerald-800',
  yellow: 'from-amber-50 to-yellow-100 text-amber-800',
  purple: 'from-indigo-50 to-sky-100 text-indigo-800',
};

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, color }) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -3, scale: 1.03 }}
      className={`${colorClasses[color]} surface-card surface-card-hover bg-gradient-to-br rounded-3xl p-6 text-center transition-transform duration-200 transition-bouncy border`}
    >
      <div className="text-5xl mb-3 filter drop-shadow-sm">{icon}</div>
      <p className="text-base font-bold mb-2 opacity-80">{label}</p>
      <p className="text-4xl font-black">{value}</p>
    </motion.div>
  );
};
