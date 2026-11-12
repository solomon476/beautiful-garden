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
  Clock,
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
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  return (
    <div className="relative my-4 overflow-hidden rounded-3xl border border-pink-400/35 bg-gradient-to-br from-purple-950/70 via-fuchsia-950/40 to-slate-950/90 p-4 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-pink-400/60">
      {/* Decorative ambient aura */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl" />

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-500/25 border border-pink-400/40 text-pink-300 shadow-sm shrink-0">
            <Clock className="w-4 h-4 text-pink-300 animate-spin-slow" />
          </div>
          <div className="min-w-0 truncate">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-serif text-sm sm:text-base font-bold text-white tracking-wide truncate">
                On This Day in Our Story
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-pink-500/30 to-purple-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-pink-200 border border-pink-400/40 shadow-sm shrink-0">
                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                <span>{current.badge}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {flashbacks.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer active:scale-90"
                title="Previous Flashback"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-pink-300/80 px-1">
                {currentIndex + 1}/{flashbacks.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer active:scale-90"
                title="Next Flashback"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-full text-pink-300/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title={isCollapsed ? 'Expand Time Machine' : 'Collapse Time Machine'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Flashback Content */}
      {!isCollapsed && (
        <div
          onClick={() => {
            soundEngine.playSparkle();
            onOpenMemory(mem);
          }}
          className="relative z-10 pt-3.5 group cursor-pointer"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
            {/* Thumbnail Preview */}
            <div className="relative w-full sm:w-36 h-40 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-pink-400/40 shadow-md">
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
                “{mem.caption || mem.description || 'A timeless moment in our love story.'}” ♡
              </p>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-pink-300 font-medium group-hover:underline flex items-center gap-1">
                  <span>Relive this Keepsake 💌</span>
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

