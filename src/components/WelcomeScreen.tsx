import React from 'react';
import { Sparkles, Heart, ChevronDown } from 'lucide-react';
import { giftContent } from '../data/giftContent';
import { soundEngine } from '../utils/audio';

interface WelcomeScreenProps {
  onEnter: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter }) => {
  const handleEnterClick = async () => {
    // Initiate audio on direct user touch
    await soundEngine.start();
    soundEngine.playSparkle();
    onEnter();
  };

  return (
    <section id="welcome" className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 py-12 text-center z-10">
      <div className="max-w-xl mx-auto flex flex-col items-center">
        {/* Intimate Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/15 border border-pink-400/30 text-pink-200 text-xs tracking-wider uppercase font-medium mb-6 backdrop-blur-md shadow-lg shadow-pink-500/10 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-pink-300 animate-spin" style={{ animationDuration: '6s' }} />
          <span>{giftContent.welcome.badge}</span>
          <Sparkles className="w-3.5 h-3.5 text-pink-300 animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        {/* Main Title */}
        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-4 drop-shadow-xl">
          <span className="text-shimmer">{giftContent.giftTitle}</span>
        </h1>

        {/* Personalized dedication */}
        <p className="font-display italic text-2xl sm:text-3xl text-pink-200/90 mb-4 font-normal">
          For {giftContent.recipientName}
        </p>

        {/* Welcoming description */}
        <p className="text-slate-200 text-base sm:text-lg max-w-md mb-8 leading-relaxed font-light drop-shadow">
          {giftContent.welcome.subtitle}
        </p>

        {/* Grand Entry Button */}
        <button
          onClick={handleEnterClick}
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-medium text-lg shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/25"
        >
          <Heart className="w-5 h-5 fill-white/80 group-hover:scale-125 transition-transform" />
          <span>{giftContent.welcome.enterButtonText}</span>
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-500 to-amber-500 opacity-30 blur-md group-hover:opacity-60 transition-opacity -z-10" />
        </button>

        {/* Sound prompt reassurance */}
        <p className="text-xs text-slate-400 mt-4 flex items-center gap-1.5 opacity-80">
          <span>🎧 Best experienced with sound on</span>
        </p>

        {/* Down indicator */}
        <div className="mt-16 flex flex-col items-center gap-1 text-slate-400/70 animate-bounce">
          <span className="text-[11px] uppercase tracking-widest font-mono">Explore Path</span>
          <ChevronDown className="w-4 h-4 text-pink-300" />
        </div>
      </div>
    </section>
  );
};
