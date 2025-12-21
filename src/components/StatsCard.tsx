import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-sky-100 text-sky-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  purple: 'bg-purple-100 text-purple-700',
};

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, color }) => {
  return (
    <div className={`${colorClasses[color]} rounded-xl p-6 text-center`}>
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm font-semibold mb-2">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
};
