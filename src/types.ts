export type LanguageMode = 'en_fr' | 'fr_en' | 'fr_only' | 'en_only';

export type TextScale = 'sm' | 'md' | 'lg' | 'xl';

export type SortOrder = 'original' | 'easy_hard' | 'hard_easy' | 'random';

export interface Sentence {
  id: string;
  target: string; // Target text (e.g. English or French)
  native: string; // Translation text
  rating: number; // Legacy rating fallback
  shadowingRating?: number; // 0 to 5 stars for Comprehension / Shadowing track
  recallRating?: number; // 0 to 5 stars for Speaking / Active Recall track
  reps: number; // Count of audio plays / practice cycles
  practiced: boolean; // Has been practiced at least once
  mastered: boolean; // Legacy mastered
  shadowingMastered?: boolean; // True when shadowingRating === 5
  recallMastered?: boolean; // True when recallRating === 5
  isFavorite?: boolean;
}

export function getSentenceRating(sentence: Sentence, mode: DisplayMode): number {
  if (mode === 'recall') {
    return sentence.recallRating !== undefined ? sentence.recallRating : 0;
  }
  return sentence.shadowingRating !== undefined
    ? sentence.shadowingRating
    : (sentence.rating || 0);
}

export function isSentenceMastered(sentence: Sentence, mode: DisplayMode): boolean {
  if (mode === 'recall') {
    return sentence.recallMastered !== undefined ? sentence.recallMastered : false;
  }
  return sentence.shadowingMastered !== undefined
    ? sentence.shadowingMastered
    : (sentence.mastered || sentence.rating === 5);
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

export type VoiceGenderPreference = 'male' | 'female';

export interface UserSettings {
  repetitionCount: number; // 1, 2, 3, 4, 5
  pauseDuration: number; // e.g. 0.5, 1, 2, 3, 5, 7 seconds
  playbackSpeed: number; // e.g. 0.5, 0.8, 1.0, 1.2, 1.5, 2.0
  textSize: TextScale;
  languageMode: LanguageMode;
  targetVoiceURI: string;
  nativeVoiceURI: string;
  /** Preferred French voice gender (Android often needs pitch when no male pack is exposed) */
  targetVoiceGender: VoiceGenderPreference;
  /** Preferred English voice gender */
  nativeVoiceGender: VoiceGenderPreference;
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
