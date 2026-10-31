import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Gift, Check, Award, Flame, Heart } from 'lucide-react';
import { giftContent } from '../data/giftContent';
import { soundEngine } from '../utils/audio';

export const HiddenSurpriseSection: React.FC = () => {
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [isClaimed, setIsClaimed] = useState<boolean>(false);

  const handleReveal = () => {
    soundEngine.playSparkle();

    // Confetti celebration
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#fbbf24', '#f472b6', '#f59e0b', '#ffffff'],
    });

    setIsRevealed(true);
  };

  const handleClaim = () => {
    soundEngine.playChime(659.25, 1.5, 0.15);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    setIsClaimed(true);
  };

  return (
    <section id="surprise" className="relative py-16 px-4 z-10 max-w-3xl mx-auto">
      {/* Teaser state before unlocking */}
      {!isRevealed ? (
        <div className="relative p-8 sm:p-10 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-amber-400/30 text-center shadow-2xl overflow-hidden group">
          {/* Subtle glowing ambient halo */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/15 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-400/25 transition-all duration-700" />

          {/* Mystery Pulsing Firefly Beacon */}
          <div className="relative inline-block mb-6">
            <button
              onClick={handleReveal}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 p-0.5 shadow-xl shadow-amber-500/30 hover:scale-110 active:scale-95 transition-all duration-300 flower-pulse cursor-pointer flex items-center justify-center"
              aria-label="Unlock hidden surprise"
            >
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                <Gift className="w-8 h-8 text-amber-300 animate-pulse" />
              </div>
            </button>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" />
            </span>
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">
            A Secret Along the Pathway...
          </h3>
          <p className="text-slate-300 text-sm max-w-md mx-auto mb-6 font-light">
            There’s something glowing between the garden leaves. Tap the golden beacon to discover what is hidden.
          </p>

          <button
            onClick={handleReveal}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Secret Surprise</span>
          </button>
        </div>
      ) : (
        /* The Golden Date Night Pass Revealed */
        <div className="animate-scale-up">
          <div className="golden-ticket rounded-3xl p-6 sm:p-8 text-slate-900 shadow-2xl">
            {/* Header / Seal */}
            <div className="flex items-center justify-between border-b border-amber-900/20 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-900" />
                <span className="text-[11px] font-mono tracking-widest font-bold uppercase text-amber-950">
                  {giftContent.surprise.badge}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold bg-amber-900/15 px-2.5 py-1 rounded text-amber-950 border border-amber-900/20">
                  NO. 0001-LOVE
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <h3 className="font-serif text-3xl sm:text-4xl font-black text-amber-950 tracking-tight mb-1">
                {giftContent.surprise.title}
              </h3>
              <p className="text-sm text-amber-900 font-medium">
                {giftContent.surprise.subtitle}
              </p>
            </div>

            {/* Perks list */}
            <div className="bg-amber-50/75 backdrop-blur-sm rounded-2xl p-5 border border-amber-200/80 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-3 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600" />
                <span>Your Exclusive Entitlements:</span>
              </h4>
              <ul className="space-y-2 text-sm text-amber-950">
                {giftContent.surprise.perks.map((perk, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span className="leading-tight">{perk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Voucher Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-center sm:text-left">
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-900">
                  Verification Code:
                </div>
                <div className="font-mono font-black text-base tracking-widest text-amber-950">
                  {giftContent.surprise.couponCode}
                </div>
                <div className="text-[11px] text-amber-900/80 italic mt-0.5">
                  {giftContent.surprise.validity}
                </div>
              </div>

              {/* Claim Button */}
              <button
                onClick={handleClaim}
                disabled={isClaimed}
                className={`px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shadow-lg ${
                  isClaimed
                    ? 'bg-emerald-800 text-white shadow-emerald-900/30 cursor-default'
                    : 'bg-amber-950 text-amber-100 hover:bg-black hover:scale-105 active:scale-95 shadow-amber-950/40'
                }`}
              >
                {isClaimed ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Redeemed & Active Forever</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-amber-300 text-amber-300" />
                    <span>Redeem This Pass</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
