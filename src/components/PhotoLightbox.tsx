import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Calendar, Heart, Sparkles, Film, Maximize2, Minimize2 } from 'lucide-react';
import type { MemoryItem } from '../data/giftContent';
import { soundEngine } from '../utils/audio';
import { authService } from '../services/gardenService';
import { notificationService } from '../services/notificationService';
import { formatMemoryDisplayTitle } from './garden/LittleArchiveSection';

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

  const [isCoverMode, setIsCoverMode] = useState<boolean>(true);
  const [likeToast, setLikeToast] = useState<string | null>(null);
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

    if (newLiked) {
      const user = authService.getCurrentUser();
      const partner = authService.getPartner();
      const displayTitle = formatMemoryDisplayTitle(memory.title, memory.caption, memory.date);
      // Notify partner
      notificationService.sendNotification({
        type: 'memory',
        title: '❤️ Loved a Memory',
        message: `${user.displayName} loved "${displayTitle}" in Our Archive! ♡`,
        targetTab: 'archive',
        senderId: user.id,
        senderName: user.displayName,
        recipientId: partner.id,
        entityId: `like-${memory.id}-${user.id}-${Date.now()}`,
      });
      // Show instant confirmation toast to self
      setLikeToast(`❤️ You loved "${displayTitle}"! Notification sent to ${partner.displayName} ✨`);
      setTimeout(() => setLikeToast(null), 3800);
    }

    try {
      localStorage.setItem('garden_photo_liked', JSON.stringify(updatedLikes));
      localStorage.setItem('garden_photo_like_counts', JSON.stringify(updatedCounts));
    } catch {
      // ignore storage errors
    }
  };

  // Mobile swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    // If user touches the video or interactive controls, don't trigger swipe gestures
    if ((e.target as HTMLElement).closest('video, button, input')) return;
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

  // 1. Immersive Full-Screen Cinema Theater View for Videos
  if (memory.videoUrl) {
    const videoContent = (
      <div
        className="fixed inset-0 flex flex-col justify-between select-none animate-fade-in"
        style={{
          zIndex: 99999,
          backgroundColor: '#05020a',
          position: 'fixed',
          inset: 0,
        }}
        onClick={onClose}
      >
        {/* Floating Top Header Bar */}
        <div
          className="relative z-30 flex items-center justify-between p-3 sm:p-5"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {likeToast && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-pink-600/90 text-white text-xs font-medium backdrop-blur-md shadow-2xl border border-white/30 z-50 animate-bounce-subtle pointer-events-none">
              {likeToast}
            </div>
          )}
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <span className="p-2 rounded-xl bg-pink-500/20 border border-pink-400/40 text-pink-300 shrink-0">
              <Film className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h3 className="font-serif text-base sm:text-lg font-bold text-white truncate drop-shadow-md">
                {memory.title}
              </h3>
              <p className="text-[11px] font-mono text-pink-200/80 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-pink-400" />
                <span>{memory.date}</span>
                <span className="text-white/40">•</span>
                <span>{currentIndex + 1} of {totalCount}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleLike}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-pink-400 active:scale-90 transition-all cursor-pointer shadow-lg backdrop-blur-md"
              title="Love this video"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-500 text-pink-500' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/10 hover:bg-rose-500 border border-white/20 text-white active:scale-90 transition-all cursor-pointer shadow-lg backdrop-blur-md"
              aria-label="Close video view"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Full-Screen Video Stage */}
        <div
          className="flex-1 w-full flex items-center justify-center p-1 sm:p-4 overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          <video
            key={memory.id}
            src={memory.videoUrl}
            poster={memory.photoUrl}
            controls
            playsInline
            autoPlay
            preload="auto"
            className="w-full h-full max-h-[82vh] sm:max-h-[86vh] object-contain mx-auto rounded-xl sm:rounded-2xl shadow-2xl cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              const v = e.currentTarget;
              if (v.paused) v.play().catch(() => {});
              else v.pause();
            }}
          />
        </div>

        {/* Floating Bottom Navigation & Caption Bar */}
        <div
          className="relative z-30 p-3 sm:p-5 space-y-2"
          style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 70%, transparent 100%)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {memory.caption && (
            <p className="font-handwriting text-xl sm:text-2xl text-center text-pink-100/90 leading-snug drop-shadow-md px-3 line-clamp-2">
              “{memory.caption}” ♡
            </p>
          )}

          {totalCount > 1 && (
            <div className="flex items-center justify-between max-w-sm mx-auto text-xs text-white/90">
              <button
                type="button"
                onClick={onPrev}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="font-mono text-[11px] text-pink-300">
                {currentIndex + 1} of {totalCount}
              </span>

              <button
                type="button"
                onClick={onNext}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
    if (typeof document !== 'undefined') {
      return createPortal(videoContent, document.body);
    }
    return videoContent;
  }

  // 2. Authentic Polaroid Keepsake Frame for Photos
  const photoContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      {/* Container to prevent backdrop click closing when touching the card */}
      <div
        className="relative max-w-lg w-full bg-white rounded-2xl p-3.5 sm:p-5 shadow-2xl border border-white/20 animate-scale-up select-none max-h-[92vh] flex flex-col justify-between overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {likeToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-pink-600/95 text-white text-xs font-medium backdrop-blur-md shadow-2xl border border-white/30 z-50 animate-bounce-subtle pointer-events-none">
            {likeToast}
          </div>
        )}

        {/* Polaroid Picture or Video: Fills the full width with zero side empty margins */}
        <div className="polaroid-lightbox-image-wrapper relative group">
          {/* Sleek Round Floating Close Button — perfectly circular, unclipped, matching garden styling */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/65 hover:bg-rose-600 border border-white/30 text-white backdrop-blur-md flex items-center justify-center transition-all active:scale-90 shadow-xl z-30 cursor-pointer"
            aria-label="Close photo view"
          >
            <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {memory.videoUrl ? (
            <video
              key={memory.id}
              src={memory.videoUrl}
              poster={memory.photoUrl}
              controls
              playsInline
              autoPlay
              preload="auto"
              className="polaroid-lightbox-video relative z-10 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                const v = e.currentTarget;
                if (v.paused) v.play().catch(() => {});
                else v.pause();
              }}
            />
          ) : (
            <img
              src={memory.photoUrl || '/assets/memories/photo-holding-hands.jpg'}
              alt={memory.altText || memory.title}
              className={`polaroid-lightbox-image ${isCoverMode ? 'object-cover' : 'object-contain'}`}
              loading="eager"
              decoding="async"
              onError={(e) => {
                // Graceful fallback to memory placeholder
                (e.target as HTMLImageElement).src = '/assets/dreamy_night_garden.jpg';
              }}
            />
          )}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-medium text-pink-200 border border-pink-400/30 flex items-center gap-1.5 z-10 pointer-events-none">
            {memory.videoUrl ? (
              <>
                <Film className="w-3 h-3 text-amber-300" />
                <span>Video Keepsake 🎬</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-pink-400" />
                <span>{memory.tag}</span>
              </>
            )}
          </div>

          {/* Optional Fit/Fill Toggle & Interactive Heart Button on Photo */}
          {!memory.videoUrl && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundEngine.playSparkle();
                  setIsCoverMode((prev) => !prev);
                }}
                className="pointer-events-auto px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-[11px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-md"
                title={isCoverMode ? 'Switch to uncropped fit' : 'Switch to fill full space'}
              >
                {isCoverMode ? (
                  <>
                    <Minimize2 className="w-3 h-3 text-pink-300" />
                    <span>Fit</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3 h-3 text-pink-300" />
                    <span>Fill</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleLike}
                className="pointer-events-auto px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs flex items-center gap-1.5 hover:scale-105 active:scale-90 transition-transform cursor-pointer shadow-md"
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
          )}
        </div>

        {/* Polaroid Handwritten Caption Area */}
        <div className="pt-4 text-center">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8" />
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-800 truncate px-2">
              {memory.title}
            </h3>
            {memory.videoUrl ? (
              <button
                type="button"
                onClick={handleLike}
                className="p-1.5 rounded-full hover:bg-pink-50 text-pink-500 transition-colors cursor-pointer"
                title="Love this video"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-500' : ''}`} />
              </button>
            ) : (
              <div className="w-8" />
            )}
          </div>
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

  if (typeof document !== 'undefined') {
    return createPortal(photoContent, document.body);
  }
  return photoContent;
};
