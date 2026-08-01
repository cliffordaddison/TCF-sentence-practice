import React, { useState, useEffect, useRef } from 'react';
import { Island, Sentence, UserSettings, LanguageMode, DisplayMode, getSentenceRating } from '../types';
import { SentenceCard } from './SentenceCard';
import { ttsService } from '../services/tts';
import { translateToEnglish } from '../services/translator';
import {
  ArrowLeft,
  Search,
  Settings,
  Bookmark,
  Headphones,
  Lightbulb,
  Sparkles,
  X,
  SlidersHorizontal,
  Plus,
  Trash2,
  Star,
  Play,
  Pause,
  Languages,
} from 'lucide-react';
import { loadIslandPracticeState, saveIslandPracticeState } from '../services/storage';
import { audioSession } from '../services/audioSession';

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
  const [playbackAnchorId, setPlaybackAnchorId] = useState<string | null>(null);
  const [activeRepCounter, setActiveRepCounter] = useState<number>(0);
  const [searchFilter, setSearchFilter] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'favorites' | 'unpracticed'>('all');
  const [timeframe, setTimeframe] = useState<'session' | 'lifetime'>('session');
  const [sessionReps, setSessionReps] = useState(0);
  const [selectionMode, setSelectionMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isRatingsOpen, setIsRatingsOpen] = useState(false);
  const [ratingsTab, setRatingsTab] = useState<'filter' | 'rate-all'>('filter');
  const [ratingsFilter, setRatingsFilter] = useState<'all' | 'unrated'>('all');
  const [ratingCriteria, setRatingCriteria] = useState<{
    minimum?: number;
    maximum?: number;
    exact?: number;
  }>({});
  const [rateAllSelection, setRateAllSelection] = useState<number | null>(null);

  // Quick Add Tile state
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newTargetText, setNewTargetText] = useState('');
  const [newNativeText, setNewNativeText] = useState('');
  const [isTranslatingNewCard, setIsTranslatingNewCard] = useState(false);

  const isAutoPlayLoopingRef = useRef(false);

  useEffect(() => {
    const savedState = loadIslandPracticeState(island.id);
    if (savedState) {
      onUpdateSettings({ ...settings, displayMode: savedState.displayMode });
      setCurrentQueueIndex(Math.max(0, Math.min(savedState.currentIndex, island.sentences.length - 1)));
      if (savedState.anchorId) {
        setPlaybackAnchorId(savedState.anchorId);
      }
      if (savedState.selectedIds && savedState.selectedIds.length > 0) {
        setSelectedIds(savedState.selectedIds);
        setSelectionMode(true);
      }
    }
  }, [island.id]);

  useEffect(() => {
    saveIslandPracticeState(island.id, {
      displayMode: settings.displayMode,
      currentIndex: Math.max(0, currentQueueIndex),
      anchorId: playbackAnchorId,
      selectedIds,
    });
  }, [island.id, settings.displayMode, currentQueueIndex, playbackAnchorId, selectedIds]);

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

  const applyRatingsFilter = (sentence: Sentence) => {
    const modeRating = getSentenceRating(sentence, settings.displayMode);
    if (ratingsFilter === 'unrated') {
      if (modeRating > 0) return false;
    }
    if (ratingCriteria.minimum !== undefined && modeRating < ratingCriteria.minimum) {
      return false;
    }
    if (ratingCriteria.maximum !== undefined && modeRating > ratingCriteria.maximum) {
      return false;
    }
    if (ratingCriteria.exact !== undefined && modeRating !== ratingCriteria.exact) {
      return false;
    }
    return true;
  };

  activeSentences = activeSentences.filter(applyRatingsFilter);

  // Sort queue according to setting
  if (settings.sortOrder === 'easy_hard') {
    activeSentences = [...activeSentences].sort(
      (a, b) => getSentenceRating(a, settings.displayMode) - getSentenceRating(b, settings.displayMode)
    );
  } else if (settings.sortOrder === 'hard_easy') {
    activeSentences = [...activeSentences].sort(
      (a, b) => getSentenceRating(b, settings.displayMode) - getSentenceRating(a, settings.displayMode)
    );
  }

  // Queue to play: if sub-batch selected, play sub-batch! Otherwise play all active sentences
  const selectedSentences = activeSentences.filter((s) => selectedIds.includes(s.id));

  const playbackQueue =
    selectedIds.length > 0 && selectedSentences.length > 0
      ? selectedSentences
      : activeSentences;

  const visibleSentences =
    selectionMode && selectedIds.length > 0 && selectedSentences.length > 0
      ? selectedSentences
      : activeSentences;

  const getQueueStartIndex = (queue: Sentence[]) => {
    if (!playbackAnchorId) return 0;
    const anchorIndex = queue.findIndex((sentence) => sentence.id === playbackAnchorId);
    return anchorIndex >= 0 ? anchorIndex : 0;
  };

  const handleHighlightSentence = (id: string) => {
    setPlaybackAnchorId(id);
    const queue = playbackQueue;
    const anchorIndex = queue.findIndex((sentence) => sentence.id === id);
    if (anchorIndex >= 0) {
      queueIndexRef.current = anchorIndex;
      setCurrentQueueIndex(anchorIndex);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const isSelected = prev.includes(id);
      const next = isSelected ? prev.filter((item) => item !== id) : [...prev, id];
      if (next.length === 0) {
        setSelectionMode(false);
      }
      return next;
    });
    setPlaybackAnchorId(id);
  };

  const handleCardDoubleClick = (id: string) => {
    setSelectionMode(true);
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setPlaybackAnchorId(id);
  };

  const handleSpeakSingleCard = async (sentence: Sentence) => {
    onRecordRepetition();
    setSessionReps((prev) => prev + 1);

    const updated = { ...sentence, reps: (sentence.reps || 0) + 1, practiced: true };
    onUpdateSentence(island.id, updated);

    await ttsService.speakSentence(sentence, {
      languageMode: settings.languageMode,
      playbackSpeed: settings.playbackSpeed,
      targetVoiceURI: settings.targetVoiceURI,
      nativeVoiceURI: settings.nativeVoiceURI,
      targetVoiceGender: settings.targetVoiceGender,
      nativeVoiceGender: settings.nativeVoiceGender,
    });
  };

  const handleRateSentence = (sentenceId: string, rating: number) => {
    const original = island.sentences.find((s) => s.id === sentenceId);
    if (!original) return;

    const isRecall = settings.displayMode === 'recall';
    const currentRating = getSentenceRating(original, settings.displayMode);
    const nextRating = currentRating === rating ? 0 : rating;

    let updated: Sentence;
    if (isRecall) {
      const shadowingRating = original.shadowingRating !== undefined ? original.shadowingRating : (original.rating || 0);
      const shadowingMastered = original.shadowingMastered !== undefined ? original.shadowingMastered : (original.mastered || shadowingRating === 5);
      updated = {
        ...original,
        recallRating: nextRating,
        recallMastered: nextRating === 5,
        rating: Math.max(shadowingRating, nextRating),
        mastered: shadowingMastered || nextRating === 5,
      };
    } else {
      const recallRating = original.recallRating !== undefined ? original.recallRating : 0;
      const recallMastered = original.recallMastered !== undefined ? original.recallMastered : false;
      updated = {
        ...original,
        shadowingRating: nextRating,
        shadowingMastered: nextRating === 5,
        rating: Math.max(nextRating, recallRating),
        mastered: nextRating === 5 || recallMastered,
      };
    }
    onUpdateSentence(island.id, updated);
  };

  const handleApplyBulkRating = () => {
    if (rateAllSelection === null) return;
    const visibleIds = activeSentences.map((sentence) => sentence.id);
    const isRecall = settings.displayMode === 'recall';

    visibleIds.forEach((id) => {
      const original = island.sentences.find((s) => s.id === id);
      if (!original) return;

      let updated: Sentence;
      if (isRecall) {
        const shadowingRating = original.shadowingRating !== undefined ? original.shadowingRating : (original.rating || 0);
        const shadowingMastered = original.shadowingMastered !== undefined ? original.shadowingMastered : (original.mastered || shadowingRating === 5);
        updated = {
          ...original,
          recallRating: rateAllSelection,
          recallMastered: rateAllSelection === 5,
          rating: Math.max(shadowingRating, rateAllSelection),
          mastered: shadowingMastered || rateAllSelection === 5,
        };
      } else {
        const recallRating = original.recallRating !== undefined ? original.recallRating : 0;
        const recallMastered = original.recallMastered !== undefined ? original.recallMastered : false;
        updated = {
          ...original,
          shadowingRating: rateAllSelection,
          shadowingMastered: rateAllSelection === 5,
          rating: Math.max(rateAllSelection, recallRating),
          mastered: rateAllSelection === 5 || recallMastered,
        };
      }
      onUpdateSentence(island.id, updated);
    });
    setIsRatingsOpen(false);
    setRateAllSelection(null);
  };

  const handleClearVisibleRatings = () => {
    const visibleIds = activeSentences.map((sentence) => sentence.id);
    const isRecall = settings.displayMode === 'recall';

    visibleIds.forEach((id) => {
      const original = island.sentences.find((s) => s.id === id);
      if (!original) return;

      let updated: Sentence;
      if (isRecall) {
        const shadowingRating = original.shadowingRating !== undefined ? original.shadowingRating : (original.rating || 0);
        const shadowingMastered = original.shadowingMastered !== undefined ? original.shadowingMastered : (original.mastered || shadowingRating === 5);
        updated = {
          ...original,
          recallRating: 0,
          recallMastered: false,
          rating: shadowingRating,
          mastered: shadowingMastered,
        };
      } else {
        const recallRating = original.recallRating !== undefined ? original.recallRating : 0;
        const recallMastered = original.recallMastered !== undefined ? original.recallMastered : false;
        updated = {
          ...original,
          shadowingRating: 0,
          shadowingMastered: false,
          rating: recallRating,
          mastered: recallMastered,
        };
      }
      onUpdateSentence(island.id, updated);
    });
    setIsRatingsOpen(false);
    setRateAllSelection(null);
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
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    queueRef.current = playbackQueue;
  }, [playbackQueue]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    islandRef.current = island;
  }, [island]);

  // Scroll active playing sentence card into view and sync anchor during repping
  useEffect(() => {
    if (isPlaying && playbackQueue[currentQueueIndex]) {
      const activeId = playbackQueue[currentQueueIndex].id;
      setPlaybackAnchorId(activeId);
      const container = cardsContainerRef.current;
      const el = document.getElementById(`sentence-card-${activeId}`);
      if (container && el) {
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        if (elRect.top < containerRect.top || elRect.bottom > containerRect.bottom) {
          const relativeTop = elRect.top - containerRect.top + container.scrollTop;
          const targetScrollTop = relativeTop - container.clientHeight / 2 + elRect.height / 2;
          container.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: 'smooth',
          });
        }
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
        if (idx < 0 || idx >= queue.length) {
          idx = getQueueStartIndex(queue);
          queueIndexRef.current = idx;
          setCurrentQueueIndex(idx);
        }
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

        // Update lockscreen / background notification metadata with current rep sentence
        audioSession.updateMediaSession({
          title: currentSentence.target,
          artist: currentSentence.native,
          album: islandRef.current.name || 'Language Practice',
        });

        // Speak current sentence (English first, French second in en_fr mode)
        await ttsService.speakSentence(currentSentence, {
          languageMode: settingsRef.current.languageMode,
          playbackSpeed: settingsRef.current.playbackSpeed,
          targetVoiceURI: settingsRef.current.targetVoiceURI,
          nativeVoiceURI: settingsRef.current.nativeVoiceURI,
          targetVoiceGender: settingsRef.current.targetVoiceGender,
          nativeVoiceGender: settingsRef.current.nativeVoiceGender,
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
      const activeSentence = playbackQueue[currentQueueIndex];
      audioSession.startSession(
        {
          title: activeSentence ? activeSentence.target : island.name,
          artist: activeSentence ? activeSentence.native : 'Repetition Practice',
          album: island.name,
        },
        {
          onPlay: () => setIsPlaying(true),
          onPause: () => {
            isAutoPlayRef.current = false;
            setIsPlaying(false);
            ttsService.stop();
          },
          onNext: () => {
            const queue = queueRef.current;
            if (!queue || queue.length === 0) return;
            const nextIdx = (queueIndexRef.current + 1) % queue.length;
            queueIndexRef.current = nextIdx;
            setCurrentQueueIndex(nextIdx);
            repCounterRef.current = 0;
            setActiveRepCounter(0);
            ttsService.stop();
          },
          onPrev: () => {
            const queue = queueRef.current;
            if (!queue || queue.length === 0) return;
            const prevIdx = (queueIndexRef.current - 1 + queue.length) % queue.length;
            queueIndexRef.current = prevIdx;
            setCurrentQueueIndex(prevIdx);
            repCounterRef.current = 0;
            setActiveRepCounter(0);
            ttsService.stop();
          },
        }
      );
      startLoop();
    } else {
      isAutoPlayRef.current = false;
      ttsService.stop();
      audioSession.stopSession();
    }

    return () => {
      cancelToken = true;
      isAutoPlayRef.current = false;
      ttsService.stop();
      audioSession.stopSession();
    };
  }, [isPlaying]);

  const toggleAutoPlay = () => {
    if (isPlaying) {
      isAutoPlayRef.current = false;
      setIsPlaying(false);
      ttsService.stop();
      return;
    }

    if (selectedIds.length > 0 && !selectionMode) {
      setSelectionMode(true);
    }

    const queue = playbackQueue;
    const startIndex = getQueueStartIndex(queue);
    queueIndexRef.current = startIndex;
    setCurrentQueueIndex(startIndex);
    if (queue[startIndex]) {
      setPlaybackAnchorId(queue[startIndex].id);
    }
    repCounterRef.current = 0;
    setActiveRepCounter(0);
    setIsPlaying(true);
  };

  const handlePlaySelection = () => {
    if (selectedIds.length === 0) return;
    setSelectionMode(true);
    const queue = selectedSentences.length > 0 ? selectedSentences : activeSentences;
    const startIndex = getQueueStartIndex(queue);
    queueIndexRef.current = startIndex;
    setCurrentQueueIndex(startIndex);
    if (queue[startIndex]) {
      setPlaybackAnchorId(queue[startIndex].id);
    }
    repCounterRef.current = 0;
    setActiveRepCounter(0);
    setIsPlaying(true);
  };

  const handleCloseSelectionSession = () => {
    setSelectionMode(false);
    setSelectedIds([]);
    setPlaybackAnchorId(null);
    setIsPlaying(false);
    ttsService.stop();
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
    <div className="w-full max-w-6xl mx-auto bg-white rounded-xl sm:rounded-[24px] shadow-2xl flex flex-col overflow-hidden border border-gray-100 h-full min-h-0">
      {/* Top Bar Header */}
      <header className="bg-white px-3.5 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex justify-between items-center relative z-10 gap-2 shrink-0">
        <div className="flex items-center space-x-2.5 sm:space-x-4 min-w-0">
          <button
            onClick={onBack}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer text-gray-700 shrink-0"
            title="Back to Topic Islands"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 leading-tight truncate">
              {island.name || 'Sentences'}
            </h2>
            <p className="text-[11px] sm:text-xs font-medium text-gray-400 mt-0.5 truncate">
              {island.description || `${totalInIsland} Questions & Answers`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <span className="text-[10px] sm:text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-blue-100">
            Queue: {playbackQueue.length}/{totalInIsland}
          </span>
          {onDeleteIsland && (
            <button
              onClick={() => {
                if (confirm(`Delete Language Island "${island.name}" and all its contents?`)) {
                  onDeleteIsland(island.id);
                  onBack();
                }
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              title="Delete Language Island"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 h-full">
        {/* Practice Track (Center List) */}
        <section className="flex-1 flex flex-col border-r border-gray-100 min-w-0 min-h-0 h-full overflow-hidden">
          {/* Control Strip matching reference bar */}
          <div className="p-2.5 sm:p-3.5 border-b border-gray-100 bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 shrink-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                onClick={toggleAutoPlay}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl font-bold text-xs shadow-xs flex items-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-600 text-gray-900'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                <span>{isPlaying ? 'Pause' : 'Rep'}</span>
              </button>

              <select
                value={settings.repetitionCount}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, repetitionCount: parseInt(e.target.value) })
                }
                className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none cursor-pointer shadow-xs"
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
                className="bg-white border border-blue-200 rounded-xl sm:rounded-2xl px-2 sm:px-2.5 py-1.5 text-xs font-extrabold text-blue-700 focus:outline-none cursor-pointer shadow-xs hover:border-blue-400 max-w-[130px] sm:max-w-none truncate"
              >
                <option value="en_fr">🌐 EN → FR</option>
                <option value="fr_en">🌐 FR → EN</option>
                <option value="fr_only">🇫🇷 French Only</option>
                <option value="en_only">🇬🇧 English Only</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  const nextGender = settings.targetVoiceGender === 'male' ? 'female' : 'male';
                  const voice = ttsService.getVoiceForGender('fr', nextGender);
                  onUpdateSettings({
                    ...settings,
                    targetVoiceGender: nextGender,
                    targetVoiceURI: voice?.voiceURI || settings.targetVoiceURI,
                  });
                }}
                title="Switch Target Voice Gender (Male / Female)"
                className="bg-white border border-purple-200 hover:border-purple-400 rounded-xl sm:rounded-2xl px-2.5 sm:px-3 py-1.5 text-xs font-bold text-purple-700 flex items-center space-x-1 cursor-pointer shadow-xs transition-colors shrink-0"
              >
                <span>{settings.targetVoiceGender === 'male' ? 'Male' : 'Female'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-1 text-gray-400">
              <button
                onClick={() => {
                  if (settings.displayMode !== 'shadowing') {
                    onUpdateSettings({ ...settings, displayMode: 'shadowing' });
                  }
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
                  if (settings.displayMode !== 'recall') {
                    onUpdateSettings({ ...settings, displayMode: 'recall' });
                  }
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
                <Languages className="w-4.5 h-4.5" />
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
                onClick={() => setIsRatingsOpen(true)}
                className="p-2 hover:bg-gray-200 text-gray-500 hover:text-gray-800 rounded-xl transition-colors cursor-pointer"
                title="Ratings"
              >
                <Star className="w-4.5 h-4.5" />
              </button>

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
          <div className="px-4 py-2 bg-white border-b border-gray-100 flex items-center gap-2 shrink-0">
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
          <div ref={cardsContainerRef} className="p-3.5 sm:p-5 space-y-3.5 overflow-y-auto flex-1 min-h-0 bg-[#F8FAFC]">
            {selectionMode && selectedIds.length > 0 && (
              <div className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl mb-3 flex items-center justify-between shadow-xs animate-fadeIn">
                <span className="text-xs font-bold">
                  ✨ Repping {selectedIds.length} Selected Sentences Only
                </span>
                <button
                  onClick={handleCloseSelectionSession}
                  className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Exit Separate Repping ✕
                </button>
              </div>
            )}

            {visibleSentences.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-gray-200">
                <p className="text-gray-500 font-medium text-sm">
                  {searchFilter ? 'No sentences match your search.' : 'No sentences in this island yet.'}
                </p>
              </div>
            ) : (
              visibleSentences.map((sentence, index) => {
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
                    isAnchor={playbackAnchorId === sentence.id}
                    isCurrentlyPlaying={isCurrentlyPlaying}
                    activeRepInfo={activeRepInfo}
                    displayMode={settings.displayMode}
                    showTargetText={settings.showTargetText}
                    textSize={settings.textSize}
                    isSelectionMode={selectionMode}
                    onHighlightSentence={handleHighlightSentence}
                    onToggleSelect={handleToggleSelect}
                    onDoubleClick={handleCardDoubleClick}
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

        {/* Right Sidebar (Desktop Only) */}
        <aside className="hidden lg:block lg:w-[340px] bg-[#F8FAFC] p-5 space-y-4 shrink-0 border-l border-gray-100 overflow-y-auto max-h-full">
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
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'stats' }));
                }
              }}
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
      {!selectionMode && selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[600px] bg-[#111625] text-white py-3 px-6 rounded-full flex items-center justify-between shadow-2xl border border-white/10 z-50 animate-fadeIn">
          <p className="text-sm font-medium">
            <span className="text-blue-400 font-bold">{selectedIds.length}</span> sentences selected
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePlaySelection}
              className="bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> Play Selection
            </button>
            <button
              onClick={handleSaveSubBatch}
              className="bg-gray-800 hover:bg-gray-700 px-4 py-1.5 rounded-full text-xs font-bold transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setSelectedIds([]);
                setSelectionMode(false);
              }}
              className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors text-white"
              title="Clear Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isRatingsOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl border border-gray-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <Star className="h-6 w-6 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Ratings</h3>
                  <p className="text-sm text-gray-500">Filter the list, or rate every sentence at once</p>
                </div>
              </div>
              <button
                onClick={() => setIsRatingsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100"
                title="Close ratings"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex rounded-full bg-gray-100 p-1">
              <button
                onClick={() => setRatingsTab('filter')}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${ratingsTab === 'filter' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                Filter
              </button>
              <button
                onClick={() => setRatingsTab('rate-all')}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${ratingsTab === 'rate-all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                Rate all
              </button>
            </div>

            {ratingsTab === 'filter' ? (
              <div className="mt-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setRatingsFilter('all')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${ratingsFilter === 'all' ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-white text-gray-600'}`}
                  >
                    All Ratings
                  </button>
                  <button
                    onClick={() => setRatingsFilter('unrated')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${ratingsFilter === 'unrated' ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-white text-gray-600'}`}
                  >
                    Unrated
                  </button>
                </div>
                <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Minimum rating (≥)</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[5,4,3,2,1].map((value) => {
                        const colorClass = value >= 4 ? 'text-emerald-600' : value === 3 ? 'text-amber-600' : 'text-rose-600';
                        return (
                          <button
                            key={value}
                            onClick={() => setRatingCriteria((prev) => ({ ...prev, minimum: value }))}
                            className={`rounded-full px-3 py-2 text-sm font-semibold ${ratingCriteria.minimum === value ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
                          >
                            <span className={`inline-flex items-center gap-1 ${ratingCriteria.minimum === value ? 'text-white' : colorClass}`}>
                              <Star className="h-3.5 w-3.5 fill-current" />
                              {value}+ 
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Maximum rating (≤)</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[4,3,2,1].map((value) => {
                        const colorClass = value >= 4 ? 'text-emerald-600' : value === 3 ? 'text-amber-600' : 'text-rose-600';
                        return (
                          <button
                            key={value}
                            onClick={() => setRatingCriteria((prev) => ({ ...prev, maximum: value }))}
                            className={`rounded-full px-3 py-2 text-sm font-semibold ${ratingCriteria.maximum === value ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
                          >
                            <span className={`inline-flex items-center gap-1 ${ratingCriteria.maximum === value ? 'text-white' : colorClass}`}>
                              <Star className="h-3.5 w-3.5 fill-current" />
                              {value}-
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Exact rating (=)</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[4,3,2,1].map((value) => {
                        const colorClass = value >= 4 ? 'text-emerald-600' : value === 3 ? 'text-amber-600' : 'text-rose-600';
                        return (
                          <button
                            key={value}
                            onClick={() => setRatingCriteria((prev) => ({ ...prev, exact: value }))}
                            className={`rounded-full px-3 py-2 text-sm font-semibold ${ratingCriteria.exact === value ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
                          >
                            <span className={`inline-flex items-center gap-1 ${ratingCriteria.exact === value ? 'text-white' : colorClass}`}>
                              <Star className="h-3.5 w-3.5 fill-current" />
                              Exactly {value}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                <p className="text-center text-sm text-gray-500">Apply one rating to all visible sentences</p>
                <div className="flex justify-center gap-2">
                  {[1,2,3,4,5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setRateAllSelection(value)}
                      className="rounded-full border border-gray-200 bg-white p-3 text-amber-400 hover:text-amber-500"
                    >
                      <Star className={`h-8 w-8 ${rateAllSelection !== null && value <= rateAllSelection ? 'fill-amber-400' : 'fill-none'}`} />
                    </button>
                  ))}
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={handleClearVisibleRatings}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
                  >
                    <X className="h-4 w-4" />
                    Clear ratings
                  </button>
                </div>
                <p className="text-center text-sm text-gray-500">Applies to all {activeSentences.length} · {island.name}</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsRatingsOpen(false)}
                    className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyBulkRating}
                    disabled={rateAllSelection === null}
                    className={`rounded-full px-5 py-2.5 text-sm font-semibold ${rateAllSelection === null ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white'}`}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
