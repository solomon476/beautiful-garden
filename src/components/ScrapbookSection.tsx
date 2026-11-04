import React, { useState, useEffect } from 'react';
import { Camera, Calendar, Plus } from 'lucide-react';
import { giftContent, MemoryItem } from '../data/giftContent';
import { PhotoLightbox } from './PhotoLightbox';
import { soundEngine } from '../utils/audio';
import { memoryArchiveService } from '../services/gardenService';

const rotationClasses = [
  'rotate-[-2deg] hover:rotate-0',
  'rotate-[1.5deg] hover:rotate-0',
  'rotate-[-1.8deg] hover:rotate-0',
  'rotate-[2.2deg] hover:rotate-0',
  'rotate-[-1deg] hover:rotate-0',
  'rotate-[1.8deg] hover:rotate-0',
];

interface ScrapbookSectionProps {
  onOpenArchive?: () => void;
}

export const ScrapbookSection: React.FC<ScrapbookSectionProps> = ({ onOpenArchive }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [archiveMemories, setArchiveMemories] = useState<MemoryItem[]>([]);

  const loadArchiveMemories = async () => {
    try {
      const items = await memoryArchiveService.getMemories();
      const mapped: MemoryItem[] = items
        .filter((m) => !m.id.startsWith('seed-'))
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

  const handleOpenPhoto = (index: number) => {
    soundEngine.playChime(523.25, 1.2, 0.08);
    setSelectedIndex(index);
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500/20 via-rose-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-400/40 text-pink-200 text-xs sm:text-sm font-medium shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-pink-300" />
            <span>Pin a Photo to Our Album 📷</span>
          </button>
        )}
      </div>

      {/* Polaroid Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-6 lg:gap-8 px-2 sm:px-4">
        {allMemories.map((memory, index) => {
          const rotationClass = rotationClasses[index % rotationClasses.length];

          return (
            <div
              key={memory.id}
              onClick={() => handleOpenPhoto(index)}
              className={`polaroid-card group transform transition-all duration-300 ${rotationClass}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenPhoto(index);
                }
              }}
              aria-label={`View memory: ${memory.title}`}
            >
              {/* Photo Frame: Normal, Natural Proportions */}
              <div className="polaroid-image-wrapper relative">
                <img
                  src={memory.photoUrl || '/assets/memories/photo-holding-hands.jpg'}
                  alt={memory.altText || memory.title}
                  className="polaroid-image"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/dreamy_night_garden.jpg';
                  }}
                />

                {/* Tag Badge */}
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-[10px] text-pink-200 border border-white/20">
                  {memory.tag}
                </div>
              </div>

              {/* Caption & Date */}
              <div className="polaroid-caption truncate px-1">
                {memory.title}
              </div>

              <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                <Calendar className="w-3 h-3 text-pink-500/70" />
                <span>{memory.date}</span>
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
