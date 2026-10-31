import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, Heart } from 'lucide-react';
import type { MemoryItem } from '../data/giftContent';

interface PhotoLightboxProps {
  memory: MemoryItem | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
  totalCount: number;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  memory,
  onClose,
  onNext,
  onPrev,
  currentIndex,
  totalCount,
}) => {
  useEffect(() => {
    if (!memory) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [memory, onClose, onNext, onPrev]);

  if (!memory) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      {/* Container to prevent backdrop click closing when touching the card */}
      <div
        className="relative max-w-lg w-full bg-white rounded-lg p-4 sm:p-5 shadow-2xl border border-white/20 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 sm:-right-4 w-10 h-10 rounded-full bg-slate-900/80 text-white border border-white/20 flex items-center justify-center hover:bg-pink-600 transition-colors shadow-lg"
          aria-label="Close photo view"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Polaroid Picture */}
        <div className="w-full aspect-square bg-slate-900 rounded overflow-hidden shadow-inner relative group">
          <img
            src={memory.photoUrl || '/assets/memories/memory-1.jpg'}
            alt={memory.altText || memory.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-medium text-pink-200 border border-pink-400/30 flex items-center gap-1.5">
            <Heart className="w-3 h-3 fill-pink-400 text-pink-400" />
            <span>{memory.tag}</span>
          </div>
        </div>

        {/* Polaroid Handwritten Caption Area */}
        <div className="pt-4 text-center">
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-800 mb-1">
            {memory.title}
          </h3>
          <div className="flex items-center justify-center gap-1 text-slate-500 text-xs font-mono uppercase tracking-wider mb-3">
            <Calendar className="w-3.5 h-3.5" />
            <span>{memory.date}</span>
          </div>
          <p className="font-handwriting text-2xl sm:text-3xl text-slate-700 leading-snug px-2">
            “{memory.caption}”
          </p>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
          <button
            onClick={onPrev}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs font-mono text-slate-400">
            {currentIndex + 1} / {totalCount}
          </span>

          <button
            onClick={onNext}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
