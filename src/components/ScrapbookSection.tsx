import React, { useState } from 'react';
import { Camera, Calendar, ZoomIn } from 'lucide-react';
import { giftContent } from '../data/giftContent';
import { PhotoLightbox } from './PhotoLightbox';
import { soundEngine } from '../utils/audio';

const rotationClasses = [
  'rotate-[-2deg] hover:rotate-0',
  'rotate-[1.5deg] hover:rotate-0',
  'rotate-[-1.8deg] hover:rotate-0',
  'rotate-[2.2deg] hover:rotate-0',
  'rotate-[-1deg] hover:rotate-0',
  'rotate-[1.8deg] hover:rotate-0',
];

export const ScrapbookSection: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleOpenPhoto = (index: number) => {
    soundEngine.playChime(523.25, 1.2, 0.08);
    setSelectedIndex(index);
  };

  const handleClose = () => setSelectedIndex(null);

  const handleNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % giftContent.memories.length);
  };

  const handlePrev = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + giftContent.memories.length) % giftContent.memories.length);
  };

  return (
    <section id="memories" className="relative py-16 px-4 z-10 max-w-5xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-400/20 text-pink-300 text-xs font-medium uppercase tracking-wider mb-3">
          <Camera className="w-3.5 h-3.5" />
          <span>Our Scrapbook</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">
          Moments Kept in Bloom
        </h2>
        <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto font-light">
          Snapshots of quiet laughter, gentle talks, and the days I never want to forget.
        </p>
      </div>

      {/* Polaroid Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-6 lg:gap-8 px-2 sm:px-4">
        {giftContent.memories.map((memory, index) => {
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
              {/* Photo Frame */}
              <div className="polaroid-image-wrapper relative">
                <img
                  src={memory.photoUrl || '/assets/memories/photo-holding-hands.jpg'}
                  alt={memory.altText || memory.title}
                  className="polaroid-image"
                  style={{
                    objectPosition: memory.objectPosition || 'center',
                    filter: memory.filter || undefined,
                  }}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/dreamy_night_garden.jpg';
                  }}
                />
                
                {/* Subtle zoom badge on desktop hover only */}
                <div className="absolute inset-0 bg-pink-950/20 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center pointer-events-none">
                  <span className="p-2 rounded-full bg-white/80 text-slate-800 shadow-md backdrop-blur-sm transform scale-75 group-hover:scale-100 transition-transform">
                    <ZoomIn className="w-4 h-4 text-pink-600" />
                  </span>
                </div>

                {/* Tag Badge */}
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-[10px] text-pink-200 border border-white/20">
                  {memory.tag}
                </div>
              </div>

              {/* Caption & Date */}
              <div className="polaroid-caption">
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
          memory={giftContent.memories[selectedIndex]}
          currentIndex={selectedIndex}
          totalCount={giftContent.memories.length}
          onClose={handleClose}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      )}
    </section>
  );
};
