import React, { useState, useEffect } from 'react';
import { Camera, Calendar, Plus, RotateCw, ZoomIn, LayoutGrid, Layers } from 'lucide-react';
import { giftContent, type MemoryItem } from '../data/giftContent';
import { PhotoLightbox } from './PhotoLightbox';
import { soundEngine } from '../utils/audio';
import { memoryArchiveService } from '../services/gardenService';
import { formatMemoryDisplayTitle } from './garden/LittleArchiveSection';

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
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards');

  const loadArchiveMemories = async () => {
    try {
      const items = await memoryArchiveService.getMemories();
      const mapped: MemoryItem[] = items
        .filter((m) => !m.id.startsWith('seed-') && Boolean(m.isShared))
        .map((m) => {
          const displayTitle = formatMemoryDisplayTitle(m.title, m.caption, m.dateTaken);
          return {
            id: m.id,
            title: displayTitle,
            date: m.dateTaken || 'Keepsake Date',
            caption: m.caption || m.description || 'Pinned in our garden album.',
            tag: m.contributorName ? `Pinned by ${m.contributorName}` : 'Pinned Memory',
            accentColor: 'from-pink-500/20 to-purple-500/20',
            photoUrl: m.photoUrl,
            altText: displayTitle,
          };
        });
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
      <div className="text-center mb-6">
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

      {/* Mobile View Mode Switcher (World-Class Format) */}
      <div className="flex items-center justify-center gap-2 mb-6 sm:hidden">
        <button
          type="button"
          onClick={() => {
            soundEngine.playSparkle();
            setViewMode('cards');
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            viewMode === 'cards'
              ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-white border border-pink-400/50 shadow-md scale-105'
              : 'bg-white/5 text-slate-300 border border-white/10'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-pink-300" />
          <span>Keepsake Cards (Clear Notes)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEngine.playSparkle();
            setViewMode('grid');
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            viewMode === 'grid'
              ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-white border border-pink-400/50 shadow-md scale-105'
              : 'bg-white/5 text-slate-300 border border-white/10'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 text-purple-300" />
          <span>Mini Grid</span>
        </button>
      </div>

      {/* Polaroid Grid */}
      <div
        className={`grid ${
          viewMode === 'grid'
            ? 'scrapbook-grid-mode grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3'
            : 'scrapbook-cards-mode grid-cols-1 mx-auto sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'
        } px-2 sm:px-4`}
      >
        {allMemories.map((memory, index) => {
          const rotationClass = rotationClasses[index % rotationClasses.length];
          const isNoteOpen = Boolean(flippedCards[memory.id]);

          return (
            <div
              key={memory.id}
              className={`polaroid-container ${rotationClass} transform transition-all duration-300`}
            >
              <div
                className={`polaroid-card ${viewMode === 'grid' ? 'polaroid-card-compact' : ''}`}
                onClick={() => handleCardTouch(memory.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardTouch(memory.id);
                  }
                }}
                aria-label={`Keepsake: ${memory.title}. Touch to view romantic note`}
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

                  {/* Main Photo (Dims gracefully when note is open so you still see the photo!) */}
                  <img
                    src={memory.photoUrl || '/assets/memories/photo-holding-hands.jpg'}
                    alt={memory.altText || memory.title}
                    className={`polaroid-image ${isNoteOpen ? 'polaroid-image-dimmed' : ''}`}
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

                  {/* Touch To See Note Badge (Only visible when note is resting) */}
                  {!isNoteOpen && (
                    <div className="absolute bottom-2 right-2 z-10">
                      <span className="polaroid-tap-hint">
                        <span>✍️ Touch for note</span>
                      </span>
                    </div>
                  )}

                  {/* ================= Luminous Keepsake Note Glass Overlay ================= */}
                  {/* Emerges over the dimmed photo so you read the note while seeing the picture! */}
                  {isNoteOpen && (
                    <div
                      className="polaroid-note-overlay"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardTouch(memory.id);
                      }}
                    >
                      {/* Decorative Washi Tape */}
                      <div className="polaroid-washi-tape" />

                      {/* Card Header */}
                      <div className="pt-1.5 text-center px-1 shrink-0">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-pink-300 font-bold drop-shadow">
                          Keepsake Note 💌
                        </span>
                        <h3 className="font-serif font-bold text-white text-sm mt-0.5 line-clamp-1 drop-shadow-sm">
                          {memory.title}
                        </h3>
                      </div>

                      {/* Handwritten Romantic Note Box */}
                      <div
                        className="polaroid-note-overlay-card"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="polaroid-note-overlay-caption">
                          “{memory.caption}” ♡
                        </p>
                      </div>

                      {/* Footer Meta & Action Buttons */}
                      <div className="shrink-0 space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-pink-200/90 px-1">
                          <span>📅 {memory.date}</span>
                          <span className="text-pink-300 font-medium">{memory.tag}</span>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-white/20">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPhoto(index);
                            }}
                            className="flex-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>Fullscreen 🔍</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardTouch(memory.id);
                            }}
                            className="py-1.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-white/25 backdrop-blur-sm"
                            title="Brighten photo"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                            <span>Brighten ☀️</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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
