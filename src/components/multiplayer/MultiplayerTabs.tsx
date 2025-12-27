import React from 'react';

export type Tab = 'lobby' | 'leaderboard';

interface MultiplayerTabsProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export const MultiplayerTabs: React.FC<MultiplayerTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex space-x-2 bg-white p-2 rounded-xl shadow-sm mb-6">
      <button
        onClick={() => onTabChange('lobby')}
        className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
          activeTab === 'lobby'
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
      >
        🏰 Lobby
      </button>
      <button
        onClick={() => onTabChange('leaderboard')}
        className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
          activeTab === 'leaderboard'
            ? 'bg-amber-100 text-amber-700'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
      >
        🏆 Leaderboard
      </button>
    </div>
  );
};
