import React, { useState, useEffect } from 'react';
import { Camera, Calendar, Plus, RotateCw, ZoomIn } from 'lucide-react';
import { giftContent, type MemoryItem } from '../data/giftContent';
import { PhotoLightbox } from './PhotoLightbox';
import { soundEngine } from '../utils/audio';
import { memoryArchiveService } from '../services/gardenService';

const rotationClasses = [
  'sm:rotate-[-1.5deg] hover:rotate-0',
  'sm:rotate-[1.5deg] hover:rotate-0',
  'sm:rotate-[-1deg] hover:rotate-0',
  'sm:rotate-[1.5deg] hover:rotate-0',
  'sm:rotate-[-1deg] hover:rotate-0',
  'sm:rotate-[1deg] hover:rotate-0',
];

interface ScrapbookSectionProps {
  onOpenArchive?: () => void;
}

export const ScrapbookSection: React.FC<ScrapbookSectionProps> = ({ onOpenArchive }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [archiveMemories, setArchiveMemories] = useState<MemoryItem[]>([]);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const loadArchiveMemories = async () => {
    try {
      const items = await memoryArchiveService.getMemories();
      const mapped: MemoryItem[] = items
        .filter((m) => !m.id.startsWith('seed-') && Boolean(m.isShared))
        .map((m) => ({
          id: m.id,
          title: m.title,
          date: m.dateTaken || 'Keepsake Date',
          caption: m.caption || m.description || 'Pinned in our garden album.',
          tag: m.contributorName ? `Pinned by ${m.contributorName}` : 'Pinned Memory',
          accentColor: 'from-pink-500/20 to-purple-500/20',
          photoUrl: m.photoUrl,
          altText: m.title,
        }));
      setArchiveMemories(mapped);
    } catch (e) {
      console.warn('Could not load user archive memories in scrapbook', e);
    }
  };

  useEffect(() => {
    loadArchiveMemories();
    const handleUpdate = () => loadArchiveMemories();
    window.addEventListener('garden-memories-updated', handleUpdate);
    return () => window.removeEventListener('garden-memories-updated', handleUpdate);
  }, []);

  const allMemories: MemoryItem[] = [...giftContent.memories, ...archiveMemories];
  const isMultiColumn = allMemories.length >= 4;

  const handleOpenPhoto = (index: number) => {
    soundEngine.playChime(523.25, 1.2, 0.08);
    setSelectedIndex(index);
  };

  const handleCardTouch = (id: string) => {
    soundEngine.playSparkle();
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleClose = () => setSelectedIndex(null);

  const handleNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % allMemories.length);
  };

  const handlePrev = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + allMemories.length) % allMemories.length);
  };

  return (
    <section id="memories" className="relative py-16 px-4 z-10 max-w-5xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-400/20 text-pink-300 text-xs font-medium uppercase tracking-wider mb-3">
          <Camera className="w-3.5 h-3.5" />
          <span>Our Scrapbook</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">
          Moments Kept in Bloom
        </h2>
        <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto font-light mb-5">
          Snapshots of quiet laughter, gentle talks, and the days I never want to forget.
        </p>

        {onOpenArchive && (
          <button
            onClick={() => {
              soundEngine.playSparkle();
              onOpenArchive();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500/20 via-rose-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-400/40 text-pink-200 text-xs sm:text-sm font-medium shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-pink-300" />
            <span>Pin a Photo to Our Album 📷</span>
          </button>
        )}
      </div>

      {/* Polaroid Grid */}
      <div
        className={`grid ${
          isMultiColumn
            ? 'grid-cols-2 gap-3 sm:gap-6'
            : 'grid-cols-1 gap-8 sm:gap-6'
        } sm:grid-cols-2 lg:grid-cols-3 px-2 sm:px-4`}
      >
        {allMemories.map((memory, index) => {
          const rotationClass = rotationClasses[index % rotationClasses.length];
          const isFlipped = Boolean(flippedCards[memory.id]);

          return (
            <div
              key={memory.id}
              className={`polaroid-flip-stage ${rotationClass} transform transition-all duration-300`}
            >
              <div
                className={`polaroid-flipper ${isFlipped ? 'is-flipped' : ''}`}
                onClick={() => handleCardTouch(memory.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardTouch(memory.id);
                  }
                }}
                aria-label={`Keepsake: ${memory.title}. Touch to flip`}
              >
                {/* ================= Front of Polaroid ================= */}
                <div
                  className={`polaroid-card polaroid-face-front ${
                    isMultiColumn ? 'polaroid-card-compact' : ''
                  }`}
                >
                  {/* Photo Frame with Ambient Blur & Balanced Proportions */}
                  <div className="polaroid-image-wrapper relative">
                    {/* Ambient Glow Backdrop (Eliminates harsh black bars) */}
                    <img
                      src={memory.photoUrl || '/assets/memories/photo-holding-hands.jpg'}
                      alt=""
                      aria-hidden="true"
                      className="polaroid-ambient-blur"
                      loading="lazy"
                    />

                    {/* Main Photo (Heads and smiles preserved with center 18%) */}
                    <img
                      src={memory.photoUrl || '/assets/memories/photo-holding-hands.jpg'}
                      alt={memory.altText || memory.title}
                      className="polaroid-image"
                      style={{ objectPosition: memory.objectPosition || 'center 18%' }}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/dreamy_night_garden.jpg';
                      }}
                    />

                    {/* Tag Badge */}
                    <div className="absolute top-2 left-2 px-1.5 sm:px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[9px] sm:text-[10px] text-pink-200 border border-white/20 z-10">
                      {memory.tag}
                    </div>

                    {/* Touch To See Note Badge */}
                    <div className="absolute bottom-2 right-2 z-10">
                      <span className="polaroid-tap-hint">
                        <span>✍️ Touch for note</span>
                      </span>
                    </div>
                  </div>

                  {/* Caption & Date */}
                  <div className="polaroid-caption truncate px-1 mt-2 font-bold text-slate-900 tracking-tight">
                    {memory.title}
                  </div>

                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-500 uppercase tracking-widest mt-1 px-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-pink-500/70" />
                      <span>{memory.date}</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPhoto(index);
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-pink-600 transition-colors"
                      title="View fullscreen"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ================= Back of Polaroid (Romantic Note) ================= */}
                <div className="polaroid-face-back select-none">
                  {/* Decorative Washi Tape */}
                  <div className="polaroid-washi-tape" />

                  {/* Card Header */}
                  <div className="pt-2 text-center">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-pink-600 font-bold">
                      Keepsake Note 💌
                    </span>
                    <h3 className="font-serif font-bold text-slate-900 text-sm mt-0.5 truncate">
                      {memory.title}
                    </h3>
                  </div>

                  {/* Handwritten Romantic Note */}
                  <div className="polaroid-note-card">
                    <p className="polaroid-note-caption">
                      “{memory.caption}” ♡
                    </p>
                  </div>

                  {/* Footer Meta & Action Buttons */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
                      <span>📅 {memory.date}</span>
                      <span className="text-pink-600">{memory.tag}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/80">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPhoto(index);
                        }}
                        className="flex-1 py-1.5 px-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-[11px] font-medium flex items-center justify-center gap-1 transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Fullscreen</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardTouch(memory.id);
                        }}
                        className="py-1.5 px-3 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[11px] font-medium flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                        title="Flip back"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Flip</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <PhotoLightbox
          memory={allMemories[selectedIndex]}
          currentIndex={selectedIndex}
          totalCount={allMemories.length}
          onClose={handleClose}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      )}
    </section>
  );
};
