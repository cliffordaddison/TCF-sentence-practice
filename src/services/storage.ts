import { Island, UserSettings, UserStats } from '../types';

const STORAGE_KEYS = {
  ISLANDS: 'tcf_trainer_islands_v1',
  SETTINGS: 'tcf_trainer_settings_v1',
  STATS: 'tcf_trainer_stats_v1',
  ACTIVE_ISLAND_ID: 'tcf_trainer_active_island_v1',
};

export const DEFAULT_SETTINGS: UserSettings = {
  repetitionCount: 1,
  pauseDuration: 0.5,
  playbackSpeed: 1.0,
  textSize: 'md',
  languageMode: 'en_fr',
  targetVoiceURI: '',
  nativeVoiceURI: '',
  sortOrder: 'original',
  loopPlayback: true,
  displayMode: 'normal',
  showTargetText: true,
};

export const DEFAULT_STATS: UserStats = {
  totalReps: 0,
  totalTimeSeconds: 0,
  dailyStats: {},
};

export const DEFAULT_ISLANDS: Island[] = [
  {
    id: 'island-everyday-greetings',
    name: 'Everyday Expressions & TCF Greetings',
    description: 'Essential polite phrases, daily greetings, and conversational starters.',
    category: 'A1 Basics',
    iconName: 'MessageSquare',
    createdAt: Date.now() - 10000,
    sentences: [
      { id: 's-1-1', target: 'Bonjour, comment allez-vous aujourd\'hui ?', native: 'Hello, how are you doing today?', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-1-2', target: 'Je vais très bien, merci beaucoup !', native: 'I am doing very well, thank you very much!', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-1-3', target: 'Enchanté de faire votre connaissance.', native: 'Pleased to meet you.', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-1-4', target: 'Excusez-moi, pourriez-vous m\'aider s\'il vous plaît ?', native: 'Excuse me, could you help me please?', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-1-5', target: 'Je ne comprends pas très bien ce que vous dites.', native: 'I do not understand very well what you are saying.', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-1-6', target: 'Pourriez-vous parler un peu plus lentement ?', native: 'Could you speak a bit more slowly?', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-1-7', target: 'Passez une excellente journée !', native: 'Have a wonderful day!', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-1-8', target: 'À bientôt et merci pour votre aide.', native: 'See you soon and thanks for your help.', rating: 0, reps: 0, practiced: false, mastered: false },
    ],
  },
  {
    id: 'island-restaurant-dining',
    name: 'Ordering at a Restaurant & Cafés',
    description: 'Key phrases for reserving tables, ordering meals, asking for recommendations, and the bill.',
    category: 'Practical Life',
    iconName: 'Utensils',
    createdAt: Date.now() - 8000,
    sentences: [
      { id: 's-2-1', target: 'Avez-vous une table libre pour deux personnes ?', native: 'Do you have a free table for two people?', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-2-2', target: 'Je voudrais réserver une table pour ce soir à vingt heures.', native: 'I would like to book a table for tonight at 8 PM.', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-2-3', target: 'Pourrions-nous avoir la carte des menus, s\'il vous plaît ?', native: 'Could we have the menu, please?', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-2-4', target: 'Qu\'est-ce que vous nous recommandez aujourd\'hui ?', native: 'What do you recommend for us today?', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-2-5', target: 'Je prendrai le plat du jour avec un verre de eau.', native: 'I will take the dish of the day with a glass of water.', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-2-6', target: 'Est-ce que ce plat contient du gluten ou des produits laitiers ?', native: 'Does this dish contain gluten or dairy products?', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-2-7', target: 'Tout était vraiment délicieux, félicitations au chef !', native: 'Everything was really delicious, compliments to the chef!', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-2-8', target: 'L\'addition, s\'il vous plaît. Est-ce qu\'on peut payer par carte ?', native: 'The check, please. Can we pay by card?', rating: 0, reps: 0, practiced: false, mastered: false },
    ],
  },
  {
    id: 'island-travel-directions',
    name: 'Travel, Transportation & Directions',
    description: 'Navigating cities, asking for locations, buying train tickets, and hotel check-in.',
    category: 'Travel & Mobility',
    iconName: 'Compass',
    createdAt: Date.now() - 6000,
    sentences: [
      { id: 's-3-1', target: 'Où se trouve la station de métro la plus proche ?', native: 'Where is the nearest subway station?', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-3-2', target: 'Pour aller au centre-ville, faut-il prendre le bus ou le tramway ?', native: 'To go downtown, should I take the bus or the tram?', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-3-3', target: 'Allez tout droit, puis tournez à gauche au deuxième feu.', native: 'Go straight ahead, then turn left at the second traffic light.', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-3-4', target: 'Combien coûte un billet aller-retour pour Paris ?', native: 'How much is a round-trip ticket to Paris?', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-3-5', target: 'À quelle heure part le prochain train pour Lyon ?', native: 'What time does the next train to Lyon leave?', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-3-6', target: 'J\'ai une réservation d\'hôtel sous le nom de Smith.', native: 'I have a hotel reservation under the name of Smith.', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-3-7', target: 'Est-ce que le petit-déjeuner est inclus dans le prix de la chambre ?', native: 'Is breakfast included in the room price?', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-3-8', target: 'Pouvez-vous me montrer cet endroit sur la carte ?', native: 'Can you show me this place on the map?', rating: 0, reps: 0, practiced: false, mastered: false },
    ],
  },
  {
    id: 'island-tcf-exam-expression',
    name: 'TCF Exam High-Frequency Sentences',
    description: 'Complex sentences for TCF Canada & Tout Public oral expression and listening comprehension.',
    category: 'TCF Exam Prep',
    iconName: 'GraduationCap',
    createdAt: Date.now() - 4000,
    sentences: [
      { id: 's-4-1', target: 'À mon avis, le travail à distance présente de nombreux avantages.', native: 'In my opinion, remote work offers many advantages.', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-4-2', target: 'Il est essentiel de protéger l\'environnement pour les générations futures.', native: 'It is essential to protect the environment for future generations.', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-4-3', target: 'Bien que ce projet soit ambitieux, il reste tout à fait réalisable.', native: 'Although this project is ambitious, it remains completely feasible.', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-4-4', target: 'Je suis convaincu que l\'apprentissage d\'une langue enrichit l\'esprit.', native: 'I am convinced that learning a language enriches the mind.', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-4-5', target: 'Pour quelles raisons avez-vous décidé de vous installer au Canada ?', native: 'For what reasons did you decide to move to Canada?', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-4-6', target: 'Même si les avis divergent, il convient de trouver un compromis.', native: 'Even if opinions differ, a compromise should be reached.', rating: 0, reps: 0, practiced: false, mastered: false },
      { id: 's-4-7', target: 'En conclusion, cette initiative apportera des changements positifs.', native: 'In conclusion, this initiative will bring about positive changes.', rating: 0, reps: 0, practiced: false, mastered: false },
    ],
  },
];

export function loadIslands(): Island[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ISLANDS);
    if (!data) {
      const defaults = getDefaultIslands();
      saveIslands(defaults);
      return defaults;
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    const defaults = getDefaultIslands();
    saveIslands(defaults);
    return defaults;
  } catch (err) {
    console.error('Failed to load islands:', err);
    return getDefaultIslands();
  }
}

export function saveIslands(islands: Island[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ISLANDS, JSON.stringify(islands));
  } catch (err) {
    console.error('Failed to save islands:', err);
  }
}

export function loadUserSettings(): UserSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(data);
    // Migrate old activeRecallMode to new displayMode
    if ('activeRecallMode' in parsed && !('displayMode' in parsed)) {
      parsed.displayMode = parsed.activeRecallMode ? 'recall' : 'normal';
      delete parsed.activeRecallMode;
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (err) {
    console.error('Failed to load settings:', err);
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveUserSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function loadUserStats(): UserStats {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!data) return { ...DEFAULT_STATS, dailyStats: {} };
    return { ...DEFAULT_STATS, ...JSON.parse(data) };
  } catch (err) {
    console.error('Failed to load stats:', err);
    return { ...DEFAULT_STATS, dailyStats: {} };
  }
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save stats:', err);
  }
}

export function loadActiveIslandId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_ISLAND_ID);
}

export function saveActiveIslandId(id: string): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_ISLAND_ID, id);
}

export function recordRepetition(timeAddedSeconds = 3): void {
  const stats = loadUserStats();
  const today = new Date().toISOString().split('T')[0];

  const currentDaily = stats.dailyStats[today] || { reps: 0, sentencesTouched: 0, timeSeconds: 0 };

  stats.totalReps += 1;
  stats.totalTimeSeconds += timeAddedSeconds;

  stats.dailyStats[today] = {
    reps: currentDaily.reps + 1,
    sentencesTouched: currentDaily.sentencesTouched,
    timeSeconds: currentDaily.timeSeconds + timeAddedSeconds,
  };

  saveUserStats(stats);
}

export function getDefaultIslands(): Island[] {
  // Deep clone and assign fresh timestamps so defaults are truly independent
  const cloned: Island[] = JSON.parse(JSON.stringify(DEFAULT_ISLANDS));
  const now = Date.now();
  cloned.forEach((island, idx) => {
    island.createdAt = now - (cloned.length - idx) * 1000;
    island.sentences.forEach((s) => {
      s.rating = 0;
      s.reps = 0;
      s.practiced = false;
      s.mastered = false;
      s.isFavorite = false;
    });
  });
  return cloned;
}

export function getDefaultSettings(): UserSettings {
  return { ...DEFAULT_SETTINGS };
}

export function getDefaultStats(): UserStats {
  return { totalReps: 0, totalTimeSeconds: 0, dailyStats: {} };
}

export function hardResetAllData(): void {
  // Remove all app keys explicitly first
  try {
    localStorage.removeItem(STORAGE_KEYS.ISLANDS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.STATS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ISLAND_ID);
  } catch (_) { /* ignore */ }

  // Also try full clear as backup
  try {
    localStorage.clear();
  } catch (_) { /* ignore */ }

  // Save fresh defaults
  const defaults = getDefaultIslands();
  const freshSettings = getDefaultSettings();
  const freshStats = getDefaultStats();
  saveIslands(defaults);
  saveUserSettings(freshSettings);
  saveUserStats(freshStats);
  saveActiveIslandId(defaults[0].id);
}
