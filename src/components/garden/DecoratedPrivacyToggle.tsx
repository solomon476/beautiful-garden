import React from 'react';
import { Globe2, Lock } from 'lucide-react';
import { soundEngine } from '../../utils/audio';

interface DecoratedPrivacyToggleProps {
  isShared: boolean;
  onToggle: (newVal: boolean) => void;
  partnerName: string;
  sharedTitle?: string;
  sharedSubtitle?: string;
  privateTitle?: string;
  privateSubtitle?: string;
}

export const DecoratedPrivacyToggle: React.FC<DecoratedPrivacyToggleProps> = ({
  isShared,
  onToggle,
  partnerName,
  sharedTitle,
  sharedSubtitle,
  privateTitle,
  privateSubtitle,
}) => {
  const handleClick = () => {
    soundEngine.playSparkle();
    onToggle(!isShared);
  };

  const currentTitle = isShared
    ? (sharedTitle || `Visible to ${partnerName}`)
    : (privateTitle || 'Private to You (Secret Draft)');

  const currentSubtitle = isShared
    ? (sharedSubtitle || `Blooms in your shared garden so ${partnerName} can see and cherish it ✨`)
    : (privateSubtitle || 'Kept private in your journal. Only visible when logged into your account 🔐');

  return (
    <div
      onClick={handleClick}
      className={`garden-toggle-card group my-4 ${isShared ? 'is-active' : ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-pressed={isShared}
      aria-label={`Privacy toggle: ${currentTitle}`}
    >
      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-md ${
            isShared
              ? 'bg-gradient-to-tr from-pink-500/25 to-purple-500/25 border border-pink-400/50 text-pink-200 group-hover:scale-105 shadow-pink-500/20'
              : 'bg-white/[0.06] border border-white/15 text-purple-300/80 group-hover:border-purple-300/40'
          }`}
        >
          {isShared ? (
            <Globe2 className="w-5 h-5 text-pink-300 animate-pulse" />
          ) : (
            <Lock className="w-5 h-5 text-amber-300/90" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-serif text-sm sm:text-base font-bold transition-colors ${
                isShared ? 'text-white group-hover:text-pink-200' : 'text-slate-200 group-hover:text-white'
              }`}
            >
              {currentTitle}
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                isShared
                  ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                  : 'bg-amber-500/15 border-amber-400/35 text-amber-200'
              }`}
            >
              {isShared ? 'Shared 🌸' : 'Private 🔒'}
            </span>
          </div>

          <p className="text-xs text-purple-200/75 font-light leading-relaxed">
            {currentSubtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 pl-2">
        <span className="text-[11px] font-mono text-purple-300/70 hidden sm:inline">
          {isShared ? 'Shared' : 'Private'}
        </span>
        <div className={`garden-toggle-pill ${isShared ? 'is-checked' : ''}`}>
          <div className="garden-toggle-thumb">
            {isShared ? '🌸' : '🔒'}
          </div>
        </div>
      </div>
    </div>
  );
};
