export type LanguageMode = 'en_fr' | 'fr_en' | 'fr_only' | 'en_only';

export type TextScale = 'sm' | 'md' | 'lg' | 'xl';

export type SortOrder = 'original' | 'easy_hard' | 'hard_easy' | 'random';

export interface Sentence {
  id: string;
  target: string; // Target text (e.g. English or French)
  native: string; // Translation text
  rating: number; // 0 to 5 stars
  reps: number; // Count of audio plays / practice cycles
  practiced: boolean; // Has been practiced at least once
  mastered: boolean; // True when rating === 5
  isFavorite?: boolean;
}

export interface Island {
  id: string;
  name: string;
  description: string;
  category?: string;
  iconName?: string;
  sentences: Sentence[];
  createdAt: number;
}

// 'normal' = default view (both texts visible)
// 'shadowing' = Headphones mode: shows French (target), tap to reveal English (native)
// 'recall' = Lightbulb mode: shows English (native), tap to reveal French (target)
export type DisplayMode = 'normal' | 'shadowing' | 'recall';

export interface UserSettings {
  repetitionCount: number; // 1, 2, 3, 4, 5
  pauseDuration: number; // e.g. 0.5, 1, 2, 3, 5, 7 seconds
  playbackSpeed: number; // e.g. 0.5, 0.8, 1.0, 1.2, 1.5, 2.0
  textSize: TextScale;
  languageMode: LanguageMode;
  targetVoiceURI: string;
  nativeVoiceURI: string;
  sortOrder: SortOrder;
  loopPlayback: boolean;
  displayMode: DisplayMode; // replaces activeRecallMode
  showTargetText: boolean;
}

export interface PracticeSessionState {
  displayMode: DisplayMode;
  currentIndex: number;
  anchorId?: string | null;
  selectedIds?: string[];
}

export interface DailyStat {
  reps: number;
  sentencesTouched: number;
  timeSeconds: number;
}

export interface UserStats {
  totalReps: number;
  totalTimeSeconds: number;
  dailyStats: Record<string, DailyStat>; // Keyed by YYYY-MM-DD
}

export type ViewMode = 'collections' | 'practice' | 'stats' | 'import';
