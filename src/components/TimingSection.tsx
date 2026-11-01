import React from 'react';
import { Clock, Sparkles, BookOpen, Quote } from 'lucide-react';
import { giftContent } from '../data/giftContent';
import { soundEngine } from '../utils/audio';

export const TimingSection: React.FC = () => {
  const { timing } = giftContent;

  const handleInteractiveTouch = () => {
    soundEngine.playChime(440, 1.8, 0.08);
  };

  return (
    <section id="timing" className="relative pt-24 sm:pt-28 pb-16 px-4 z-10 max-w-4xl mx-auto scroll-mt-24">
      {/* Section Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-medium uppercase tracking-wider mb-3 shadow-sm">
          <Clock className="w-3.5 h-3.5" />
          <span>{timing.badge}</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">
          {timing.headline}
        </h2>
        <p className="text-slate-300 text-sm sm:text-base max-w-md mx-auto font-light">
          {timing.originalContext}
        </p>
      </div>

      {/* Journal Page Card */}
      <div 
        onClick={handleInteractiveTouch}
        className="relative max-w-2xl mx-auto rounded-3xl p-6 sm:p-10 backdrop-blur-xl border border-amber-300/30 shadow-2xl transition-all duration-300 hover:border-amber-300/50"
        style={{
          background: 'linear-gradient(145deg, rgba(30, 24, 48, 0.85) 0%, rgba(15, 12, 28, 0.92) 100%)',
          boxShadow: '0 20px 40px -15px rgba(245, 158, 11, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
        }}
      >
        {/* Subtle bookmark ribbon */}
        <div className="absolute -top-3 right-8 w-6 h-10 bg-gradient-to-b from-rose-500 to-amber-500 rounded-b shadow-md flex items-end justify-center pb-1">
          <Sparkles className="w-3 h-3 text-white" />
        </div>

        {/* Header Icon & Tag */}
        <div className="flex items-center justify-between border-b border-amber-400/20 pb-3 mb-6">
          <div className="flex items-center gap-2.5 text-xs font-mono text-amber-300 uppercase tracking-widest">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Solomon's Journal • Original Note</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-300/70">
            <Quote className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[10px] uppercase">Private Note</span>
          </div>
        </div>

        {/* Clean Journal Excerpt with Left Border */}
        <div className="relative mb-6 pl-5 sm:pl-7 border-l-2 border-amber-400/50 py-1">
          <div className="space-y-4">
            {timing.journalExcerpt.map((line, i) => (
              <p
                key={i}
                className="font-handwriting text-2xl sm:text-3xl text-pink-100 leading-relaxed tracking-wide"
              >
                “{line}”
              </p>
            ))}
          </div>
        </div>

        {/* Reflection */}
        <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed mb-8 pt-5 border-t border-white/10">
          {timing.reflection}
        </p>

        {/* Three Core Pillars in 3 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {timing.coreThemes.map((pillar, index) => (
            <div
              key={index}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center flex flex-col items-center hover:bg-white/10 hover:border-amber-400/30 transition-all duration-300 group"
            >
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{pillar.icon}</span>
              <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider mb-1.5">
                {pillar.label}
              </h4>
              <p className="text-[11px] text-slate-300 font-light leading-snug">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
