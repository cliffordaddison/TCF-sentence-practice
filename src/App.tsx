import React, { useState, useEffect } from 'react';
import { Island, Sentence, UserSettings, UserStats, ViewMode } from './types';
import {
  loadIslands,
  saveIslands,
  loadUserSettings,
  saveUserSettings,
  loadUserStats,
  saveUserStats,
  loadActiveIslandId,
  saveActiveIslandId,
  recordRepetition,
  hardResetAllData,
  getDefaultIslands,
  getDefaultSettings,
  getDefaultStats,
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
} from './services/storage';
import { ttsService } from './services/tts';

import { Sidebar } from './components/Sidebar';
import { CollectionsView } from './components/CollectionsView';
import { PracticeView } from './components/PracticeView';
import { StatsView } from './components/StatsView';
import { ImportModal } from './components/ImportModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [islands, setIslands] = useState<Island[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [activeIslandId, setActiveIslandId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('collections');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    const loadedIslands = loadIslands();
    const loadedSettings = loadUserSettings();
    const loadedStats = loadUserStats();
    const savedActiveId = loadActiveIslandId();

    setIslands(loadedIslands);
    setSettings(loadedSettings);
    setStats(loadedStats);

    if (savedActiveId && loadedIslands.some((i) => i.id === savedActiveId)) {
      setActiveIslandId(savedActiveId);
    } else if (loadedIslands.length > 0) {
      setActiveIslandId(loadedIslands[0].id);
    }
  }, []);

  // Save changes to localStorage
  const handleUpdateIslands = (updatedIslands: Island[]) => {
    setIslands(updatedIslands);
    saveIslands(updatedIslands);
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveUserSettings(newSettings);
  };

  const handleSelectIsland = (island: Island) => {
    setActiveIslandId(island.id);
    saveActiveIslandId(island.id);
    setCurrentView('practice');
  };

  const handleUpdateSentence = (islandId: string, updatedSentence: Sentence) => {
    const nextIslands = islands.map((island) => {
      if (island.id !== islandId) return island;
      const updatedSentences = island.sentences.map((s) =>
        s.id === updatedSentence.id ? updatedSentence : s
      );
      return { ...island, sentences: updatedSentences };
    });
    handleUpdateIslands(nextIslands);
    setStats(loadUserStats());
  };

  const handleDeleteSentence = (islandId: string, sentenceId: string) => {
    const nextIslands = islands.map((island) => {
      if (island.id !== islandId) return island;
      return {
        ...island,
        sentences: island.sentences.filter((s) => s.id !== sentenceId),
      };
    });
    handleUpdateIslands(nextIslands);
  };

  const handleAddSentence = (islandId: string, target: string, native: string) => {
    const newSentence: Sentence = {
      id: `s-added-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      target,
      native,
      rating: 0,
      reps: 0,
      practiced: false,
      mastered: false,
    };
    const nextIslands = islands.map((island) => {
      if (island.id !== islandId) return island;
      return {
        ...island,
        sentences: [...island.sentences, newSentence],
      };
    });
    handleUpdateIslands(nextIslands);
  };

  const handleImportIslands = (newIslands: Island[]) => {
    const nextIslands = [...newIslands, ...islands];
    handleUpdateIslands(nextIslands);
    if (newIslands.length > 0) {
      handleSelectIsland(newIslands[0]);
    }
  };

  const handleSaveSubBatchIsland = (name: string, sentences: Sentence[]) => {
    const newIsland: Island = {
      id: `island-sub-${Date.now()}`,
      name,
      description: `Custom sub-batch selection (${sentences.length} sentences)`,
      category: 'Sub-Batch',
      iconName: 'Bookmark',
      createdAt: Date.now(),
      sentences: sentences.map((s) => ({ ...s, id: `s-sub-${Date.now()}-${Math.random()}` })),
    };
    handleImportIslands([newIsland]);
  };

  const handleDeleteIsland = (islandId: string) => {
    const nextIslands = islands.filter((i) => i.id !== islandId);
    handleUpdateIslands(nextIslands);
    if (activeIslandId === islandId) {
      setActiveIslandId(nextIslands[0]?.id || null);
      if (currentView === 'practice') {
        setCurrentView('collections');
      }
    }
  };

  const handleHardReset = () => {
    ttsService.stop();
    hardResetAllData();
    const freshDefaults = getDefaultIslands();
    const freshSettings = getDefaultSettings();
    const freshStats = getDefaultStats();
    setIslands(freshDefaults);
    setSettings(freshSettings);
    setStats(freshStats);
    setActiveIslandId(freshDefaults[0].id);
    setCurrentView('collections');
    setIsSettingsOpen(false);
  };

  const activeIsland = islands.find((i) => i.id === activeIslandId) || islands[0];

  return (
    <div className="flex min-h-screen bg-[#F5F7FA] font-sans antialiased text-slate-800">
      {/* Left Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => setCurrentView(view)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        activeIslandName={activeIsland?.name}
        hasActiveIsland={Boolean(activeIsland)}
        stats={stats}
      />

      {/* Flexible Main Content Workspace */}
      <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto">
        {currentView === 'collections' && (
          <CollectionsView
            islands={islands}
            onSelectIsland={handleSelectIsland}
            onOpenImport={() => setIsImportOpen(true)}
            onDeleteIsland={handleDeleteIsland}
          />
        )}

        {currentView === 'practice' && activeIsland && (
          <PracticeView
            island={activeIsland}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onUpdateSentence={handleUpdateSentence}
            onDeleteSentence={handleDeleteSentence}
            onAddSentence={handleAddSentence}
            onDeleteIsland={handleDeleteIsland}
            onSaveSubBatchIsland={handleSaveSubBatchIsland}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onBack={() => setCurrentView('collections')}
            onRecordRepetition={() => {
              recordRepetition(3);
              setStats(loadUserStats());
            }}
          />
        )}

        {currentView === 'stats' && (
          <StatsView islands={islands} stats={stats} onHardReset={handleHardReset} />
        )}
      </main>

      {/* Settings Modal Layer */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setIsSettingsOpen(false)}
          onHardReset={handleHardReset}
        />
      )}

      {/* Import Modal Layer */}
      {isImportOpen && (
        <ImportModal
          onClose={() => setIsImportOpen(false)}
          onImportIslands={handleImportIslands}
        />
      )}
    </div>
  );
}
