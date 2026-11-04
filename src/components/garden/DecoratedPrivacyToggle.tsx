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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    soundEngine.playSparkle();
    onToggle(e.target.checked);
  };

  const currentTitle = isShared
    ? (sharedTitle || `Visible to ${partnerName}`)
    : (privateTitle || 'Private to You (Secret Draft)');

  const currentSubtitle = isShared
    ? (sharedSubtitle || `Blooms in your shared garden so ${partnerName} can read and cherish it ✨`)
    : (privateSubtitle || 'Kept private in your journal. Only visible when logged into your account 🔐');

  return (
    <div
      onClick={handleClick}
      className={`garden-toggle-card group my-4 sm:my-5 cursor-pointer ${isShared ? 'is-active' : ''}`}
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
      {/* 1. Header Row: Ambient Glowing Icon + Breathable Title & Badge */}
      <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 w-full">
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-md ${
            isShared
              ? 'bg-gradient-to-tr from-pink-500/30 to-purple-500/30 border border-pink-400/60 text-pink-200 group-hover:scale-105 shadow-pink-500/20'
              : 'bg-white/[0.08] border border-white/20 text-purple-200 group-hover:border-purple-300/40'
          }`}
        >
          {isShared ? (
            <Globe2 className="w-5 h-5 sm:w-6 sm:h-6 text-pink-300 animate-pulse" />
          ) : (
            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300/90" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h4
              className={`font-serif text-base sm:text-lg font-bold tracking-tight transition-colors ${
                isShared ? 'text-white group-hover:text-pink-200' : 'text-slate-100 group-hover:text-white'
              }`}
            >
              {currentTitle}
            </h4>
            <span
              className={`text-[10px] sm:text-[11px] font-mono px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-semibold whitespace-nowrap shadow-sm ${
                isShared
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                  : 'bg-amber-500/20 border-amber-400/45 text-amber-200'
              }`}
            >
              {isShared ? 'Shared 🌸' : 'Private 🔒'}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-purple-200/85 font-light leading-relaxed mt-1">
            {currentSubtitle}
          </p>
        </div>
      </div>

      {/* 2. Interactive Control Bar: Romantic Checkbox + Smooth Luminous Switch */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pt-3 border-t border-purple-400/20 w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Real Decorated Checkbox with Roomy Breathing Space */}
        <label
          className="flex items-start sm:items-center gap-3 cursor-pointer py-1 select-none group/check flex-1 min-w-0"
          title={isShared ? 'Uncheck to make private' : `Check to share with ${partnerName}`}
        >
          <input
            type="checkbox"
            className="decorated-checkbox mt-0.5 sm:mt-0 shrink-0"
            checked={isShared}
            onChange={handleCheckboxChange}
            aria-label={isShared ? `Share with ${partnerName}` : 'Keep private'}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-serif font-medium text-pink-100 group-hover/check:text-white transition-colors break-words">
              {isShared ? `Shared in Sanctuary with ${partnerName}` : 'Keep as Private Secret Draft'}
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono text-purple-300/70 break-words mt-0.5">
              {isShared ? 'Visible to both of you ✨' : 'Only visible when logged into your account 🔐'}
            </span>
          </div>
        </label>

        {/* Luminous Decorated Pill Switch */}
        <div
          onClick={handleClick}
          className={`garden-toggle-pill cursor-pointer shrink-0 self-end sm:self-auto ${isShared ? 'is-checked' : ''}`}
          title={isShared ? 'Click to make private' : `Click to share with ${partnerName}`}
          role="switch"
          aria-checked={isShared}
          tabIndex={0}
        >
          <div className="garden-toggle-thumb">
            {isShared ? '🌸' : '🔒'}
          </div>
        </div>
      </div>
    </div>
  );
};
