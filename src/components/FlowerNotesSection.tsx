import React, { useState } from 'react';
import { Sparkles, CheckCircle2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { giftContent, type FlowerNoteItem } from '../data/giftContent';
import { soundEngine } from '../utils/audio';

export const FlowerNotesSection: React.FC = () => {
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [activeNote, setActiveNote] = useState<FlowerNoteItem | null>(null);

  const handleFlowerClick = (flower: FlowerNoteItem) => {
    soundEngine.playSparkle();

    if (!unlockedIds.includes(flower.id)) {
      const nextUnlocked = [...unlockedIds, flower.id];
      setUnlockedIds(nextUnlocked);

      if (nextUnlocked.length === giftContent.flowerNotes.length) {
        soundEngine.playHarpStrum();
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f472b6', '#fda4af', '#fde047', '#a855f7'],
        });
      }
    }

    setActiveNote(flower);
  };

  const handleClose = () => setActiveNote(null);

  const unlockedCount = unlockedIds.length;
  const totalCount = giftContent.flowerNotes.length;

  return (
    <section id="notes" className="relative py-16 px-4 z-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-400/20 text-rose-300 text-xs font-medium uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Little Whispers</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">
          The Flower Notes
        </h2>
        <p className="text-slate-300 text-sm sm:text-base max-w-md mx-auto font-light">
          Tap each blossom along the path to unfurl a gentle reason why you are cherished.
        </p>

        {/* Discovery Tracker */}
        <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-slate-900/60 border border-white/10 backdrop-blur-md">
          <span className="text-xs text-slate-300">Blossoms opened:</span>
          <span className="text-xs font-bold text-pink-300">
            {unlockedCount} / {totalCount}
          </span>
          {unlockedCount === totalCount && (
            <span className="text-xs text-amber-300 font-medium flex items-center gap-1 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" /> All Bloomed!
            </span>
          )}
        </div>
      </div>

      {/* Interactive Flowers Trail */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {giftContent.flowerNotes.map((flower) => {
          const isUnlocked = unlockedIds.includes(flower.id);

          return (
            <div
              key={flower.id}
              onClick={() => handleFlowerClick(flower)}
              className={`flower-button relative p-6 rounded-2xl cursor-pointer backdrop-blur-md border transition-all duration-300 text-left ${
                isUnlocked
                  ? 'bg-slate-900/70 border-pink-400/40 shadow-lg shadow-pink-500/10 hover:border-pink-300'
                  : 'bg-slate-900/40 border-white/10 hover:border-pink-400/30 hover:bg-slate-900/60'
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleFlowerClick(flower);
                }
              }}
              aria-label={`Open flower note: ${flower.name}`}
            >
              {/* Glow Aura */}
              <div
                className="absolute -top-3 -right-3 w-16 h-16 rounded-full opacity-30 blur-xl pointer-events-none"
                style={{ backgroundColor: flower.color }}
              />

              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                  <span className={isUnlocked ? 'animate-bounce' : 'flower-pulse'}>
                    {flower.emoji}
                  </span>
                </div>
                {isUnlocked ? (
                  <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-semibold tracking-wider uppercase border border-pink-500/30">
                    Bloomed
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-400 text-[10px] tracking-wider uppercase">
                    Tap to open
                  </span>
                )}
              </div>

              <h3 className="font-serif text-lg font-semibold text-white mb-1">
                {flower.title}
              </h3>
              <p className="text-xs text-pink-200/80 mb-2 font-mono">
                {flower.name}
              </p>
              <p className="text-xs text-slate-300 line-clamp-2 font-light">
                {isUnlocked ? flower.note : 'A hidden note waiting to be read...'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Flower Note Modal Dialog */}
      {activeNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={handleClose}
        >
          <div
            className="relative max-w-md w-full bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/90 rounded-3xl p-6 sm:p-8 border border-pink-400/30 shadow-2xl text-center animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close note"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Blossom Emoji Icon */}
            <div className="mx-auto w-20 h-20 rounded-full bg-pink-500/10 border border-pink-400/30 flex items-center justify-center text-4xl mb-4 shadow-lg shadow-pink-500/20">
              <span className="animate-pulse">{activeNote.emoji}</span>
            </div>

            <span className="text-xs font-mono text-pink-300 uppercase tracking-widest">
              {activeNote.name}
            </span>

            <h3 className="font-serif text-2xl font-bold text-white mt-1 mb-4">
              {activeNote.title}
            </h3>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 text-left">
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-light">
                “{activeNote.note}”
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 text-xs font-semibold uppercase tracking-wider border border-pink-400/30 transition-colors"
            >
              Close & Keep in Heart
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
