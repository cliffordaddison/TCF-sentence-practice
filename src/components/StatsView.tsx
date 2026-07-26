import React from 'react';
import { Island, UserStats } from '../types';
import {
  BarChart3,
  Headphones,
  Lightbulb,
  Clock,
  RotateCcw,
  BookOpen,
  Award,
  Trash2,
  AlertTriangle,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface StatsViewProps {
  islands: Island[];
  stats: UserStats;
  onHardReset: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ islands, stats, onHardReset }) => {
  // Compute global metrics across all islands
  let totalSentencesCount = 0;
  let totalPracticedCount = 0;
  let totalMasteredCount = 0;

  const allSentencesText: string[] = [];

  islands.forEach((is) => {
    is.sentences.forEach((s) => {
      totalSentencesCount++;
      if (s.practiced || s.reps > 0) totalPracticedCount++;
      if (s.mastered || s.rating === 5) {
        totalMasteredCount++;
        allSentencesText.push(s.target);
      }
    });
  });

  // Calculate unique words learned from mastered sentences
  const uniqueWordsSet = new Set<string>();
  allSentencesText.forEach((text) => {
    const cleaned = text
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?'"']/g, '')
      .split(/\s+/);
    cleaned.forEach((w) => {
      if (w.length > 2) uniqueWordsSet.add(w);
    });
  });
  const totalWordsLearned = uniqueWordsSet.size;

  // Percentage calculations
  const comprehensionPercent =
    totalSentencesCount > 0 ? Math.min(100, Math.round((totalPracticedCount / totalSentencesCount) * 100)) : 0;
  const speakingPercent =
    totalSentencesCount > 0 ? Math.min(100, Math.round((totalMasteredCount / totalSentencesCount) * 100)) : 0;

  // Today's metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayData = stats.dailyStats[todayStr] || { reps: 0, sentencesTouched: 0, timeSeconds: 0 };

  const getLocalDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 7-day chart data
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekData: Array<{ day: string; reps: number }> = [];

  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateKey = getLocalDateKey(d);
    const dayLabel = daysOfWeek[d.getDay()];
    const dayReps = stats.dailyStats[dateKey]?.reps || 0;
    weekData.push({ day: dayLabel, reps: dayReps });
  }

  const maxRepsInWeek = Math.max(10, ...weekData.map((w) => w.reps));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = (mins / 60).toFixed(1);
    if (mins < 60) return `${mins} mins`;
    return `${hrs} hrs`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-2 sm:my-6 bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-slate-200">
      {/* Main Section Header Group */}
      <div className="bg-slate-900 text-white p-4 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">Your Progress</h2>
            <p className="text-[11px] sm:text-xs font-medium text-slate-400 mt-0.5">
              Track your language learning journey, audio repetitions, and CEFR mastery.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        {/* Your Skill Levels Module */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-6">
          <h3 className="text-xs font-extrabold text-slate-700 tracking-wider uppercase flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Your Skill Levels</span>
          </h3>

          <div className="space-y-5">
            {/* Comprehension Track */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Comprehension Track</h4>
                    <p className="text-[11px] text-slate-500">Listen & Repeat practice</p>
                  </div>
                </div>
                <span className="font-extrabold text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                  {comprehensionPercent}% Completed (A1)
                </span>
              </div>
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${comprehensionPercent}%` }}
                />
              </div>
            </div>

            {/* Speaking Track */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Speaking Track</h4>
                    <p className="text-[11px] text-slate-500">Active Recall practice</p>
                  </div>
                </div>
                <span className="font-extrabold text-xs text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                  {speakingPercent}% Completed (A1)
                </span>
              </div>
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${speakingPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Practice Overview (All Time) Grid */}
        <div>
          <h3 className="text-xs font-extrabold text-slate-700 tracking-wider uppercase mb-4">
            Practice Overview (All Time)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-2xl font-black text-slate-900">{totalPracticedCount}</span>
              <p className="text-xs font-bold text-slate-600 mt-1">Reviewed Sentences</p>
              <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                Out of {totalSentencesCount} total
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-2xl font-black text-amber-600">{totalWordsLearned}</span>
              <p className="text-xs font-bold text-slate-600 mt-1">Words Learned</p>
              <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                From mastered cards
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-2xl font-black text-blue-600">{stats.totalReps}</span>
              <p className="text-xs font-bold text-slate-600 mt-1">Total Audio Reps</p>
              <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                Verbal audio cycles
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-2xl font-black text-indigo-600">
                {formatTime(stats.totalTimeSeconds)}
              </span>
              <p className="text-xs font-bold text-slate-600 mt-1">Total Time Spent</p>
              <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                Listening & shadowing
              </p>
            </div>
          </div>
        </div>

        {/* Today's Stats Grid */}
        <div>
          <h3 className="text-xs font-extrabold text-slate-700 tracking-wider uppercase mb-4 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Today's Stats</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xl font-bold text-slate-800">{todayData.reps}</span>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Reps Processed Today</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xl font-bold text-slate-800">
                {formatTime(todayData.timeSeconds)}
              </span>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Time Spent Today</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 col-span-2 md:col-span-1">
              <span className="text-xl font-bold text-emerald-600">{totalMasteredCount}</span>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Mastered Cards Total</p>
            </div>
          </div>
        </div>

        {/* This Week Analytics Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
          <h3 className="text-xs font-extrabold text-slate-700 tracking-wider uppercase">
            This Week Activity (Audio Reps)
          </h3>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-4 bg-slate-50 rounded-xl border border-slate-100">
            {weekData.map((item, idx) => {
              const heightPercent =
                item.reps > 0 ? Math.max(12, Math.round((item.reps / maxRepsInWeek) * 100)) : 4;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-bold text-slate-500">{item.reps}</span>
                  <div
                    className="w-full bg-blue-600 rounded-t-lg transition-all duration-300 hover:bg-blue-700 shadow-sm"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-xs font-bold text-slate-600">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CEFR Level Guide Footer Panel */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-extrabold text-slate-700 tracking-wider uppercase">
            CEFR Level Proficiency Benchmark
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> A1 Beginner (1,000+ words)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> A2 Elementary (2,000+ words)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> B1 Intermediate (4,000+ words)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> B2 Upper-Inter. (8,000+ words)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> C1 Advanced (16,000+ words)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> C2 Mastery (32,000+ words)
            </span>
          </div>
        </div>

        {/* Danger Zone Action Control */}
        <div className="pt-6 border-t border-slate-200 text-center space-y-2">
          <button
            onClick={() => {
              if (confirm('⚠️ This will delete all your progress data and reset islands permanently. Are you sure?')) {
                onHardReset();
              }
            }}
            className="px-6 py-3 rounded-full bg-red-600 text-white font-extrabold text-xs hover:bg-red-700 shadow-lg shadow-red-500/20 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hard Reset</span>
          </button>
          <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>This will delete all your progress data permanently</span>
          </p>
        </div>
      </div>
    </div>
  );
};
