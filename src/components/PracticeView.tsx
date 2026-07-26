import React, { useState, useEffect, useRef } from 'react';
import { Island, Sentence, UserSettings, LanguageMode, DisplayMode } from '../types';
import { SentenceCard } from './SentenceCard';
import { ttsService } from '../services/tts';
import { translateToEnglish } from '../services/translator';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Play,
  Pause,
  Repeat,
  Eye,
  EyeOff,
  Search,
  Settings,
  Bookmark,
  Volume2,
  CheckCircle2,
  Headphones,
  Lightbulb,
  Sparkles,
  Save,
  X,
  SlidersHorizontal,
  Plus,
  Trash2,
} from 'lucide-react';

interface PracticeViewProps {
  island: Island;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onUpdateSentence: (islandId: string, updatedSentence: Sentence) => void;
  onDeleteSentence?: (islandId: string, sentenceId: string) => void;
  onAddSentence?: (islandId: string, target: string, native: string) => void;
  onDeleteIsland?: (islandId: string) => void;
  onSaveSubBatchIsland: (name: string, sentences: Sentence[]) => void;
  onOpenSettings: () => void;
  onBack: () => void;
  onRecordRepetition: () => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  island,
  settings,
  onUpdateSettings,
  onUpdateSentence,
  onDeleteSentence,
  onAddSentence,
  onDeleteIsland,
  onSaveSubBatchIsland,
  onOpenSettings,
  onBack,
  onRecordRepetition,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);
  const [activeRepCounter, setActiveRepCounter] = useState<number>(0);
  const [searchFilter, setSearchFilter] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'favorites' | 'unpracticed'>('all');
  const [timeframe, setTimeframe] = useState<'session' | 'lifetime'>('session');
  const [sessionReps, setSessionReps] = useState(0);

  // Quick Add Tile state
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newTargetText, setNewTargetText] = useState('');
  const [newNativeText, setNewNativeText] = useState('');
  const [isTranslatingNewCard, setIsTranslatingNewCard] = useState(false);

  const isAutoPlayLoopingRef = useRef(false);

  // Derive active sentence list
  let activeSentences = island.sentences.filter((s) => {
    const matchesSearch =
      s.target.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.native.toLowerCase().includes(searchFilter.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'favorites') return s.isFavorite;
    if (filterMode === 'unpracticed') return !s.practiced;
    return true;
  });

  // Sort queue according to setting
  if (settings.sortOrder === 'easy_hard') {
    activeSentences = [...activeSentences].sort((a, b) => a.rating - b.rating);
  } else if (settings.sortOrder === 'hard_easy') {
    activeSentences = [...activeSentences].sort((a, b) => b.rating - a.rating);
  }

  // Queue to play: if sub-batch selected, play sub-batch! Otherwise play all active sentences
  const playbackQueue =
    selectedIds.length > 0
      ? activeSentences.filter((s) => selectedIds.includes(s.id))
      : activeSentences;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSpeakSingleCard = async (sentence: Sentence) => {
    // Record rep and update sentence
    onRecordRepetition();
    setSessionReps((prev) => prev + 1);

    const updated = { ...sentence, reps: sentence.reps + 1, practiced: true };
    onUpdateSentence(island.id, updated);

    await ttsService.speakSentence(sentence, {
      languageMode: settings.languageMode,
      playbackSpeed: settings.playbackSpeed,
      targetVoiceURI: settings.targetVoiceURI,
      nativeVoiceURI: settings.nativeVoiceURI,
    });
  };

  const handleRateSentence = (sentenceId: string, rating: number) => {
    const original = island.sentences.find((s) => s.id === sentenceId);
    if (!original) return;

    const isNowMastered = rating === 5;
    const updated = { ...original, rating, mastered: isNowMastered };
    onUpdateSentence(island.id, updated);

    if (isNowMastered && !original.mastered) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  };

  const handleToggleFavorite = (sentenceId: string) => {
    const original = island.sentences.find((s) => s.id === sentenceId);
    if (!original) return;

    onUpdateSentence(island.id, { ...original, isFavorite: !original.isFavorite });
  };

  const handleDeleteSingleSentence = (sentenceId: string) => {
    if (onDeleteSentence) {
      onDeleteSentence(island.id, sentenceId);
    }
  };

  const handleTranslateSingleSentence = async (sentenceId: string) => {
    const original = island.sentences.find((s) => s.id === sentenceId);
    if (!original) return;
    const translated = await translateToEnglish(original.target);
    if (translated) {
      onUpdateSentence(island.id, { ...original, native: translated });
    }
  };

  const handleCreateNewTile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetText.trim()) return;

    let nativeVal = newNativeText.trim();
    if (!nativeVal) {
      setIsTranslatingNewCard(true);
      nativeVal = await translateToEnglish(newTargetText);
      setIsTranslatingNewCard(false);
    }

    if (onAddSentence) {
      onAddSentence(island.id, newTargetText.trim(), nativeVal);
    }

    setNewTargetText('');
    setNewNativeText('');
    setIsAddingCard(false);
  };

  // Refs to maintain up-to-date values across async loops
  const isAutoPlayRef = useRef(false);
  const queueRef = useRef<Sentence[]>([]);
  const queueIndexRef = useRef(0);
  const repCounterRef = useRef(0);
  const settingsRef = useRef(settings);
  const islandRef = useRef(island);

  useEffect(() => {
    queueRef.current = playbackQueue;
  }, [playbackQueue]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    islandRef.current = island;
  }, [island]);

  // Scroll active playing sentence card into view
  useEffect(() => {
    if (isPlaying && playbackQueue[currentQueueIndex]) {
      const activeId = playbackQueue[currentQueueIndex].id;
      const el = document.getElementById(`sentence-card-${activeId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentQueueIndex, isPlaying, playbackQueue]);

  // AUTO-PLAY QUEUE ENGINE (Single-threaded Async Runner)
  useEffect(() => {
    let cancelToken = false;

    const startLoop = async () => {
      if (!isPlaying) return;
      isAutoPlayRef.current = true;

      while (isAutoPlayRef.current && !cancelToken) {
        const queue = queueRef.current;
        if (queue.length === 0) {
          setIsPlaying(false);
          isAutoPlayRef.current = false;
          break;
        }

        let idx = queueIndexRef.current;
        if (idx >= queue.length) {
          if (settingsRef.current.loopPlayback) {
            idx = 0;
            queueIndexRef.current = 0;
            setCurrentQueueIndex(0);
            repCounterRef.current = 0;
            setActiveRepCounter(0);
          } else {
            setIsPlaying(false);
            isAutoPlayRef.current = false;
            break;
          }
        }

        const currentSentence = queue[idx];
        if (!currentSentence) break;

        // Speak current sentence (English first, French second in en_fr mode)
        await ttsService.speakSentence(currentSentence, {
          languageMode: settingsRef.current.languageMode,
          playbackSpeed: settingsRef.current.playbackSpeed,
          targetVoiceURI: settingsRef.current.targetVoiceURI,
          nativeVoiceURI: settingsRef.current.nativeVoiceURI,
        });

        if (!isAutoPlayRef.current || cancelToken) break;

        // Record repetition metrics
        onRecordRepetition();
        setSessionReps((prev) => prev + 1);

        const latestSentence =
          islandRef.current.sentences.find((s) => s.id === currentSentence.id) || currentSentence;

        const updated = {
          ...latestSentence,
          reps: (latestSentence.reps || 0) + 1,
          practiced: true,
        };
        onUpdateSentence(islandRef.current.id, updated);

        // Calculate next rep count or next sentence card
        const nextRepCount = repCounterRef.current + 1;
        if (nextRepCount < settingsRef.current.repetitionCount) {
          repCounterRef.current = nextRepCount;
          setActiveRepCounter(nextRepCount);
        } else {
          repCounterRef.current = 0;
          setActiveRepCounter(0);
          const nextIdx = idx + 1;
          queueIndexRef.current = nextIdx;
          setCurrentQueueIndex(nextIdx);
        }

        // Pause duration delay before next loop iteration
        const pauseMs = Math.max(100, (settingsRef.current.pauseDuration || 0.5) * 1000);
        await new Promise((res) => setTimeout(res, pauseMs));

        if (!isAutoPlayRef.current || cancelToken) break;
      }
    };

    if (isPlaying) {
      startLoop();
    } else {
      isAutoPlayRef.current = false;
      ttsService.stop();
    }

    return () => {
      cancelToken = true;
      isAutoPlayRef.current = false;
      ttsService.stop();
    };
  }, [isPlaying]);

  const toggleAutoPlay = () => {
    if (isPlaying) {
      isAutoPlayRef.current = false;
      setIsPlaying(false);
      ttsService.stop();
    } else {
      queueIndexRef.current = 0;
      setCurrentQueueIndex(0);
      repCounterRef.current = 0;
      setActiveRepCounter(0);
      setIsPlaying(true);
    }
  };

  const handleSaveSubBatch = () => {
    if (selectedIds.length === 0) return;

    const subSentences = island.sentences.filter((s) => selectedIds.includes(s.id));
    const subName = prompt('Enter a name for this sub-batch island:', `${island.name} (Batch)`);

    if (subName) {
      onSaveSubBatchIsland(subName, subSentences);
      setSelectedIds([]);
      alert(`Sub-batch saved as island: "${subName}"!`);
    }
  };

  // Metrics calculations for right sidebar
  const totalInIsland = island.sentences.length;
  const practicedInIsland = island.sentences.filter((s) => s.practiced || s.reps > 0).length;
  const masteredInIsland = island.sentences.filter((s) => s.mastered || s.rating === 5).length;
  const totalRepsInIsland = island.sentences.reduce((sum, s) => sum + s.reps, 0);

  const compPercent = totalInIsland > 0 ? Math.round((practicedInIsland / totalInIsland) * 100) : 0;
  const speakPercent = totalInIsland > 0 ? Math.round((masteredInIsland / totalInIsland) * 100) : 0;

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-[24px] shadow-2xl flex flex-col overflow-hidden my-4 border border-gray-100">
      {/* Top Bar Header */}
      <header className="bg-white px-6 py-5 border-b border-gray-100 flex justify-between items-center relative z-10">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer text-gray-700"
            title="Back to Topic Islands"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              {island.name || 'Sentences'}
            </h2>
            <p className="text-xs font-medium text-gray-400 mt-0.5">
              {island.description || `${totalInIsland} Questions & Answers - Part 1`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full border border-blue-100">
            Queue: {playbackQueue.length} / {totalInIsland}
          </span>
          {onDeleteIsland && (
            <button
              onClick={() => {
                if (confirm(`Delete Language Island "${island.name}" and all its contents?`)) {
                  onDeleteIsland(island.id);
                  onBack();
                }
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              title="Delete Language Island"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Practice Track (Center List) */}
        <section className="flex-[1.5] flex flex-col border-r border-gray-100">
          {/* Control Strip matching reference bar */}
          <div className="p-3.5 border-b border-gray-100 bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleAutoPlay}
                className={`px-4 py-2 rounded-2xl font-bold text-xs shadow-xs flex items-center space-x-2 transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-600 text-gray-900'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <span>{isPlaying ? '⏸' : '▶'}</span>
                <span>{isPlaying ? 'Pause' : 'Rep'}</span>
              </button>

              <select
                value={settings.repetitionCount}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, repetitionCount: parseInt(e.target.value) })
                }
                className="bg-white border border-gray-200 rounded-2xl px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none cursor-pointer shadow-xs"
              >
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
                <option value={4}>4x</option>
                <option value={5}>5x</option>
              </select>

              <select
                value={settings.languageMode}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, languageMode: e.target.value as LanguageMode })
                }
                title="Audio Order & Language Mode"
                className="bg-white border border-blue-200 rounded-2xl px-2.5 py-1.5 text-xs font-extrabold text-blue-700 focus:outline-none cursor-pointer shadow-xs hover:border-blue-400"
              >
                <option value="en_fr">🌐 EN → FR (English First)</option>
                <option value="fr_en">🌐 FR → EN (French First)</option>
                <option value="fr_only">🇫🇷 French Only</option>
                <option value="en_only">🇬🇧 English Only</option>
              </select>
            </div>

            <div className="flex items-center space-x-1 text-gray-400">
              <button
                onClick={() => {
                  const newMode = settings.displayMode === 'shadowing' ? 'normal' : 'shadowing';
                  onUpdateSettings({ ...settings, displayMode: newMode });
                }}
                title="Shadowing Mode (French shown, tap to reveal English)"
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  settings.displayMode === 'shadowing'
                    ? 'bg-blue-100 text-blue-600 font-bold'
                    : 'hover:bg-gray-200 text-gray-500'
                }`}
              >
                <Headphones className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={() => {
                  const newMode = settings.displayMode === 'recall' ? 'normal' : 'recall';
                  onUpdateSettings({ ...settings, displayMode: newMode });
                }}
                title="Active Recall Mode (English shown, tap to reveal French)"
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  settings.displayMode === 'recall'
                    ? 'bg-indigo-100 text-indigo-600 font-bold'
                    : 'hover:bg-gray-200 text-gray-500'
                }`}
              >
                <Lightbulb className="w-4.5 h-4.5" />
              </button>

              <div className="h-4 w-[1px] bg-gray-200 mx-1" />

              <button
                onClick={() =>
                  onUpdateSettings({ ...settings, showTargetText: !settings.showTargetText })
                }
                title="Toggle French Text Visibility"
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  settings.showTargetText
                    ? 'bg-blue-100 text-blue-600 font-bold'
                    : 'hover:bg-gray-200 text-gray-500'
                }`}
              >
                <span className="font-bold text-xs select-none">文A</span>
              </button>

              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as any)}
                className="bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-xs font-bold text-gray-600 focus:outline-none cursor-pointer"
              >
                <option value="all">All</option>
                <option value="unpracticed">Unpracticed</option>
                <option value="favorites">Favorites</option>
              </select>

              <button
                onClick={onOpenSettings}
                className="p-2 hover:bg-gray-200 text-gray-500 hover:text-gray-800 rounded-xl transition-colors cursor-pointer"
                title="Practice Settings"
              >
                <Settings className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Search Bar Strip + Add Sentence Button */}
          <div className="px-4 py-2 bg-white border-b border-gray-100 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search sentences within this island..."
                className="w-full pl-10 pr-4 py-1.5 bg-gray-50 text-gray-800 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <button
              onClick={() => setIsAddingCard(!isAddingCard)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Sentence</span>
            </button>
          </div>

          {/* Quick Add Sentence Form */}
          {isAddingCard && (
            <form
              onSubmit={handleCreateNewTile}
              className="m-4 p-4 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-3 animate-fadeIn"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                  Add New Sentence Tile
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingCard(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <input
                  type="text"
                  value={newTargetText}
                  onChange={(e) => setNewTargetText(e.target.value)}
                  placeholder="French phrase (e.g., Comment puis-je vous aider ?)"
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  required
                />
              </div>

              <div>
                <input
                  type="text"
                  value={newNativeText}
                  onChange={(e) => setNewNativeText(e.target.value)}
                  placeholder="English translation (leave empty to auto-translate)"
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCard(false)}
                  className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTranslatingNewCard}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isTranslatingNewCard ? 'Translating...' : 'Save Card'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Card List */}
          <div className="p-5 space-y-3.5 overflow-y-auto max-h-[700px] flex-1 bg-[#F8FAFC]">
            {activeSentences.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-gray-200">
                <p className="text-gray-500 font-medium text-sm">
                  {searchFilter ? 'No sentences match your search.' : 'No sentences in this island yet. Click "Add Sentence" above!'}
                </p>
              </div>
            ) : (
              activeSentences.map((sentence, index) => {
                const isSelected = selectedIds.includes(sentence.id);
                const isCurrentlyPlaying =
                  isPlaying && playbackQueue[currentQueueIndex]?.id === sentence.id;
                const activeRepInfo = `Rep ${activeRepCounter + 1}/${settings.repetitionCount}`;

                return (
                  <SentenceCard
                    key={sentence.id}
                    sentence={sentence}
                    index={index}
                    isSelected={isSelected}
                    isCurrentlyPlaying={isCurrentlyPlaying}
                    activeRepInfo={activeRepInfo}
                    displayMode={settings.displayMode}
                    showTargetText={settings.showTargetText}
                    textSize={settings.textSize}
                    onToggleSelect={handleToggleSelect}
                    onSpeak={handleSpeakSingleCard}
                    onRate={handleRateSentence}
                    onToggleFavorite={handleToggleFavorite}
                    onDeleteSentence={handleDeleteSingleSentence}
                    onTranslateSentence={handleTranslateSingleSentence}
                  />
                );
              })
            )}
          </div>
        </section>

        {/* Right Sidebar (Matching Reference Cards Exactly) */}
        <aside className="w-full lg:w-[340px] bg-[#F8FAFC] p-5 space-y-4 shrink-0 border-t lg:border-t-0 border-gray-100 overflow-y-auto max-h-[800px]">
          {/* Timeframe Toggle + Stats Box */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80">
            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
              <button
                onClick={() => setTimeframe('session')}
                className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeframe === 'session'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeframe('lifetime')}
                className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeframe === 'lifetime'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                All-time
              </button>
            </div>

            <div className="grid grid-cols-3 divide-x divide-gray-100 text-center py-1">
              <div>
                <p className="text-base font-extrabold text-gray-900">{practicedInIsland}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">PRACTICED</p>
              </div>
              <div>
                <p className="text-base font-extrabold text-blue-600">
                  {timeframe === 'session' ? sessionReps : totalRepsInIsland}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">REPS</p>
              </div>
              <div>
                <p className="text-base font-extrabold text-emerald-600">{masteredInIsland}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">MASTERED</p>
              </div>
            </div>

            <button
              onClick={() => setTimeframe(timeframe === 'session' ? 'lifetime' : 'session')}
              className="mt-4 w-full pt-3 border-t border-gray-100 text-xs font-bold text-gray-600 hover:text-blue-600 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span>📊</span> Track your progress
              </span>
              <span>→</span>
            </button>
          </div>

          {/* TLDR Reference Feature Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-blue-200/80">
            <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-[11px] uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>TLDR</span>
            </div>
            <h4 className="font-bold text-gray-900 text-sm mb-3">Max Results, Minimum Time:</h4>
            <ul className="space-y-2 text-xs text-gray-600 leading-relaxed font-medium">
              <li className="flex items-start gap-2">
                <Headphones className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span><strong>Shadow:</strong> Listen, pause, and repeat until fluent. Rate with stars.</span>
              </li>
              <li className="flex items-start gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <span><strong>Recall:</strong> Translate aloud from your native language. Rate with stars.</span>
              </li>
              <li className="flex items-start gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                <span><strong>Focus:</strong> Use Filters and Collections to group specific sentences.</span>
              </li>
            </ul>
          </div>

          {/* TECHNIQUE Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">TECHNIQUE</span>
                <h4 className="font-bold text-gray-900 text-sm">Shadowing & Repetition</h4>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-normal">
              Match native cadence and intonation by listening and repeating entire sentences aloud. Even 5–10 minutes of daily shadowing builds fluency remarkably fast.
            </p>
          </div>

          {/* BEST PRACTICE Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-amber-200/80 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">BEST PRACTICE</span>
                <h4 className="font-bold text-gray-900 text-sm">Active Recall</h4>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-normal">
              Translate sentences aloud from your native language into French, then check corrections and repeat until you make zero mistakes.
            </p>
          </div>

          {/* POWER FEATURE Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-teal-200/80 border-l-4 border-l-teal-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">POWER FEATURE</span>
                <h4 className="font-bold text-gray-900 text-sm">Save to Your Collection</h4>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-normal">
              Bookmark sentences or double-click to isolate them into your custom practice loop.
            </p>
          </div>
        </aside>
      </div>

      {/* Floating Selection Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[600px] bg-[#111625] text-white py-3 px-6 rounded-full flex items-center justify-between shadow-2xl border border-white/10 z-50 animate-fadeIn">
          <p className="text-sm font-medium">
            <span className="text-blue-400 font-bold">{selectedIds.length}</span> sentences selected
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleAutoPlay}
              className="bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <span>▶</span> Play Selection
            </button>
            <button
              onClick={handleSaveSubBatch}
              className="bg-gray-800 hover:bg-gray-700 px-4 py-1.5 rounded-full text-xs font-bold transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors text-white"
              title="Clear Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
