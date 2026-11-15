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
  const [previewItem, setPreviewItem] = useState<DeletedMemoryItem | null>(null);

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
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-600 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow"
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
                  className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.06] border border-pink-400/30 hover:border-pink-300/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  {/* Left: Thumbnail & Title (Tap to Preview) */}
                  <div
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      soundEngine.playSparkle();
                      setPreviewItem(item);
                    }}
                    title="Tap to preview deleted image"
                  >
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-purple-950 border border-pink-300/30 shrink-0 relative group/thumb">
                      <img
                        src={mem.photoUrl || '/assets/memories/photo-holding-hands.jpg'}
                        alt={displayTitle}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/memories/photo-holding-hands.jpg';
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-serif font-bold text-sm text-white truncate" title={displayTitle}>
                          {displayTitle}
                        </h4>
                        <span className="text-[10px] text-pink-300/70 font-sans">🔍 View</span>
                      </div>
                      <p className="text-xs text-pink-200/80 italic truncate mt-0.5">
                        “{mem.caption || mem.description || 'Memories kept in bloom'}”
                      </p>
                      <span className="text-[11px] font-mono text-purple-200/90 block mt-1">
                        Deleted: {formatDeletedDate(item.deletedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                    <button
                      type="button"
                      onClick={() => handleRestore(item.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/20"
                      title="Restore memory back to album"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-white" />
                      <span>Restore to Archive ↺</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePermanentDelete(item.id, displayTitle)}
                      className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-white border border-rose-400/30 transition-all active:scale-95 cursor-pointer"
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

      {/* Deleted Memory Preview Modal (When user taps an item to open it) */}
      {previewItem && (
        <div
          className="fixed inset-0 z-[25000] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl animate-fade-in"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-pink-400/40 shadow-2xl p-4 sm:p-5 text-white flex flex-col space-y-3"
            style={{
              backgroundColor: '#16082c',
              boxShadow: '0 25px 70px rgba(0,0,0,0.95)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-pink-400/20">
              <h4 className="font-serif font-bold text-base text-white truncate pr-2">
                {previewItem.originalMemory.title || 'Deleted Keepsake'}
              </h4>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Media Display */}
            <div className="relative rounded-2xl overflow-hidden max-h-[55vh] bg-purple-950 border border-pink-300/30 flex items-center justify-center">
              {previewItem.originalMemory.videoUrl ? (
                <video
                  src={previewItem.originalMemory.videoUrl}
                  controls
                  playsInline
                  className="max-h-[52vh] w-full object-contain"
                />
              ) : (
                <img
                  src={previewItem.originalMemory.photoUrl || '/assets/memories/photo-holding-hands.jpg'}
                  alt={previewItem.originalMemory.title}
                  className="max-h-[52vh] w-full object-contain"
                />
              )}
            </div>

            {previewItem.originalMemory.caption && (
              <p className="text-xs text-pink-200/90 italic text-center px-2">
                “{previewItem.originalMemory.caption}”
              </p>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleRestore(previewItem.id);
                  setPreviewItem(null);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <RotateCcw className="w-3.5 h-3.5 text-white" />
                <span>Restore to Archive ↺</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
