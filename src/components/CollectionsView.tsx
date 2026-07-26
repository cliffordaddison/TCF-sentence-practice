import React, { useState } from 'react';
import { Island } from '../types';
import {
  Search,
  Plus,
  ChevronRight,
  MessageSquare,
  Utensils,
  Compass,
  GraduationCap,
  FileSpreadsheet,
  BookOpen,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Trophy,
  Briefcase,
  Home as HomeIcon,
  Plane,
  Heart,
  Palette,
} from 'lucide-react';

interface CollectionsViewProps {
  islands: Island[];
  onSelectIsland: (island: Island) => void;
  onOpenImport: () => void;
  onDeleteIsland: (islandId: string) => void;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  islands,
  onSelectIsland,
  onOpenImport,
  onDeleteIsland,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIslands = islands.filter(
    (island) =>
      island.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      island.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (island.category && island.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getIslandIconAndColor = (index: number, name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('basic') || lower.includes('survival') || lower.includes('starter')) {
      return {
        bg: 'bg-indigo-600 text-white',
        icon: <GraduationCap className="w-6 h-6 stroke-[2.2]" />,
        badge: { label: 'Hot', bg: 'bg-red-100 text-red-600' },
      };
    }
    if (lower.includes('family') || lower.includes('relationship') || lower.includes('people')) {
      return {
        bg: 'bg-emerald-600 text-white',
        icon: <Heart className="w-6 h-6 stroke-[2.2]" />,
        badge: { label: 'Popular', bg: 'bg-amber-100 text-amber-700' },
      };
    }
    if (lower.includes('house') || lower.includes('home') || lower.includes('daily')) {
      return {
        bg: 'bg-purple-600 text-white',
        icon: <HomeIcon className="w-6 h-6 stroke-[2.2]" />,
        badge: null,
      };
    }
    if (lower.includes('social') || lower.includes('interaction') || lower.includes('talk')) {
      return {
        bg: 'bg-orange-600 text-white',
        icon: <MessageSquare className="w-6 h-6 stroke-[2.2]" />,
        badge: null,
      };
    }
    if (lower.includes('hobby') || lower.includes('leisure') || lower.includes('sport')) {
      return {
        bg: 'bg-red-600 text-white',
        icon: <Palette className="w-6 h-6 stroke-[2.2]" />,
        badge: null,
      };
    }
    if (lower.includes('work') || lower.includes('career') || lower.includes('office')) {
      return {
        bg: 'bg-blue-600 text-white',
        icon: <Briefcase className="w-6 h-6 stroke-[2.2]" />,
        badge: null,
      };
    }
    if (lower.includes('travel') || lower.includes('abroad') || lower.includes('hotel')) {
      return {
        bg: 'bg-teal-600 text-white',
        icon: <Plane className="w-6 h-6 stroke-[2.2]" />,
        badge: { label: 'New', bg: 'bg-blue-100 text-blue-600' },
      };
    }
    if (lower.includes('eat') || lower.includes('food') || lower.includes('shop') || lower.includes('restaurant')) {
      return {
        bg: 'bg-fuchsia-600 text-white',
        icon: <Utensils className="w-6 h-6 stroke-[2.2]" />,
        badge: null,
      };
    }

    // Dynamic fallbacks based on index
    const fallbacks = [
      { bg: 'bg-indigo-600 text-white', icon: <BookOpen className="w-6 h-6 stroke-[2.2]" /> },
      { bg: 'bg-emerald-600 text-white', icon: <Compass className="w-6 h-6 stroke-[2.2]" /> },
      { bg: 'bg-purple-600 text-white', icon: <FileSpreadsheet className="w-6 h-6 stroke-[2.2]" /> },
      { bg: 'bg-amber-600 text-white', icon: <MessageSquare className="w-6 h-6 stroke-[2.2]" /> },
    ];
    return { ...fallbacks[index % fallbacks.length], badge: null };
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-4 bg-[#F5F7FA] min-h-[calc(100vh-2rem)] p-4 md:p-6 rounded-[28px] shadow-xl border border-gray-100">
      {/* Header Banner (Matching Reference Blue Gradient & FR Accent) */}
      <header className="bg-gradient-to-r from-[#4285F4] via-[#3B78E7] to-[#6366F1] p-8 rounded-[24px] text-white flex justify-between items-center relative overflow-hidden shadow-lg mb-6">
        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
            <ArrowLeft className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold leading-tight tracking-tight">Language Islands</h2>
            <p className="text-white/80 text-xs md:text-sm mt-0.5">
              Explore curated topic collections with dialogues, stories, and sentences.
            </p>
            <div className="flex items-center space-x-4 mt-3 text-xs font-medium text-white/90">
              <span className="flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-white/80" />
                <span>{filteredIslands.length} Topics</span>
              </span>
              <span className="text-white/40">|</span>
              <span className="flex items-center space-x-1.5">
                <Trophy className="w-4 h-4 text-white/80" />
                <span>{islands.length} Islands</span>
              </span>
            </div>
          </div>
        </div>

        {/* Decorative FR Globe Overlay */}
        <div className="relative z-10 flex items-center justify-center">
          <span className="text-3xl font-extrabold tracking-wider text-white/90 drop-shadow-sm select-none">
            FR
          </span>
        </div>
        <div className="absolute -bottom-16 -right-12 w-48 h-48 bg-white/15 rounded-full blur-2xl pointer-events-none" />
      </header>

      {/* Search Bar & Import Action Row */}
      <div className="space-y-4 mb-6">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search topic islands or keywords..."
              className="w-full pl-12 pr-4 py-3 bg-white text-gray-800 rounded-2xl border border-gray-200/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-medium placeholder:text-gray-400 transition-all shadow-xs"
            />
          </div>

          <button
            onClick={onOpenImport}
            className="px-5 py-3 rounded-2xl bg-white border border-blue-200 text-blue-600 font-bold text-xs hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Import Custom Island</span>
          </button>
        </div>
      </div>

      {/* Topic Grid */}
      <div className="space-y-3">
        {filteredIslands.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-gray-200 p-8 space-y-3">
            <p className="text-gray-500 font-medium text-base">No topic islands found.</p>
            <p className="text-xs text-gray-400">You can import custom sentences or click below to restore default topics.</p>
            <button
              onClick={onOpenImport}
              className="mt-2 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
            >
              + Import Island
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIslands.map((island, index) => {
              const total = island.sentences.length;
              const mastered = island.sentences.filter((s) => s.mastered || s.rating === 5).length;
              const style = getIslandIconAndColor(index, island.name);

              return (
                <div
                  key={island.id}
                  onClick={() => onSelectIsland(island)}
                  className="group cursor-pointer p-5 bg-white rounded-2xl border border-gray-200/90 hover:border-blue-400 hover:shadow-md transition-all duration-200 flex items-center justify-between relative overflow-hidden"
                >
                  <div className="flex items-start space-x-4 flex-1 min-w-0 pr-2">
                    {/* Icon Badge Squircle */}
                    <div
                      className={`w-12 h-12 rounded-2xl ${style.bg} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform mt-0.5`}
                    >
                      {style.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-gray-900 text-base truncate group-hover:text-blue-600 transition-colors">
                          {island.name}
                        </h4>
                        {style.badge && (
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${style.badge.bg}`}
                          >
                            {style.badge.label}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed font-normal">
                        {island.description || 'Practice sentences, active recall, and native voice audio repetition.'}
                      </p>

                      <div className="flex items-center space-x-3 mt-3 text-xs text-gray-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-gray-400" />
                          <span>{total} sentences</span>
                        </span>
                        {mastered > 0 && (
                          <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>{mastered} mastered</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Action Chevron & Delete Language Island Button */}
                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete Language Island "${island.name}" and all its contents?`)) {
                          onDeleteIsland(island.id);
                        }
                      }}
                      title="Delete Language Island"
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>

                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-700 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
