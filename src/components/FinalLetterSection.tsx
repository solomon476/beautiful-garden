import React, { useState, useEffect } from 'react';
import { Mail, Heart, Sparkles, Download, ArrowUp, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { giftContent } from '../data/giftContent';
import { soundEngine } from '../utils/audio';

interface FinalLetterSectionProps {
  onScrollToTop: () => void;
}

export const FinalLetterSection: React.FC<FinalLetterSectionProps> = ({ onScrollToTop }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
  );

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleOpenLetter = () => {
    soundEngine.playHarpStrum();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#fda4af', '#f472b6', '#ffffff', '#fde047'],
    });
    setIsOpen(true);
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'To install this garden to your phone:\n\n• On iPhone: Tap the Share button in Safari, then choose "Add to Home Screen".\n• On Android: Tap the 3 dots in Chrome, then choose "Install App" or "Add to Home screen".'
      );
    }
  };

  return (
    <section id="letter" className="relative py-20 px-4 z-10 max-w-2xl mx-auto text-center">
      {/* Section Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-400/20 text-pink-300 text-xs font-medium uppercase tracking-wider mb-3">
          <Mail className="w-3.5 h-3.5" />
          <span>A Dedicated Keepsake</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
          The Keepsake Letter
        </h2>
        <p className="text-slate-300 text-sm max-w-sm mx-auto font-light">
          A personal note written for you, waiting to be unsealed.
        </p>
      </div>

      {/* Envelope / Sealed State */}
      {!isOpen ? (
        <div className="relative envelope-container max-w-md mx-auto p-8 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-pink-400/30 shadow-2xl flex flex-col items-center group">
          {/* Envelope Graphic Outline */}
          <div className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-b from-slate-800 to-indigo-950/80 border border-white/15 p-6 flex flex-col items-center justify-center relative shadow-inner">
            {/* Stamp Detail */}
            <div className="absolute top-4 right-4 w-12 h-14 rounded border border-dashed border-pink-400/50 flex flex-col items-center justify-center text-[10px] text-pink-300 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-pink-400 mb-0.5" />
              <span>NOTE</span>
            </div>

            {/* Recipient Address */}
            <div className="text-center font-display italic text-2xl text-pink-200/90 mb-8">
              For {giftContent.recipientName}
            </div>

            {/* Wax Seal Button */}
            <button
              onClick={handleOpenLetter}
              className="wax-seal-btn w-20 h-20 rounded-full flex flex-col items-center justify-center text-white font-serif relative"
              aria-label="Break wax seal and read letter"
            >
              <Heart className="w-7 h-7 fill-white/90 drop-shadow" />
              <span className="text-[9px] font-sans tracking-widest font-bold uppercase mt-0.5 opacity-90">
                OPEN
              </span>
            </button>

            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mt-6">
              Tap wax seal to break & read
            </p>
          </div>
        </div>
      ) : (
        /* Unfolded Parchment Sheet */
        <div className="animate-scale-up text-left">
          <div className="parchment-sheet rounded-2xl p-6 sm:p-10 md:p-12 mb-8">
            {/* Salutation */}
            <h3 className="font-display italic text-3xl sm:text-4xl text-slate-900 mb-6 font-semibold">
              {giftContent.letter.salutation}
            </h3>

            {/* Letter Body Paragraphs */}
            <div className="space-y-4 text-slate-800 text-base sm:text-lg leading-relaxed font-normal">
              {giftContent.letter.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* Closing & Signature */}
            <div className="mt-8 pt-6 border-t border-amber-900/15">
              <p className="font-serif italic text-slate-700 text-base">
                {giftContent.letter.closing}
              </p>
              <p className="font-handwriting text-3xl sm:text-4xl text-pink-900 font-bold mt-1">
                {giftContent.letter.signature}
              </p>
            </div>

            {/* Post Script */}
            {giftContent.letter.postScript && (
              <div className="mt-6 pt-4 border-t border-dashed border-amber-900/20 text-xs sm:text-sm text-slate-600 font-mono">
                {giftContent.letter.postScript}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleInstallApp}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium text-xs uppercase tracking-wider shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 active:scale-95 transition-all"
            >
              {isInstalled ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Installed on Home Screen</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Save Garden to My Phone</span>
                </>
              )}
            </button>

            <button
              onClick={onScrollToTop}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 text-xs font-medium uppercase tracking-wider transition-colors"
            >
              <ArrowUp className="w-4 h-4" />
              <span>Back to Garden Top</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
