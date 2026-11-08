import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, X, Shield, Sparkles, AlertTriangle } from 'lucide-react';
import { memoryArchiveService } from '../../services/gardenService';
import type { DeletedMemoryItem, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

interface GardenBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export const GardenBinModal: React.FC<GardenBinModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [deletedItems, setDeletedItems] = useState<DeletedMemoryItem[]>([]);

  const refreshBin = () => {
    const items = memoryArchiveService.getDeletedMemories(currentUser.id);
    setDeletedItems(items);
  };

  useEffect(() => {
    if (isOpen) {
      refreshBin();
    }
    const handleUpdate = () => refreshBin();
    window.addEventListener('garden-bin-updated', handleUpdate);
    return () => window.removeEventListener('garden-bin-updated', handleUpdate);
  }, [isOpen, currentUser.id]);

  if (!isOpen) return null;

  const handleRestore = async (id: string) => {
    soundEngine.playSparkle();
    await memoryArchiveService.restoreMemory(id);
    refreshBin();
  };

  const handlePermanentDelete = async (id: string, title: string) => {
    if (window.confirm(`Permanently delete "${title}"? This cannot be undone.`)) {
      soundEngine.playSparkle();
      await memoryArchiveService.permanentlyDelete(id);
      refreshBin();
    }
  };

  const handleEmptyBin = async () => {
    if (deletedItems.length === 0) return;
    if (
      window.confirm(
        `Are you sure you want to permanently empty your bin (${deletedItems.length} items)? This cannot be undone.`
      )
    ) {
      soundEngine.playSparkle();
      await memoryArchiveService.emptyBin(currentUser.id);
      refreshBin();
    }
  };

  const formatDeletedDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-3.5 bg-black/90 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
      style={{ zIndex: 20000 }}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-pink-400/40 shadow-2xl p-4 sm:p-6 text-white max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#130728',
          boxShadow: '0 25px 70px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-pink-400/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base sm:text-lg text-white">
                  Garden Recycle Bin
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  <span>Private</span>
                </span>
              </div>
              <p className="text-[11px] text-pink-200/80 font-sans mt-0.5">
                Private to {currentUser.displayName} • Only you can view or restore your bin
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar when items exist */}
        {deletedItems.length > 0 && (
          <div className="py-2.5 px-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between my-3 text-xs shrink-0">
            <span className="text-[11px] text-pink-200/90 font-mono">
              {deletedItems.length} deleted memory{deletedItems.length > 1 ? 's' : ''} in your bin
            </span>
            <button
              type="button"
              onClick={handleEmptyBin}
              className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/30 text-rose-300 text-[11px] font-medium transition-all active:scale-95 cursor-pointer"
            >
              Empty My Bin 🗑️
            </button>
          </div>
        )}

        {/* Deleted Items List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 my-2 pr-1 min-h-[160px] scrollbar-thin">
          {deletedItems.length === 0 ? (
            <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-pink-300">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="font-serif text-sm font-bold text-white">Your Bin is Empty</h4>
              <p className="text-xs text-purple-200/70 max-w-xs font-sans leading-relaxed">
                When you delete photos from the album or scrapbook, they safely arrive here. You can restore them anytime or permanently delete them.
              </p>
            </div>
          ) : (
            deletedItems.map((item) => {
              const mem = item.originalMemory;
              const displayTitle = mem.title || 'Treasured Keepsake ♡';

              return (
                <div
                  key={item.id}
                  className="p-2.5 rounded-2xl bg-white/[0.05] border border-pink-400/25 hover:border-pink-300/40 transition-all flex items-center justify-between gap-3 group"
                >
                  {/* Left: Thumbnail & Title */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-purple-950 border border-pink-300/30 shrink-0">
                      <img
                        src={mem.photoUrl || '/assets/dreamy_night_garden.jpg'}
                        alt={displayTitle}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/dreamy_night_garden.jpg';
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-serif font-bold text-xs text-white truncate" title={displayTitle}>
                        {displayTitle}
                      </h4>
                      <p className="text-[10px] text-pink-200/70 italic truncate mt-0.5">
                        “{mem.caption || mem.description || 'Memories kept in bloom'}”
                      </p>
                      <span className="text-[9.5px] font-mono text-purple-300/80 block mt-1">
                        Deleted: {formatDeletedDate(item.deletedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRestore(item.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/30 text-emerald-300 text-[11px] font-medium flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
                      title="Restore memory back to album"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePermanentDelete(item.id, displayTitle)}
                      className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/30 text-rose-300 transition-all active:scale-95 cursor-pointer"
                      title="Permanently Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info note */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-purple-200/70 font-sans shrink-0">
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-300" />
            <span>Items in bin are kept safe until permanently cleared</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
