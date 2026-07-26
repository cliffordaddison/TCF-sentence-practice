import React, { useState, useEffect } from 'react';
import { UserSettings, TextScale, SortOrder, LanguageMode, DisplayMode } from '../types';
import { ttsService, TTSVoiceOption } from '../services/tts';
import { Settings, X, Sliders, Volume2, RotateCcw, AlertTriangle, Sparkles, RefreshCw, Smartphone, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface SettingsModalProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onClose: () => void;
  onHardReset?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  onHardReset,
}) => {
  const [frenchVoices, setFrenchVoices] = useState<TTSVoiceOption[]>([]);
  const [englishVoices, setEnglishVoices] = useState<TTSVoiceOption[]>([]);
  const [showVoiceGuide, setShowVoiceGuide] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);

  const loadVoices = () => {
    ttsService.refreshVoices();
    setFrenchVoices(ttsService.getFrenchVoices());
    setEnglishVoices(ttsService.getEnglishVoices());
  };

  useEffect(() => {
    loadVoices();
    ttsService.onVoicesLoaded(() => {
      setFrenchVoices(ttsService.getFrenchVoices());
      setEnglishVoices(ttsService.getEnglishVoices());
    });
  }, []);

  const handleRefreshVoices = () => {
    loadVoices();
    setJustRefreshed(true);
    setTimeout(() => setJustRefreshed(false), 2000);
  };

  const handleRepetitionChange = (count: number) => {
    onUpdateSettings({ ...settings, repetitionCount: count });
  };

  const handlePauseChange = (duration: number) => {
    onUpdateSettings({ ...settings, pauseDuration: duration });
  };

  const handleSpeedChange = (speed: number) => {
    onUpdateSettings({ ...settings, playbackSpeed: speed });
  };

  const handleTextSizeChange = (size: TextScale) => {
    onUpdateSettings({ ...settings, textSize: size });
  };

  const handleLanguageModeChange = (mode: LanguageMode) => {
    onUpdateSettings({ ...settings, languageMode: mode });
  };

  const handleSortChange = (sort: SortOrder) => {
    onUpdateSettings({ ...settings, sortOrder: sort });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Modal Header Group */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Practice Settings</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Customize repetitions, pauses, and playback</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Repetitions per Sentence Section */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 tracking-wider uppercase mb-2">
              Repetitions per Sentence
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rep) => {
                const isActive = settings.repetitionCount === rep;
                return (
                  <button
                    key={rep}
                    type="button"
                    onClick={() => handleRepetitionChange(rep)}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-[1.02]'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {rep}x
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pause Duration Section */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 tracking-wider uppercase mb-2">
              Pause Duration Between Cards
            </label>
            <div className="flex flex-wrap gap-2">
              {[0, 0.5, 1, 2, 3, 5, 7].map((pause) => {
                const isActive = settings.pauseDuration === pause;
                return (
                  <button
                    key={pause}
                    type="button"
                    onClick={() => handlePauseChange(pause)}
                    className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pause}s
                  </button>
                );
              })}
            </div>
          </div>

          {/* Playback Speed Slider Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold text-slate-700 tracking-wider uppercase">
                Playback Speed
              </label>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                {settings.playbackSpeed.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.playbackSpeed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
              <span>0.5x</span>
              <span>1.0x</span>
              <span>1.5x</span>
              <span>2.0x</span>
            </div>
          </div>

          {/* Text Size Configurator */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 tracking-wider uppercase mb-2">
              Text Size
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { size: 'sm', label: 'A-' },
                { size: 'md', label: 'A' },
                { size: 'lg', label: 'A+' },
                { size: 'xl', label: 'A++' },
              ].map((item) => {
                const isActive = settings.textSize === item.size;
                return (
                  <button
                    key={item.size}
                    type="button"
                    onClick={() => handleTextSizeChange(item.size as TextScale)}
                    className={`py-2.5 rounded-xl font-bold text-xs transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language Mode Selector */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 tracking-wider uppercase mb-2">
              Language & TTS Audio Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'en_fr', label: 'English → French' },
                { id: 'fr_en', label: 'French → English' },
                { id: 'fr_only', label: 'French Only' },
                { id: 'en_only', label: 'English Only' },
              ].map((item) => {
                const isActive = settings.languageMode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleLanguageModeChange(item.id as LanguageMode)}
                    className={`p-2.5 rounded-xl font-bold text-xs transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Display Mode Selector */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 tracking-wider uppercase mb-2">
              Card Display Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal', label: '📋 Normal', desc: 'Both texts' },
                { id: 'shadowing', label: '🎧 Shadowing', desc: 'French first' },
                { id: 'recall', label: '💡 Recall', desc: 'English first' },
              ].map((item) => {
                const isActive = settings.displayMode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, displayMode: item.id as DisplayMode })}
                    className={`p-2.5 rounded-xl font-bold text-xs transition-all text-center ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span className="block">{item.label}</span>
                    <span className={`block text-[10px] mt-0.5 ${
                      isActive ? 'text-blue-100' : 'text-slate-400'
                    }`}>{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Selection Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 tracking-wider uppercase flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span>Text-To-Speech Voices</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefreshVoices}
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    justRefreshed
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200'
                  }`}
                  title="Reload voices detected on device"
                >
                  <RefreshCw className={`w-3 h-3 ${justRefreshed ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>{justRefreshed ? 'Refreshed!' : 'Refresh List'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowVoiceGuide(!showVoiceGuide)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>iPhone/Android Guide</span>
                  {showVoiceGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Collapsible Mobile Premium Voice Instructions Card */}
            {showVoiceGuide && (
              <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-4 text-xs space-y-3 border border-blue-800/50 shadow-lg animate-fadeIn">
                <div className="flex items-center gap-2 font-bold text-amber-300 border-b border-white/10 pb-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
                  <span>How to Enable & Download High-Fidelity iPhone & Android Voices</span>
                </div>

                <div className="space-y-2 text-slate-200 text-[11px] leading-relaxed">
                  <div>
                    <strong className="text-white block font-bold mb-0.5">📱 iPhone / iPad (iOS):</strong>
                    <ol className="list-decimal list-inside space-y-0.5 pl-1 text-slate-300">
                      <li>Open <span className="text-blue-300 font-semibold">Settings</span> → <span className="text-blue-300 font-semibold">Accessibility</span> → <span className="text-blue-300 font-semibold">Spoken Content</span> → <span className="text-blue-300 font-semibold">Voices</span>.</li>
                      <li>Select <span className="text-blue-300 font-semibold">French</span> (or English), then tap a voice like <strong className="text-white">Thomas</strong>, <strong className="text-white">Amélie</strong>, or <strong className="text-white">Audrey</strong>.</li>
                      <li>Tap <strong className="text-amber-300">"Enhanced"</strong> or <strong className="text-amber-300">"Premium"</strong> to download the crystal-clear voice pack.</li>
                      <li>Come back here and tap <strong className="text-blue-300">"Refresh List"</strong> above! The new voice will appear marked with <span className="text-amber-300 font-bold">✨</span>.</li>
                    </ol>
                  </div>

                  <div className="pt-1.5 border-t border-white/10">
                    <strong className="text-white block font-bold mb-0.5">🤖 Android Phones:</strong>
                    <ol className="list-decimal list-inside space-y-0.5 pl-1 text-slate-300">
                      <li>Open <span className="text-blue-300 font-semibold">Settings</span> → <span className="text-blue-300 font-semibold">Accessibility</span> → <span className="text-blue-300 font-semibold">Text-to-speech output</span>.</li>
                      <li>Tap gear icon next to <span className="text-blue-300 font-semibold">Speech Services by Google</span> → <span className="text-blue-300 font-semibold">Install voice data</span>.</li>
                      <li>Choose French/English high-quality natural voices.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* Voice Dropdowns Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <span>French Voice (Target)</span>
                  </label>
                  <div className="flex gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        const voice = ttsService.getFrenchMaleVoice();
                        if (voice) onUpdateSettings({ ...settings, targetVoiceURI: voice.voiceURI });
                      }}
                      className="px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold transition-colors cursor-pointer"
                    >
                      👨 Male
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const voice = ttsService.getFrenchFemaleVoice();
                        if (voice) onUpdateSettings({ ...settings, targetVoiceURI: voice.voiceURI });
                      }}
                      className="px-2 py-0.5 rounded bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold transition-colors cursor-pointer"
                    >
                      👩 Female
                    </button>
                  </div>
                </div>
                <select
                  value={settings.targetVoiceURI}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, targetVoiceURI: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 text-slate-800"
                >
                  <option value="">Default Best French Voice (Auto)</option>
                  {frenchVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <span>English Voice (Native)</span>
                  </label>
                  <div className="flex gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        const voice = ttsService.getEnglishMaleVoice();
                        if (voice) onUpdateSettings({ ...settings, nativeVoiceURI: voice.voiceURI });
                      }}
                      className="px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold transition-colors cursor-pointer"
                    >
                      👨 Male
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const voice = ttsService.getEnglishFemaleVoice();
                        if (voice) onUpdateSettings({ ...settings, nativeVoiceURI: voice.voiceURI });
                      }}
                      className="px-2 py-0.5 rounded bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold transition-colors cursor-pointer"
                    >
                      👩 Female
                    </button>
                  </div>
                </div>
                <select
                  value={settings.nativeVoiceURI}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, nativeVoiceURI: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 text-slate-800"
                >
                  <option value="">Default Best English Voice (Auto)</option>
                  {englishVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sort Order Configurator */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 tracking-wider uppercase mb-2">
              Queue Sort Order
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'original', label: 'Original Order' },
                { id: 'easy_hard', label: 'Easy → Hard (Stars ↑)' },
                { id: 'hard_easy', label: 'Hard → Easy (Stars ↓)' },
                { id: 'random', label: 'Random Shuffle' },
              ].map((item) => {
                const isActive = settings.sortOrder === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSortChange(item.id as SortOrder)}
                    className={`p-2.5 rounded-xl font-bold text-xs transition-all ${
                      isActive
                        ? 'bg-blue-50 border-2 border-blue-600 text-blue-700 font-extrabold'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loop Playback Switch Footer Toolbar */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">Loop Playback Track</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.loopPlayback}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, loopPlayback: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Hard Reset Option */}
          {onHardReset && (
            <div className="pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  if (confirm('⚠️ Are you sure you want to hard reset all app data and progress?')) {
                    onHardReset();
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 font-extrabold text-xs hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Hard Reset All Progress Data</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
