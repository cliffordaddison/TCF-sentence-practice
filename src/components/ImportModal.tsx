import React, { useState, useRef } from 'react';
import { Island } from '../types';
import { parseExcelFile, parseRawTextToIsland, autoTranslateIslandSentences } from '../services/excel';
import {
  ArrowLeft,
  AlertTriangle,
  ListFilter,
  BookOpen,
  MessageSquare,
  FileSpreadsheet,
  Upload,
  Check,
  X,
  Sparkles,
  Languages,
} from 'lucide-react';

interface ImportModalProps {
  onClose: () => void;
  onImportIslands: (newIslands: Island[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImportIslands }) => {
  const [activeTab, setActiveTab] = useState<'excel' | 'text'>('excel');
  const [importType, setImportType] = useState<'Sentences' | 'Narrations' | 'Dialogues'>('Sentences');
  const [islandName, setIslandName] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const lineCount = sourceText.split(/\r?\n/).filter((l) => l.trim().length > 0).length;

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceText.trim()) {
      setErrorMessage('Please enter or paste some text first.');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus('Parsing text lines...');
      let island = parseRawTextToIsland(
        islandName.trim() || 'Custom Import Island',
        sourceText,
        importType
      );

      if (autoTranslate) {
        setProcessingStatus('Auto-translating missing English translations...');
        island = await autoTranslateIslandSentences(island);
      }

      onImportIslands([island]);
      setIsProcessing(false);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to parse text into sentences.');
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setErrorMessage('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage('');
      setProcessingStatus('Reading Excel file...');
      let imported = await parseExcelFile(file);
      if (imported.length === 0) {
        setErrorMessage('No valid sentences found in the uploaded Excel file.');
        setIsProcessing(false);
        return;
      }

      if (autoTranslate) {
        setProcessingStatus('Auto-translating missing English translations...');
        imported = await Promise.all(imported.map((isl) => autoTranslateIslandSentences(isl)));
      }

      onImportIslands(imported);
      setIsProcessing(false);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage('Error reading Excel file. Make sure columns A and B contain text.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header Navigation Group */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-full transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-slate-900 truncate">Import Island</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 line-clamp-1 sm:line-clamp-none">
                Create customized language lessons by pasting text or uploading Excel spreadsheets.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 overflow-y-auto">
          {/* Status / Limit Banner Row */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-sm mt-0.5">
              !
            </div>
            <p className="text-xs font-semibold text-amber-900 leading-relaxed">
              During launch month, this feature supports Excel files (.xlsx where each sheet becomes an Island) and direct text pasting (tab or newline separated) for instant card generation.
            </p>
          </div>

          {/* Import Source Tabs (Excel vs Text Paste) */}
          <div className="flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('excel');
                setErrorMessage('');
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === 'excel'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Upload Excel Sheet (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('text');
                setErrorMessage('');
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === 'text'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-4 h-4 text-blue-600" />
              <span>Paste Source Text</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: Excel Import */}
          {activeTab === 'excel' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-4 shadow-sm">
                  <Upload className="w-7 h-7" />
                </div>

                <h3 className="font-bold text-slate-800 text-base">
                  {isProcessing ? 'Parsing Excel Workbook...' : 'Click to select or drag & drop .xlsx file'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 max-w-sm mx-auto">
                  Column A = Target language phrase, Column B = Native language translation.
                  Each sheet in the file becomes its own Island!
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Text Paste */}
          {activeTab === 'text' && (
            <form onSubmit={handleTextSubmit} className="space-y-5">
              {/* Import Type Selector */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 tracking-wider uppercase mb-2">
                  Import Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'Sentences', label: 'Sentences', icon: ListFilter },
                    { id: 'Narrations', label: 'Narrations', icon: BookOpen },
                    { id: 'Dialogues', label: 'Dialogues', icon: MessageSquare },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = importType === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setImportType(item.id as any)}
                        className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Island Name Field */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 tracking-wider uppercase mb-1.5">
                  Island Name
                </label>
                <input
                  type="text"
                  value={islandName}
                  onChange={(e) => setIslandName(e.target.value)}
                  placeholder="E.g., Ordering at a Restaurant"
                  className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm font-medium placeholder:text-slate-400"
                />
              </div>

              {/* Source Text Field */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 tracking-wider uppercase mb-1.5">
                  Source Text
                </label>
                <div className="relative">
                  <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    rows={6}
                    placeholder={`Paste your target language text here...\nFormat: Target phrase [TAB] Native translation (one per line)\nExample:\nBonjour, comment ça va ? \t Hello, how are you?`}
                    className="w-full p-4 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm font-mono placeholder:font-sans placeholder:text-slate-400 leading-relaxed resize-none"
                  />

                  {/* Character & Line Tracker */}
                  <div className="absolute right-3 bottom-3 text-[11px] font-bold text-slate-600 bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-3">
                    <span>{sourceText.length} chars</span>
                    <span className="text-blue-600 font-bold">{lineCount} lines</span>
                  </div>
                </div>
              </div>

              {/* Auto Translate Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <Languages className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Auto-translate missing English</p>
                    <p className="text-[11px] text-slate-500">Automatically translates French lines without English text.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoTranslate}
                  onChange={(e) => setAutoTranslate(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {isProcessing && processingStatus && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>{processingStatus}</span>
                </div>
              )}

              {/* Global Execution Action Button */}
              <button
                type="submit"
                disabled={isProcessing || !sourceText.trim()}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span>{isProcessing ? 'Generating & Translating...' : 'Create Island'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
