import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, Heart, Sparkles } from 'lucide-react';
import type { MemoryItem } from '../data/giftContent';
import { soundEngine } from '../utils/audio';

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
  const [likedPhotos, setLikedPhotos] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('garden_photo_liked');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('garden_photo_like_counts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

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

  const isLiked = !!likedPhotos[memory.id];
  const currentLikes = likeCounts[memory.id] ?? 0;

  const handleLike = () => {
    if (!memory) return;
    soundEngine.playSparkle();
    const newLiked = !isLiked;
    const newCount = Math.max(0, currentLikes + (newLiked ? 1 : -1));

    const updatedLikes = { ...likedPhotos, [memory.id]: newLiked };
    const updatedCounts = { ...likeCounts, [memory.id]: newCount };

    setLikedPhotos(updatedLikes);
    setLikeCounts(updatedCounts);

    try {
      localStorage.setItem('garden_photo_liked', JSON.stringify(updatedLikes));
      localStorage.setItem('garden_photo_like_counts', JSON.stringify(updatedCounts));
    } catch {
      // ignore storage errors
    }
  };

  // Mobile swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      onNext();
    } else if (isRightSwipe) {
      onPrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      {/* Container to prevent backdrop click closing when touching the card */}
      <div
        className="relative max-w-lg w-full bg-white rounded-2xl p-4 sm:p-5 shadow-2xl border border-white/20 animate-scale-up select-none"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 sm:-right-3 w-10 h-10 rounded-full bg-slate-900/90 text-white border border-white/20 flex items-center justify-center hover:bg-pink-600 transition-colors shadow-lg"
          aria-label="Close photo view"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Polaroid Picture */}
        <div className="w-full aspect-square bg-slate-900 rounded-xl overflow-hidden shadow-inner relative group">
          <img
            src={memory.photoUrl || '/assets/memories/photo-solomon-portrait.jpg'}
            alt={memory.altText || memory.title}
            className="w-full h-full object-cover transition-transform duration-300"
            style={{
              objectPosition: memory.objectPosition || 'center',
              filter: memory.filter || undefined,
            }}
            loading="eager"
            decoding="async"
            onError={(e) => {
              // Graceful fallback to memory placeholder
              (e.target as HTMLImageElement).src = '/assets/dreamy_night_garden.jpg';
            }}
          />
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-medium text-pink-200 border border-pink-400/30 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-pink-400" />
            <span>{memory.tag}</span>
          </div>

          {/* Interactive Heart Button on Photo */}
          <button
            onClick={handleLike}
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs flex items-center gap-1.5 hover:scale-105 active:scale-90 transition-transform"
            aria-label="Love this memory"
          >
            <Heart
              className={`w-4 h-4 transition-all duration-300 ${
                isLiked ? 'fill-pink-500 text-pink-500 scale-110' : 'text-white'
              }`}
            />
            <span className="font-mono text-[11px]">{currentLikes > 0 ? currentLikes : 'Love'}</span>
          </button>
        </div>

        {/* Polaroid Handwritten Caption Area */}
        <div className="pt-4 text-center">
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-800 mb-1">
            {memory.title}
          </h3>
          <div className="flex items-center justify-center gap-1 text-slate-500 text-xs font-mono uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5 text-pink-500" />
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
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs font-mono text-slate-400">
            {currentIndex + 1} / {totalCount}
          </span>

          <button
            onClick={onNext}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Swipe Tip */}
        <div className="text-center text-[10px] text-slate-400 mt-2 font-mono sm:hidden">
          Swipe left or right to browse photos
        </div>
      </div>
    </div>
  );
};
