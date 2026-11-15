import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PartyPopper, Sparkles, X } from 'lucide-react';
import { getTodayCelebration, type UpcomingCelebration } from '../../services/celebrationService';
import { soundEngine } from '../../utils/audio';

export const CelebrationPopModal: React.FC = () => {
  const [activeCelebration, setActiveCelebration] = useState<UpcomingCelebration | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fireCelebrationConfetti = () => {
    try {
      soundEngine.playSparkle();
      // Left cannon
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 80,
        origin: { x: 0.05, y: 0.7 },
        colors: ['#f472b6', '#ec4899', '#fbbf24', '#f59e0b', '#a855f7', '#60a5fa'],
      });
      // Right cannon
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 80,
        origin: { x: 0.95, y: 0.7 },
        colors: ['#f472b6', '#ec4899', '#fbbf24', '#f59e0b', '#a855f7', '#60a5fa'],
      });
      // Center starburst
      setTimeout(() => {
        confetti({
          particleCount: 40,
          spread: 100,
          origin: { x: 0.5, y: 0.4 },
          scalar: 1.2,
        });
      }, 250);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    // 1. Check if today is a celebration date
    const today = getTodayCelebration();
    if (today) {
      const sessionKey = `pt_celebrated_${today.id}_${new Date().toDateString()}`;
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, 'true');
        setActiveCelebration(today);
        setIsOpen(true);
        setTimeout(fireCelebrationConfetti, 400);
      }
    }

    // 2. Listen for manual trigger events (e.g. from countdown widget chips)
    const handleManualTrigger = (e: CustomEvent<{ celebration: UpcomingCelebration }>) => {
      if (e.detail?.celebration) {
        setActiveCelebration(e.detail.celebration);
        setIsOpen(true);
        setTimeout(fireCelebrationConfetti, 200);
      }
    };

    window.addEventListener('garden-trigger-celebration' as any, handleManualTrigger);
    return () => {
      window.removeEventListener('garden-trigger-celebration' as any, handleManualTrigger);
    };
  }, []);

  if (!isOpen || !activeCelebration) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-sm rounded-3xl p-6 sm:p-7 text-center overflow-hidden border border-pink-400/40 shadow-2xl bg-gradient-to-br from-[#200d3b] via-[#2e104f] to-[#120524] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient glow backgrounds */}
        <div className="pointer-events-none absolute -top-16 -left-16 w-44 h-44 rounded-full bg-pink-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 w-44 h-44 rounded-full bg-amber-500/25 blur-3xl" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-pink-200 hover:text-white transition-all cursor-pointer"
          title="Close celebration"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Celebration Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-amber-500/30 border border-pink-400/40 text-amber-200 text-xs font-mono font-bold tracking-wider uppercase mb-4 shadow-sm">
          <PartyPopper className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
          <span>Special Celebration ✨</span>
        </div>

        {/* Celebration Giant Icon / Emoji */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-pink-500/30 to-purple-500/30 border border-pink-400/50 flex items-center justify-center text-4xl shadow-lg shadow-pink-500/20 mb-4 animate-pulse">
          {activeCelebration.emoji || '🎉'}
        </div>

        {/* Title */}
        <h3 className="font-serif text-2xl font-bold text-white tracking-wide leading-tight mb-2 drop-shadow-md">
          {activeCelebration.title}
        </h3>

        {/* Subtitle / Wish */}
        <p className="font-serif italic text-sm text-pink-100/95 leading-relaxed mb-6 px-1">
          “{activeCelebration.subtitle}” ♡
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={fireCelebrationConfetti}
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-pink-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Pop More Confetti! 🎊</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-pink-200 hover:text-white text-xs font-medium transition-all cursor-pointer"
          >
            Enjoy the Day ♡
          </button>
        </div>
      </div>
    </div>
  );
};
