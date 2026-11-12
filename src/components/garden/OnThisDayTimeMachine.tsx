import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Disc3,
  Heart,
  ChevronDown,
  ChevronUp,
  Film,
} from 'lucide-react';
import type { MemoryEntry } from '../../types/garden';
import type { FlashbackItem } from '../../services/onThisDayService';
import { soundEngine } from '../../utils/audio';

interface OnThisDayTimeMachineProps {
  flashbacks: FlashbackItem[];
  onOpenMemory: (memory: MemoryEntry) => void;
}

export const OnThisDayTimeMachine: React.FC<OnThisDayTimeMachineProps> = ({
  flashbacks,
  onOpenMemory,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Kept shut by default so viewing memories here is 100% optional without pushing down the gallery
  const [isCollapsed, setIsCollapsed] = useState(true);

  if (!flashbacks || flashbacks.length === 0) return null;

  const current = flashbacks[currentIndex] || flashbacks[0];
  const mem = current.memory;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playSparkle();
    setCurrentIndex((prev) => (prev + 1) % flashbacks.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playSparkle();
    setCurrentIndex((prev) => (prev - 1 + flashbacks.length) % flashbacks.length);
  };

  const handleToggleCollapse = () => {
    soundEngine.playSparkle();
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={`relative my-3 overflow-hidden rounded-2xl sm:rounded-3xl border border-pink-400/35 bg-gradient-to-br from-[#1a0a2e]/90 via-[#260f3d]/80 to-[#120524]/95 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-pink-400/60 ${
        isCollapsed ? 'p-2.5 sm:p-3 cursor-pointer' : 'p-3.5 sm:p-4'
      }`}
      onClick={isCollapsed ? handleToggleCollapse : undefined}
      role={isCollapsed ? 'button' : undefined}
      tabIndex={isCollapsed ? 0 : undefined}
      onKeyDown={
        isCollapsed
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') handleToggleCollapse();
            }
          : undefined
      }
      title={isCollapsed ? 'Tap to peek inside Golden Chapters Rewind' : undefined}
    >
      {/* Decorative ambient aura */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl" />

      {/* Header Bar */}
      <div
        className={`relative z-10 flex items-center justify-between gap-2 ${
          isCollapsed ? '' : 'border-b border-white/10 pb-3'
        }`}
      >
        {/* Left: Romantic Title & Expressive Tag */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-500/30 to-purple-500/30 border border-pink-400/40 text-pink-300 shadow-sm shrink-0">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 animate-pulse" />
          </div>
          <div className="min-w-0 truncate">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-serif text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                Golden Chapters Rewind ♡
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-pink-500/30 via-rose-500/30 to-purple-500/30 px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold text-pink-200 border border-pink-400/40 shadow-sm shrink-0">
                <span>{current.badge}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Stylish Counter & Collapse/Expand Controls */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={isCollapsed ? undefined : (e) => e.stopPropagation()}>
          {isCollapsed ? (
            /* Collapsed Peek Pill Button */
            <button
              type="button"
              onClick={handleToggleCollapse}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-pink-200 hover:text-white border border-pink-400/40 text-[10px] sm:text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <span>Peek Inside • {currentIndex + 1}/{flashbacks.length}</span>
              <ChevronDown className="w-3 h-3 text-pink-300" />
            </button>
          ) : (
            /* Expanded Multi-item Switcher & Fold Button */
            <div className="flex items-center gap-1.5">
              {flashbacks.length > 1 && (
                <div className="flex items-center gap-1 bg-white/5 rounded-full px-1.5 py-0.5 border border-white/10">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="p-1 rounded-full hover:bg-white/15 text-pink-200 hover:text-white transition-all cursor-pointer active:scale-90"
                    title="Previous Memory"
                    aria-label="Previous Memory"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-pink-200 px-1 whitespace-nowrap">
                    {currentIndex + 1} / {flashbacks.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="p-1 rounded-full hover:bg-white/15 text-pink-200 hover:text-white transition-all cursor-pointer active:scale-90"
                    title="Next Memory"
                    aria-label="Next Memory"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleToggleCollapse}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-pink-300/80 hover:text-white hover:bg-white/10 text-[10px] font-medium transition-all cursor-pointer"
                title="Keep memory shut"
                aria-label="Close Flashback Card"
              >
                <span>Fold</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Flashback Content (Optional Peek View) */}
      {!isCollapsed && (
        <div
          onClick={() => {
            soundEngine.playSparkle();
            onOpenMemory(mem);
          }}
          className="relative z-10 pt-3 group cursor-pointer animate-fade-in"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
            {/* Thumbnail Preview */}
            <div className="relative w-full sm:w-36 h-44 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-pink-400/40 shadow-md">
              <img
                src={mem.photoUrl}
                alt={mem.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/garden/card_archive.jpg';
                }}
              />
              {mem.videoUrl && (
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[10px] text-amber-200 border border-amber-300/40 flex items-center gap-1">
                  <Film className="w-2.5 h-2.5 text-amber-300" />
                  <span>Video Clip</span>
                </div>
              )}
              {mem.musicTitle && (
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-pink-500/80 backdrop-blur-md text-[10px] text-white border border-pink-300/40 flex items-center gap-1 max-w-[85%] truncate">
                  <Disc3 className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{mem.musicTitle}</span>
                </div>
              )}
            </div>

            {/* Content Details */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-mono text-pink-300/90">
                <Calendar className="w-3 h-3 text-pink-400" />
                <span>{mem.dateTaken || current.relativeTime}</span>
                <span className="text-white/40">•</span>
                <span className="text-purple-300">{mem.contributorName || 'Garden'}</span>
              </div>

              <h4 className="font-handwriting text-2xl text-pink-100 group-hover:text-pink-200 transition-colors truncate">
                {mem.title}
              </h4>

              <p className="text-xs text-white/80 line-clamp-2 leading-relaxed italic">
                “{mem.caption || mem.description || 'A timeless moment in our story.'}” ♡
              </p>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-pink-300 font-medium group-hover:underline flex items-center gap-1">
                  <span>Relive in Full Lightbox 💌</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
                <span className="text-xs text-rose-300 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
