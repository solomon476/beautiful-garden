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
      className={`rewind-memory-banner group ${
        isCollapsed ? 'cursor-pointer' : 'is-expanded'
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
      {/* Top Header Bar — Exactly mirrors .add-memory-banner form: Left Frosted Icon | Stacked Title+Subtitle | Right Action */}
      <div className="flex items-center justify-between gap-2.5">
        {/* Left: Rounded Frosted Icon Box (w-8 h-8 rounded-xl) matching .add-memory-banner style */}
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/30 shrink-0 group-hover:scale-105 transition-transform shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-200" />
        </div>

        {/* Center: Evenly Spaced Typography (Title on top, subtitle underneath) */}
        <div className="min-w-0 flex-1 text-left">
          <h3 className="font-bold text-sm text-white tracking-wide leading-tight flex items-center gap-1.5 truncate">
            <span>Golden Chapters Rewind</span>
            <span className="text-pink-200 text-xs font-normal">♡</span>
          </h3>
          <p className="text-[11px] text-pink-200/90 font-serif italic mt-0.5 leading-tight truncate">
            {current.badge}
          </p>
        </div>

        {/* Right: Sleek Lightweight Frosted Action Button */}
        <div className="shrink-0 flex items-center gap-1.5" onClick={isCollapsed ? undefined : (e) => e.stopPropagation()}>
          {isCollapsed ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 group-hover:bg-white/25 border border-white/25 text-pink-100 text-[11px] font-medium shadow-sm transition-all">
              <span>Peek • {currentIndex + 1}/{flashbacks.length}</span>
              <ChevronDown className="w-3 h-3 text-pink-200" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {flashbacks.length > 1 && (
                <div className="flex items-center gap-1 bg-white/15 rounded-full px-1.5 py-0.5 border border-white/25">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="p-1 rounded-full hover:bg-white/20 text-white transition-all cursor-pointer active:scale-90"
                    title="Previous Memory"
                    aria-label="Previous Memory"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-pink-100 px-1 whitespace-nowrap">
                    {currentIndex + 1}/{flashbacks.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="p-1 rounded-full hover:bg-white/20 text-white transition-all cursor-pointer active:scale-90"
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
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-pink-200 hover:text-white text-[10px] font-medium transition-all cursor-pointer"
                title="Fold memory shut"
                aria-label="Fold Golden Chapters Card"
              >
                <span>Fold</span>
                <ChevronUp className="w-3 h-3 text-pink-200" />
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
          className="pt-2.5 mt-2.5 border-t border-white/15 group cursor-pointer animate-fade-in"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Thumbnail Preview */}
            <div className="relative w-full sm:w-32 h-40 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-white/25 shadow-md">
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
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] text-amber-200 border border-amber-300/30 flex items-center gap-1">
                  <Film className="w-2.5 h-2.5 text-amber-300" />
                  <span>Video Clip</span>
                </div>
              )}
              {mem.musicTitle && (
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-pink-500/80 backdrop-blur-md text-[9px] text-white border border-pink-300/40 flex items-center gap-1 max-w-[85%] truncate">
                  <Disc3 className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{mem.musicTitle}</span>
                </div>
              )}
            </div>

            {/* Content Details */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-mono text-pink-200/90">
                <Calendar className="w-3 h-3 text-pink-300" />
                <span>{mem.dateTaken || current.relativeTime}</span>
                <span className="text-white/40">•</span>
                <span className="text-pink-100">{mem.contributorName || 'Garden'}</span>
              </div>

              <h4 className="font-handwriting text-xl text-pink-100 group-hover:text-white transition-colors truncate">
                {mem.title}
              </h4>

              <p className="text-xs text-white/85 line-clamp-2 leading-relaxed italic font-serif">
                “{mem.caption || mem.description || 'A timeless moment in our story.'}” ♡
              </p>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-pink-200 font-medium group-hover:underline flex items-center gap-1">
                  <span>Relive in Full Lightbox 💌</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
                <span className="text-xs text-rose-300 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-pink-300 text-pink-300" />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
