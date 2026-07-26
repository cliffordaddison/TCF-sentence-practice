import React, { useState } from 'react';
import { Sentence, TextScale } from '../types';
import { Volume2, Star, Eye, CheckCircle2, Bookmark, Trash2, Languages, BarChart3 } from 'lucide-react';

interface SentenceCardProps {
  sentence: Sentence;
  index: number;
  isSelected: boolean;
  isCurrentlyPlaying?: boolean;
  activeRepInfo?: string;
  isActiveRecall: boolean;
  showTargetText: boolean;
  textSize: TextScale;
  onToggleSelect: (sentenceId: string) => void;
  onSpeak: (sentence: Sentence) => void;
  onRate: (sentenceId: string, rating: number) => void;
  onToggleFavorite?: (sentenceId: string) => void;
  onDeleteSentence?: (sentenceId: string) => void;
  onTranslateSentence?: (sentenceId: string) => void;
}

export const SentenceCard: React.FC<SentenceCardProps> = ({
  sentence,
  index,
  isSelected,
  isCurrentlyPlaying,
  activeRepInfo,
  isActiveRecall,
  showTargetText,
  textSize,
  onToggleSelect,
  onSpeak,
  onRate,
  onToggleFavorite,
  onDeleteSentence,
  onTranslateSentence,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const textClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }[textSize];

  const handleCardDoubleClick = (e: React.MouseEvent) => {
    // Avoid double-click triggering if user double-clicks star or button
    if ((e.target as HTMLElement).closest('button')) return;
    onToggleSelect(sentence.id);
  };

  return (
    <div
      id={`sentence-card-${sentence.id}`}
      onDoubleClick={handleCardDoubleClick}
      className={`relative rounded-2xl p-4 md:p-5 transition-all duration-200 select-none ${
        isCurrentlyPlaying
          ? 'bg-[#EFF6FF] border-2 border-blue-500 shadow-md ring-2 ring-blue-400/20'
          : isSelected
          ? 'bg-blue-50/40 border-2 border-blue-400 shadow-sm'
          : 'bg-white border border-emerald-200/90 hover:border-blue-300 shadow-2xs hover:shadow-xs'
      }`}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex space-x-3 items-start flex-1 min-w-0">
          {/* Tag Number & Audio Speaker Squircle */}
          <div className="flex items-center space-x-2 shrink-0 pt-0.5">
            <span className="text-xs font-extrabold text-blue-600 select-none">
              #{index + 1}
            </span>
            <button
              onClick={() => onSpeak(sentence)}
              title="Listen to phrase audio"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isCurrentlyPlaying
                  ? 'bg-blue-600 text-white shadow-xs border border-blue-600'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
              }`}
            >
              {isCurrentlyPlaying ? (
                <BarChart3 className="w-4.5 h-4.5 text-white" />
              ) : (
                <Volume2 className="w-4.5 h-4.5" />
              )}
            </button>
          </div>

          <div className="flex-1 min-w-0 pl-1">
            {isActiveRecall ? (
              <div>
                <p className={`text-gray-900 text-base font-semibold mb-1 leading-snug ${textClasses}`}>
                  {sentence.native}
                </p>
                {isRevealed || showTargetText ? (
                  <p className={`text-lg font-bold text-blue-600 ${textClasses} animate-fadeIn`}>
                    {sentence.target}
                  </p>
                ) : (
                  <button
                    onClick={() => setIsRevealed(true)}
                    className="text-sm font-semibold text-blue-500 hover:text-blue-700 italic cursor-pointer underline decoration-dotted transition-colors"
                  >
                    Tap to reveal
                  </button>
                )}
              </div>
            ) : (
              <div>
                {showTargetText && (
                  <p className={`text-lg font-bold text-gray-900 mb-0.5 leading-snug ${textClasses}`}>
                    {sentence.target}
                  </p>
                )}
                <p className="text-gray-500 text-xs font-normal leading-normal">{sentence.native}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {isCurrentlyPlaying && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-800 bg-blue-100/90 px-2.5 py-0.5 rounded-full border border-blue-200">
                  <span>🔊 {activeRepInfo || 'Playing...'}</span>
                </span>
              )}
              {sentence.mastered && (
                <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Mastered</span>
                </div>
              )}
              {sentence.reps > 0 && (
                <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                  Reps: {sentence.reps}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 5-Star Rating & Actions */}
        <div className="flex items-center space-x-1 shrink-0 pt-0.5">
          <div className="flex text-amber-400 text-base">
            {[1, 2, 3, 4, 5].map((starVal) => {
              const isFilled = sentence.rating >= starVal;
              return (
                <button
                  key={starVal}
                  onClick={() => onRate(sentence.id, starVal)}
                  className="p-0.5 transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                  title={`Rate ${starVal} Star${starVal > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-4 h-4 ${
                      isFilled ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-100'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(sentence.id)}
              className="ml-1 p-1 text-gray-300 hover:text-amber-500 transition-colors cursor-pointer"
              title="Bookmark phrase"
            >
              <Bookmark
                className={`w-4 h-4 ${
                  sentence.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                }`}
              />
            </button>
          )}

          {onTranslateSentence && (!sentence.native || sentence.native === sentence.target) && (
            <button
              onClick={() => onTranslateSentence(sentence.id)}
              className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              title="Auto-translate to English"
            >
              <Languages className="w-4 h-4" />
            </button>
          )}

          {onDeleteSentence && (
            <button
              onClick={() => onDeleteSentence(sentence.id)}
              className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Sentence Card"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
