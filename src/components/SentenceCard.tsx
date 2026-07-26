import React, { useEffect, useRef, useState } from 'react';
import { Sentence, TextScale, DisplayMode } from '../types';
import { Volume2, Star, CheckCircle2, Bookmark, Trash2, Languages, BarChart3 } from 'lucide-react';

interface SentenceCardProps {
  sentence: Sentence;
  index: number;
  isSelected: boolean;
  isAnchor?: boolean;
  isCurrentlyPlaying?: boolean;
  activeRepInfo?: string;
  displayMode: DisplayMode;
  showTargetText: boolean;
  textSize: TextScale;
  isSelectionMode?: boolean;
  onHighlightSentence: (sentenceId: string) => void;
  onToggleSelect: (sentenceId: string) => void;
  onSpeak: (sentence: Sentence) => void;
  onRate: (sentenceId: string, rating: number) => void;
  onToggleFavorite?: (sentenceId: string) => void;
  onDeleteSentence?: (sentenceId: string) => void;
  onTranslateSentence?: (sentenceId: string) => void;
  onDoubleClick?: (sentenceId: string) => void;
}

export const SentenceCard: React.FC<SentenceCardProps> = ({
  sentence,
  index,
  isSelected,
  isAnchor,
  isCurrentlyPlaying,
  activeRepInfo,
  displayMode,
  showTargetText,
  textSize,
  isSelectionMode,
  onHighlightSentence,
  onToggleSelect,
  onSpeak,
  onRate,
  onToggleFavorite,
  onDeleteSentence,
  onTranslateSentence,
  onDoubleClick,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const clickTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!showTargetText) {
      setIsRevealed(false);
    }
  }, [showTargetText]);

  const textClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }[textSize];

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      return;
    }

    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      onHighlightSentence(sentence.id);
    }, 200);
  };

  const handleCardDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    if (onDoubleClick) {
      onDoubleClick(sentence.id);
    } else {
      onToggleSelect(sentence.id);
    }
  };

  const isTranslationVisible = showTargetText || isRevealed;

  // Render text content based on display mode
  const renderTextContent = () => {
    if (displayMode === 'shadowing') {
      return (
        <div>
          <p className={`text-lg font-bold text-gray-900 mb-0.5 leading-snug ${textClasses}`}>
            {sentence.target}
          </p>
          {isTranslationVisible ? (
            <p className={`text-base font-semibold text-blue-700 leading-normal animate-fadeIn ${textClasses}`}>
              {sentence.native}
            </p>
          ) : (
            <button
              onClick={() => setIsRevealed(true)}
              className="text-sm font-semibold text-blue-500 hover:text-blue-700 italic cursor-pointer underline decoration-dotted transition-colors flex items-center gap-1"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Tap to reveal translation</span>
            </button>
          )}
        </div>
      );
    }

    if (displayMode === 'recall') {
      return (
        <div>
          <p className={`text-gray-900 text-base font-semibold mb-1 leading-snug ${textClasses}`}>
            {sentence.native}
          </p>
          {isTranslationVisible ? (
            <p className={`text-base font-semibold text-blue-700 ${textClasses} animate-fadeIn`}>
              {sentence.target}
            </p>
          ) : (
            <button
              onClick={() => setIsRevealed(true)}
              className="text-sm font-semibold text-blue-500 hover:text-blue-700 italic cursor-pointer underline decoration-dotted transition-colors flex items-center gap-1"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Tap to reveal French</span>
            </button>
          )}
        </div>
      );
    }

    return (
      <div>
        {showTargetText && (
          <p className={`text-lg font-bold text-gray-900 mb-0.5 leading-snug ${textClasses}`}>
            {sentence.target}
          </p>
        )}
        <p className="text-gray-500 text-xs font-normal leading-normal">{sentence.native}</p>
      </div>
    );
  };

  return (
    <div
      id={`sentence-card-${sentence.id}`}
      onClick={handleCardClick}
      onDoubleClick={handleCardDoubleClick}
      className={`relative rounded-2xl p-3.5 sm:p-5 transition-all duration-300 select-none ${
        isCurrentlyPlaying
          ? 'bg-blue-50/90 border-2 border-blue-600 shadow-md ring-4 ring-blue-500/15 scale-[1.01]'
          : isAnchor
          ? 'bg-amber-50/80 border-2 border-amber-400 shadow-xs'
          : isSelected
          ? 'bg-blue-50/40 border-2 border-blue-400 shadow-xs'
          : 'bg-white border border-emerald-200/90 hover:border-blue-300 shadow-2xs hover:shadow-xs'
      }`}
    >
      {/* Card Header Bar */}
      <div className="flex items-center justify-between border-b border-gray-100/80 pb-2 mb-3 gap-2">
        {/* Left: Checkbox + #Tag Number + Active Playing Soundwave Badge + Badges */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 min-w-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(sentence.id);
            }}
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isSelected
                ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                : 'border-gray-300 hover:border-blue-400 bg-white'
            }`}
            title={isSelected ? 'Unselect sentence' : 'Select sentence for separate repping'}
          >
            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          <span className="text-[11px] sm:text-xs font-extrabold text-blue-600 select-none">
            #{index + 1}
          </span>

          {isCurrentlyPlaying && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-blue-800 bg-blue-100/90 px-2.5 py-0.5 rounded-full border border-blue-300 shadow-2xs truncate max-w-[130px] sm:max-w-none">
              <span className="flex items-end gap-[2px] h-3">
                <span className="w-[3px] bg-blue-600 rounded-full animate-pulse h-full" />
                <span className="w-[3px] bg-blue-600 rounded-full animate-bounce h-2" />
                <span className="w-[3px] bg-blue-600 rounded-full animate-pulse h-2.5" />
              </span>
              <span>{activeRepInfo || 'Playing...'}</span>
            </span>
          )}

          {sentence.mastered && (
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span className="hidden sm:inline">Mastered</span>
            </div>
          )}

          {sentence.reps > 0 && (
            <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
              {sentence.reps}x
            </span>
          )}
        </div>

        {/* Right: Star Ratings & Actions */}
        <div className="flex items-center space-x-1 shrink-0">
          <div className="flex text-amber-400 items-center">
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
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
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
              className="p-1 text-gray-300 hover:text-amber-500 transition-colors cursor-pointer"
              title="Bookmark phrase"
            >
              <Bookmark
                className={`w-4 h-4 ${
                  sentence.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                }`}
              />
            </button>
          )}

          {displayMode !== 'normal' && !isTranslationVisible && (
            <button
              onClick={() => setIsRevealed(true)}
              className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              title={displayMode === 'shadowing' ? 'Reveal English translation' : 'Reveal French text'}
            >
              <Languages className="w-4 h-4" />
            </button>
          )}

          {displayMode === 'normal' && onTranslateSentence && (!sentence.native || sentence.native === sentence.target) && (
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
              className="p-1 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Delete sentence"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body Row: Listen Audio Button + Sentence Text Content */}
      <div className="flex items-start gap-3 w-full">
        <button
          onClick={() => onSpeak(sentence)}
          title="Listen to phrase audio"
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5 ${
            isCurrentlyPlaying
              ? 'bg-blue-600 text-white shadow-xs border border-blue-600'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
          }`}
        >
          {isCurrentlyPlaying ? (
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          ) : (
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>

        <div className="flex-1 min-w-0 pt-0.5">
          {renderTextContent()}
        </div>
      </div>
    </div>
  );
};
