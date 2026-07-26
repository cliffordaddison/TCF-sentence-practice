import React from 'react';
import { ViewMode, UserStats } from '../types';
import {
  Compass,
  BarChart3,
  Settings,
  PlusCircle,
  Headphones,
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenSettings: () => void;
  onOpenImport: () => void;
  activeIslandName?: string;
  hasActiveIsland: boolean;
  stats?: UserStats;
  onCloseMobile?: () => void;
  isMobileDrawer?: boolean;
}

export function calculateStreak(dailyStats: Record<string, { reps: number }> = {}): number {
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const hasToday = (dailyStats[todayStr]?.reps || 0) > 0;
  const hasYesterday = (dailyStats[yesterdayStr]?.reps || 0) > 0;

  if (!hasToday && !hasYesterday) {
    return 0;
  }

  let streak = 0;
  let checkDate = hasToday ? new Date() : yesterday;

  while (true) {
    const key = checkDate.toISOString().split('T')[0];
    if ((dailyStats[key]?.reps || 0) > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  onOpenSettings,
  onOpenImport,
  activeIslandName,
  hasActiveIsland,
  stats,
  onCloseMobile,
  isMobileDrawer,
}) => {
  const streakDays = calculateStreak(stats?.dailyStats || {});

  const handleNavClick = (action: () => void) => {
    action();
    onCloseMobile?.();
  };

  return (
    <aside
      className={`${
        isMobileDrawer
          ? 'w-72 max-w-[85vw] h-full'
          : 'hidden md:flex w-[260px] h-screen sticky top-0'
      } bg-[#111625] text-white flex flex-col shrink-0 z-30 select-none shadow-2xl overflow-y-auto`}
    >
      {/* Brand Logo Header */}
      <div className="p-6 md:p-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
            T
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none text-white">TCF Trainer</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Exam Training</p>
          </div>
        </div>

        {isMobileDrawer && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            title="Close menu"
          >
            ✕
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="mt-2 flex-1 space-y-6">
        {/* Section: LEARN */}
        <div className="px-4">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-2 px-4 tracking-wider">
            Learn
          </p>
          <div className="space-y-1">
            <button
              onClick={() => handleNavClick(() => onSelectView('collections'))}
              className={`w-full flex items-center px-4 py-3 rounded-xl cursor-pointer font-medium text-sm transition-all ${
                currentView === 'collections'
                  ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
              }`}
            >
              <Compass className="w-4 h-4 mr-3 text-blue-400" />
              <span>Topic Islands</span>
            </button>

            {hasActiveIsland && (
              <button
                onClick={() => handleNavClick(() => onSelectView('practice'))}
                className={`w-full flex items-center px-4 py-3 rounded-xl cursor-pointer font-medium text-sm transition-all ${
                  currentView === 'practice'
                    ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
                }`}
              >
                <Headphones className="w-4 h-4 mr-3 text-indigo-400" />
                <span className="truncate">
                  {activeIslandName ? activeIslandName : 'Practice Track'}
                </span>
              </button>
            )}

            <button
              onClick={() => handleNavClick(onOpenImport)}
              className="w-full flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800/40 rounded-xl font-medium text-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 mr-3 text-amber-400" />
              <span>Import Island</span>
            </button>
          </div>
        </div>

        {/* Section: YOU */}
        <div className="px-4">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-2 px-4 tracking-wider">
            You
          </p>
          <div className="space-y-1">
            <button
              onClick={() => handleNavClick(() => onSelectView('stats'))}
              className={`w-full flex items-center px-4 py-3 rounded-xl cursor-pointer font-medium text-sm transition-all ${
                currentView === 'stats'
                  ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-3 text-teal-400" />
              <span>Stats & Progress</span>
            </button>

            <button
              onClick={() => handleNavClick(onOpenSettings)}
              className="w-full flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800/40 rounded-xl font-medium text-sm transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4 mr-3 text-purple-400" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Streak Widget Box */}
      <div className="p-6 md:p-8">
        <div className="bg-gray-800/90 rounded-2xl p-4 border border-gray-700/50">
          <p className="text-xs text-gray-400 mb-1 font-medium">Current Streak</p>
          <p className="text-xl font-bold text-white flex items-center gap-1.5">
            <span>🔥</span>
            <span>{streakDays} {streakDays === 1 ? 'Day' : 'Days'}</span>
          </p>
        </div>
      </div>
    </aside>
  );
};
