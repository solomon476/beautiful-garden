import React, { useState } from 'react';
import { Volume2, VolumeX, Heart } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface GardenHeaderProps {
  onScrollTo: (sectionId: string) => void;
  activeSection: string;
}

export const GardenHeader: React.FC<GardenHeaderProps> = ({ onScrollTo, activeSection }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(soundEngine.getIsPlaying());

  const handleToggleSound = () => {
    const nextState = soundEngine.toggle();
    setIsPlaying(nextState);
  };

  const navItems = [
    { id: 'timing', label: 'Timing' },
    { id: 'memories', label: 'Memories' },
    { id: 'notes', label: 'Petal Notes' },
    { id: 'surprise', label: 'VIP Pass' },
    { id: 'letter', label: 'Keepsake' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full px-4 py-3 transition-all duration-300">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-2.5 rounded-full bg-slate-900/60 backdrop-blur-xl border border-pink-400/20 shadow-xl shadow-black/40">
        {/* Brand / Title */}
        <button
          onClick={() => onScrollTo('welcome')}
          className="flex items-center gap-2 text-left group transition-transform active:scale-95"
          aria-label="Return to top"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-md shadow-pink-500/30 group-hover:scale-110 transition-transform">
            <Heart className="w-4 h-4 fill-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-pink-100 flex items-center gap-1">
              Perfect Time <span className="text-pink-400 text-xs">🌷</span>
            </h1>
          </div>
        </button>

        {/* Quick Section Jump Pills */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onScrollTo(item.id)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-pink-500/25 text-pink-200 border border-pink-400/40 shadow-sm shadow-pink-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Ambient Audio Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSound}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isPlaying
                ? 'bg-amber-400/20 border border-amber-300/40 text-amber-200 shadow-md shadow-amber-400/20'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200'
            }`}
            title={isPlaying ? 'Mute ambient melody' : 'Play ambient melody'}
            aria-label={isPlaying ? 'Mute ambient melody' : 'Play ambient melody'}
          >
            {isPlaying ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span className="hidden xs:inline text-[11px]">Music Box</span>
                <span className="flex gap-0.5 items-end h-2.5">
                  <span className="w-0.5 bg-amber-300 rounded-full animate-bounce h-2" style={{ animationDelay: '0.1s' }} />
                  <span className="w-0.5 bg-amber-300 rounded-full animate-bounce h-3" style={{ animationDelay: '0.3s' }} />
                  <span className="w-0.5 bg-amber-300 rounded-full animate-bounce h-1.5" style={{ animationDelay: '0.2s' }} />
                </span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span className="hidden xs:inline text-[11px]">Muted</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
