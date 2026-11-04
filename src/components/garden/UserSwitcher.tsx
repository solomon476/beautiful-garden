import React from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { authService, DEFAULT_PROFILES } from '../../services/gardenService';
import type { UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

interface UserSwitcherProps {
  currentUser: UserProfile;
  compact?: boolean;
}

export const UserSwitcher: React.FC<UserSwitcherProps> = ({ currentUser, compact = false }) => {
  const isNoella = currentUser.username === 'noella';
  const partnerName = isNoella ? 'Solomon' : 'Noella';
  const partnerUsername: 'noella' | 'solomon' = isNoella ? 'solomon' : 'noella';

  const handleSelect = (username: 'noella' | 'solomon') => {
    if (currentUser.username === username) return;
    soundEngine.playSparkle();
    authService.switchUser(username);
  };

  const currentAvatar = isNoella
    ? (DEFAULT_PROFILES.noella.avatarUrl || '/assets/memories/photo-sun-portrait.jpg')
    : (DEFAULT_PROFILES.solomon.avatarUrl || '/assets/memories/photo-solomon-avatar.jpg');

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Desktop View: Viewing as Badge + Switch to Partner Button */}
        <div className="hidden md:flex items-center gap-2">
          {/* Viewing as Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md shadow-sm">
            <div className="w-5 h-5 rounded-full overflow-hidden border border-pink-300/40 shrink-0">
              <img
                src={currentAvatar}
                alt={currentUser.displayName}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs text-purple-200 font-sans">
              Viewing as: <strong className="text-white font-medium">{currentUser.displayName}</strong>
            </span>
          </div>

          {/* Switch Button */}
          <button
            type="button"
            onClick={() => handleSelect(partnerUsername)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-pink-500/25 border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title={`Switch to ${partnerName}`}
          >
            <span>Switch to {partnerName}</span>
            <Sparkles className="w-3 h-3 text-pink-200 fill-pink-200" />
          </button>
        </div>

        {/* Mobile Compact Dual-Avatar Switcher */}
        <div
          className="flex md:hidden items-center gap-1.5 p-1 px-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md shrink-0 shadow-sm"
          title="Tap avatar to switch between Noella and Solomon"
        >
          {/* Noella Avatar Button */}
          <button
            type="button"
            onClick={() => handleSelect('noella')}
            className={`relative group rounded-full transition-all duration-300 focus:outline-none ${
              isNoella ? 'scale-105' : 'opacity-65 hover:opacity-100 hover:scale-100'
            }`}
            aria-label="Switch to Noella"
          >
            <div
              className={`w-7 h-7 rounded-full overflow-hidden border transition-all ${
                isNoella
                  ? 'border-pink-400 shadow-[0_0_12px_rgba(244,114,182,0.65)] ring-2 ring-pink-400/40'
                  : 'border-white/30 grayscale hover:grayscale-0'
              }`}
            >
              <img
                src={DEFAULT_PROFILES.noella.avatarUrl || '/assets/memories/photo-sun-portrait.jpg'}
                alt="Noella"
                className="w-full h-full object-cover"
              />
            </div>
            {isNoella && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-pink-500 border border-[#0d081e]" />
            )}
          </button>

          {/* Romantic Heart Connection */}
          <span className="text-[11px] text-pink-300/80 font-sans select-none px-0.5">
            ♡
          </span>

          {/* Solomon Avatar Button */}
          <button
            type="button"
            onClick={() => handleSelect('solomon')}
            className={`relative group rounded-full transition-all duration-300 focus:outline-none ${
              !isNoella ? 'scale-105' : 'opacity-65 hover:opacity-100 hover:scale-100'
            }`}
            aria-label="Switch to Solomon"
          >
            <div
              className={`w-7 h-7 rounded-full overflow-hidden border transition-all ${
                !isNoella
                  ? 'border-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.65)] ring-2 ring-purple-400/40'
                  : 'border-white/30 grayscale hover:grayscale-0'
              }`}
            >
              <img
                src={DEFAULT_PROFILES.solomon.avatarUrl || '/assets/memories/photo-solomon-avatar.jpg'}
                alt="Solomon"
                className="w-full h-full object-cover"
              />
            </div>
            {!isNoella && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-purple-400 border border-[#0d081e]" />
            )}
          </button>
        </div>
      </div>
    );
  }

  // Full / Expanded Banner Version
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 p-3.5 sm:p-4 rounded-3xl bg-[#150b2e]/90 border border-purple-400/25 backdrop-blur-xl shadow-xl">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-purple-300/80 uppercase tracking-wider">
          Currently Entering As:
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Noella Card */}
        <button
          type="button"
          onClick={() => handleSelect('noella')}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-2xl transition-all duration-300 ${
            isNoella
              ? 'bg-gradient-to-r from-pink-500/25 to-rose-500/20 border border-pink-400/60 shadow-lg shadow-pink-500/20 scale-102'
              : 'bg-white/[0.03] border border-white/10 opacity-70 hover:opacity-100 hover:bg-white/[0.08]'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full overflow-hidden border ${
              isNoella ? 'border-pink-300 shadow-[0_0_8px_rgba(244,114,182,0.6)]' : 'border-white/20'
            }`}
          >
            <img
              src={DEFAULT_PROFILES.noella.avatarUrl || '/assets/memories/photo-sun-portrait.jpg'}
              alt="Noella"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-white flex items-center gap-1">
              <span>Noella</span>
              <Sparkles className="w-3 h-3 text-pink-300" />
            </div>
            <div className="text-[9px] font-mono text-pink-200/70">
              {isNoella ? 'Active ✨' : 'Click to switch'}
            </div>
          </div>
        </button>

        {/* Romantic Heart Link */}
        <div className="w-6 h-6 rounded-full bg-pink-500/10 border border-pink-400/20 flex items-center justify-center text-pink-300 shrink-0">
          <Heart className="w-3 h-3 fill-pink-400/30 text-pink-300" />
        </div>

        {/* Solomon Card */}
        <button
          type="button"
          onClick={() => handleSelect('solomon')}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-2xl transition-all duration-300 ${
            !isNoella
              ? 'bg-gradient-to-r from-purple-500/25 to-indigo-500/20 border border-purple-400/60 shadow-lg shadow-purple-500/20 scale-102'
              : 'bg-white/[0.03] border border-white/10 opacity-70 hover:opacity-100 hover:bg-white/[0.08]'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full overflow-hidden border ${
              !isNoella ? 'border-purple-300 shadow-[0_0_8px_rgba(192,132,252,0.6)]' : 'border-white/20'
            }`}
          >
            <img
              src={DEFAULT_PROFILES.solomon.avatarUrl || '/assets/memories/photo-solomon-avatar.jpg'}
              alt="Solomon"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-white flex items-center gap-1">
              <span>Solomon</span>
              <span>🌿</span>
            </div>
            <div className="text-[9px] font-mono text-purple-200/70">
              {!isNoella ? 'Active 🌿' : 'Click to switch'}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

