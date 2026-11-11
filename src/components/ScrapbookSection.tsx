import React, { useState, useEffect } from 'react';
import {
  Camera,
  Calendar,
  ZoomIn,
  LayoutGrid,
  Layers,
  Heart,
  MessageCircle,
  MoreHorizontal,
  MoreVertical,
  Image as ImageIcon,
  Play,
  Film,
} from 'lucide-react';
import { giftContent, type MemoryItem } from '../data/giftContent';
import { PhotoLightbox } from './PhotoLightbox';
import { soundEngine } from '../utils/audio';
import { memoryArchiveService } from '../services/gardenService';
import { formatMemoryDisplayTitle } from './garden/LittleArchiveSection';

interface ScrapbookSectionProps {
  onOpenArchive?: () => void;
}

export const ScrapbookSection: React.FC<ScrapbookSectionProps> = ({ onOpenArchive }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [archiveMemories, setArchiveMemories] = useState<MemoryItem[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('grid');
  const [likedCards, setLikedCards] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

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
            tag: m.contributorName ? `Pinned by ${m.contributorName}` : 'Pinned',
            accentColor: 'from-pink-500/20 to-purple-500/20',
            photoUrl: m.photoUrl,
            videoUrl: m.videoUrl,
            videoMediaId: m.videoMediaId,
            mediaType: m.mediaType,
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
    window.addEventListener('garden-memory-added', handleUpdate);
    window.addEventListener('garden-memories-updated', handleUpdate);
    window.addEventListener('garden-memory-deleted', handleUpdate);
    window.addEventListener('garden-bin-updated', handleUpdate);
    return () => {
      window.removeEventListener('garden-memory-added', handleUpdate);
      window.removeEventListener('garden-memories-updated', handleUpdate);
      window.removeEventListener('garden-memory-deleted', handleUpdate);
      window.removeEventListener('garden-bin-updated', handleUpdate);
    };
  }, []);

  const deletedIds = new Set(memoryArchiveService.getDeletedMemoryIds());
  // Deduplicate by memory ID and media key so pictures and videos never multiply
  const seenIds = new Set<string>();
  const seenMedia = new Set<string>();
  const allMemories: MemoryItem[] = [];
  for (const m of [...giftContent.memories, ...archiveMemories]) {
    const mediaKey = m.videoMediaId || `${m.title.toLowerCase().trim()}_${(m.date || '').trim()}`;
    if (!seenIds.has(m.id) && !seenMedia.has(mediaKey) && !deletedIds.has(m.id)) {
      seenIds.add(m.id);
      seenMedia.add(mediaKey);
      allMemories.push(m);
    }
  }

  const handleOpenPhoto = (index: number) => {
    soundEngine.playChime(523.25, 1.2, 0.08);
    setSelectedIndex(index);
  };

  const handleClose = () => {
    soundEngine.playSparkle();
    setSelectedIndex(null);
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < allMemories.length - 1) {
      soundEngine.playSparkle();
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      soundEngine.playSparkle();
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleToggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playSparkle();
    const isLiked = !likedCards[id];
    setLikedCards((prev) => ({ ...prev, [id]: isLiked }));
    setLikeCounts((prev) => ({
      ...prev,
      [id]: (prev[id] || getInitialLikes(id)) + (isLiked ? 1 : -1),
    }));
  };

  const getInitialLikes = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
    return Math.abs(hash % 35) + 15;
  };

  const getInitialComments = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash << 3) - hash + id.charCodeAt(i);
    return Math.abs(hash % 8) + 1;
  };

  return (
    <section id="memories" className="relative py-12 px-3 sm:px-4 z-10 max-w-5xl mx-auto">
      {/* Top Banner Button — Matching Mockup Reference */}
      <div
        onClick={() => {
          soundEngine.playSparkle();
          if (onOpenArchive) onOpenArchive();
        }}
        className="add-memory-banner group"
        title="Pin a Photo or Video to Our Album"
      >
        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white border border-white/30 shrink-0 group-hover:scale-105 transition-transform shadow-sm">
          <Camera className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 text-left">
          <h3 className="font-bold text-base text-white tracking-wide leading-tight flex items-center gap-1.5">
            <span>Pin a Photo or Video to Our Album</span>
            <span className="text-pink-300">📸 🎬</span>
          </h3>
          <p className="text-xs text-pink-200/90 font-serif italic mt-0.5 leading-tight">
            Capture moments & video clips, share thoughts ♡
          </p>
        </div>
      </div>

      {/* View Switcher Tabs — Matching Mockup Reference */}
      <div className="archive-tabs">
        <button
          type="button"
          onClick={() => {
            soundEngine.playSparkle();
            setViewMode('cards');
          }}
          className={`archive-tab ${viewMode === 'cards' ? 'active' : ''}`}
        >
          <Layers className={`w-4 h-4 ${viewMode === 'cards' ? 'text-white' : 'text-pink-300'}`} />
          <div className="text-left">
            <div className="leading-tight">Keepsake Cards</div>
            <div className="text-[10px] opacity-80 font-normal leading-tight mt-0.5">Clear Notes</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEngine.playSparkle();
            setViewMode('grid');
          }}
          className={`archive-tab ${viewMode === 'grid' ? 'active' : ''}`}
        >
          <LayoutGrid className={`w-4 h-4 ${viewMode === 'grid' ? 'text-white' : 'text-purple-300'}`} />
          <div className="text-left">
            <div className="leading-tight">Mini Grid</div>
            <div className="text-[10px] opacity-80 font-normal leading-tight mt-0.5">Compact View ✨</div>
          </div>
        </button>
      </div>

      {/* Grid of Memory Cards */}
      {viewMode === 'grid' ? (
        /* ================= Mini Grid Mode (Horizontal Split Glass Cards) ================= */
        <div className="archive-memory-grid">
          {allMemories.map((memory, index) => {
            const isLiked = Boolean(likedCards[memory.id]);
            const count = likeCounts[memory.id] || getInitialLikes(memory.id);
            const comments = getInitialComments(memory.id);
            const categoryTag = memory.tag?.replace(/Pinned by/i, '').trim() || 'Moment';

            return (
              <div
                key={memory.id}
                className="archive-card group"
                onClick={() => handleOpenPhoto(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleOpenPhoto(index);
                }}
              >
                {/* Left Side: Photo with Heart & Count Badges */}
                <div className="archive-card-image-wrap">
                  <img
                    src={memory.photoUrl || '/assets/memories/photo-holding-hands.jpg'}
                    alt={memory.altText || memory.title}
                    className="archive-card-image"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/dreamy_night_garden.jpg';
                    }}
                  />

                  {/* Video Play Icon Overlay */}
                  {memory.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none z-10">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg border-2 border-white/90">
                        <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Favorite Heart Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleLike(memory.id, e)}
                    className="archive-card-favourite"
                    title={isLiked ? 'Loved!' : 'Love this memory'}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-transform ${
                        isLiked ? 'fill-pink-400 text-pink-400 scale-110' : 'text-white'
                      }`}
                    />
                  </button>

                  {/* Photo or Video count badge */}
                  {memory.videoUrl ? (
                    <div className="archive-card-photo-count bg-black/70 text-amber-200 border border-amber-300/40">
                      <Film className="w-2.5 h-2.5 text-amber-300" />
                      <span>Video</span>
                    </div>
                  ) : (
                    <div className="archive-card-photo-count">
                      <ImageIcon className="w-2.5 h-2.5" />
                      <span>1</span>
                    </div>
                  )}
                </div>

                {/* Right Side: Details & Romantic Note */}
                <div className="archive-card-details">
                  {/* Category Pill & Menu */}
                  <div className="archive-card-header-row">
                    <span className="archive-card-category truncate max-w-[120px]">
                      {categoryTag}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPhoto(index);
                      }}
                      className="text-slate-300 hover:text-white p-1 rounded-full cursor-pointer"
                      title="View memory"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title in Caveat Cursive Font */}
                  <h3 className="archive-card-title truncate" title={memory.title}>
                    {memory.title}
                  </h3>

                  {/* Note Caption Preview */}
                  <p className="archive-card-note line-clamp-2" title={memory.caption}>
                    {memory.caption} ♡
                  </p>

                  {/* Date */}
                  <div className="archive-card-date">
                    <Calendar className="w-3 h-3 text-pink-300/80" />
                    <span>{memory.date}</span>
                  </div>

                  {/* Footer Stats & Actions */}
                  <div className="archive-card-footer">
                    <div className="archive-card-stats">
                      <button
                        type="button"
                        onClick={(e) => handleToggleLike(memory.id, e)}
                        className="archive-card-stat-btn text-pink-300 hover:text-pink-200"
                      >
                        <Heart
                          className={`w-3 h-3 ${isLiked ? 'fill-pink-400 text-pink-400' : ''}`}
                        />
                        <span>{count}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPhoto(index);
                        }}
                        className="archive-card-stat-btn text-purple-300 hover:text-purple-200"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>{comments}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPhoto(index);
                      }}
                      className="text-slate-300 hover:text-pink-300 p-0.5 cursor-pointer"
                      title="Fullscreen"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtle corner blossom decoration */}
                <span className="cherry-blossom-corner">🌸</span>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= Keepsake Cards Mode (Full Notes Luxury View) ================= */
        <div className="space-y-6 max-w-xl mx-auto">
          {allMemories.map((memory, index) => {
            const isLiked = Boolean(likedCards[memory.id]);
            const count = likeCounts[memory.id] || getInitialLikes(memory.id);

            return (
              <div
                key={memory.id}
                className="keepsake-album-card group cursor-pointer"
                onClick={() => handleOpenPhoto(index)}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-pink-300/20">
                  <span className="keepsake-album-label flex items-center gap-1.5">
                    <span>Keepsake Note 💌</span>
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-pink-200/80">
                    <Calendar className="w-3 h-3 text-pink-300" />
                    <span>{memory.date}</span>
                  </div>
                </div>

                {/* Photo Preview in Keepsake Card */}
                <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden my-4 border border-pink-300/30 shadow-md">
                  <img
                    src={memory.photoUrl || '/assets/memories/photo-holding-hands.jpg'}
                    alt={memory.title}
                    className="w-full h-full object-cover object-[center_18%] group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Video Play Icon Overlay */}
                  {memory.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none z-10">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg border-2 border-white/90">
                        <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                      </div>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs text-white border border-white/20 flex items-center gap-1.5">
                    {memory.videoUrl && <Film className="w-3 h-3 text-amber-300" />}
                    <span>{memory.videoUrl ? 'Video Keepsake' : memory.tag}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPhoto(index);
                    }}
                    className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-pink-500 transition-colors z-10"
                    title={memory.videoUrl ? 'Play Video' : 'Fullscreen'}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                {/* Title in Caveat */}
                <h3 className="keepsake-album-title">
                  {memory.title}
                </h3>

                {/* Complete Unclipped Romantic Note */}
                <div className="p-4 rounded-2xl bg-white/[0.06] border border-pink-300/30 my-2">
                  <p className="keepsake-album-text">
                    “{memory.caption}” ♡
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-pink-300/20 text-xs">
                  <button
                    type="button"
                    onClick={(e) => handleToggleLike(memory.id, e)}
                    className="flex items-center gap-1.5 text-pink-300 hover:text-pink-200 font-semibold"
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-400 text-pink-400' : ''}`} />
                    <span>{count} Loves</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPhoto(index);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-medium flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>View Fullscreen</span>
                  </button>
                </div>

                <span className="cherry-blossom-corner">🌸</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Button — Matching Mockup */}
      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={() => {
            soundEngine.playSparkle();
            if (onOpenArchive) onOpenArchive();
          }}
          className="add-new-moment-btn"
        >
          <Camera className="w-4 h-4 text-white" />
          <span>Add a New Moment ✨</span>
        </button>
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
