import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Heart, Disc3, Sparkles } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { notificationService } from '../services/notificationService';
import { authService } from '../services/gardenService';

interface GardenHeaderProps {
  onScrollTo: (sectionId: string) => void;
  activeSection: string;
  onOpenOurGarden: () => void;
}

export const GardenHeader: React.FC<GardenHeaderProps> = ({ onScrollTo, activeSection, onOpenOurGarden }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(soundEngine.getIsPlaying());
  const [track, setTrack] = useState<'piano' | 'vocal'>(soundEngine.getCurrentTrack());
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const refreshCount = () => {
      const u = authService.getCurrentUser();
      setUnreadCount(notificationService.getUnreadCount(u.id));
    };
    refreshCount();
    const unsubNotif = notificationService.subscribe(refreshCount);
    const unsubUser = authService.subscribeUser(refreshCount);
    return () => {
      unsubNotif();
      unsubUser();
    };
  }, []);

  useEffect(() => {
    return soundEngine.subscribe((playing) => {
      setIsPlaying(playing);
    });
  }, []);

  const handleToggleSound = () => {
    soundEngine.toggle();
  };

  const handleToggleTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextTrack = track === 'piano' ? 'vocal' : 'piano';
    setTrack(nextTrack);
    soundEngine.setTrack(nextTrack);
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

          {/* Dedicated Our Garden Access */}
          <button
            onClick={onOpenOurGarden}
            className="relative flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-pink-500/25 to-purple-500/25 text-pink-200 border border-pink-400/40 hover:scale-105 active:scale-95 transition-all shadow-sm shadow-pink-500/10 ml-1"
          >
            <Sparkles className="w-3 h-3 text-pink-300" />
            <span>Our Garden 🌿</span>
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse shadow-sm shadow-pink-500" />
            )}
          </button>
        </nav>

        {/* Background Music Toggle & Track Switcher + Mobile Garden Access */}
        <div className="flex items-center gap-1.5">
          {/* Mobile-Only Garden Access Button */}
          <button
            onClick={onOpenOurGarden}
            className="mobile-garden-btn sm:hidden relative flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-pink-500/25 to-purple-500/25 text-pink-200 border border-pink-400/40 active:scale-95 transition-all"
            aria-label="Open Our Garden"
          >
            <Sparkles className="w-3 h-3 text-pink-300" />
            <span className="text-[11px]">Garden 🌿</span>
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse shadow-sm shadow-pink-500" />
            )}
          </button>

          <button
            onClick={handleToggleSound}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isPlaying
                ? 'bg-amber-400/20 border border-amber-300/40 text-amber-200 shadow-md shadow-amber-400/20'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200'
            }`}
            title={isPlaying ? `Pause Tom Odell — Flying (${track === 'piano' ? 'Piano Instrumental' : 'Original Vocal'})` : 'Play Tom Odell — Flying'}
            aria-label={isPlaying ? 'Pause music' : 'Play music'}
          >
            {isPlaying ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span className="hidden xs:inline text-[11px] font-medium">
                  {track === 'piano' ? 'Flying (Piano) 🎵' : 'Flying (Vocal) 🎤'}
                </span>
                <span className="flex gap-0.5 items-end h-2.5">
                  <span className="w-0.5 bg-amber-300 rounded-full animate-bounce h-2" style={{ animationDelay: '0.1s' }} />
                  <span className="w-0.5 bg-amber-300 rounded-full animate-bounce h-3" style={{ animationDelay: '0.3s' }} />
                  <span className="w-0.5 bg-amber-300 rounded-full animate-bounce h-1.5" style={{ animationDelay: '0.2s' }} />
                </span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span className="hidden xs:inline text-[11px]">Play Flying</span>
              </>
            )}
          </button>

          {/* Track Switcher Button */}
          <button
            onClick={handleToggleTrack}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-mono border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            title={`Switch to ${track === 'piano' ? 'Tom Odell Vocal version' : 'Piano Instrumental version'}`}
            aria-label="Switch song version"
          >
            <Disc3 className={`w-3 h-3 text-pink-400 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            <span>{track === 'piano' ? 'Piano' : 'Vocal'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
