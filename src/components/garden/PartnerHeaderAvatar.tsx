import React, { useState, useRef, useEffect } from 'react';
import { Heart, ShieldCheck, ChevronRight } from 'lucide-react';
import { authService } from '../../services/authService';
import type { UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import { AuthModal } from './AuthModal';

interface PartnerHeaderAvatarProps {
  currentUser: UserProfile;
}

/**
 * PartnerHeaderAvatar — Displays your partner's radiant photo in your header.
 * Solomon sees Noella's photo; Noella sees Solomon's photo.
 * Keeps the header balanced, elegant, and free of cluttered text.
 */
export const PartnerHeaderAvatar: React.FC<PartnerHeaderAvatarProps> = ({ currentUser: _currentUser }) => {
  const [partner, setPartner] = useState<UserProfile>(authService.getPartner());
  const [activeUser, setActiveUser] = useState<UserProfile>(authService.getCurrentUser());
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const refreshProfiles = () => {
    setPartner(authService.getPartner());
    setActiveUser(authService.getCurrentUser());
  };

  useEffect(() => {
    refreshProfiles();
    const unsub = authService.subscribeUser(() => refreshProfiles());
    const handleProfileUpdate = () => refreshProfiles();
    window.addEventListener('garden-profile-updated', handleProfileUpdate);
    return () => {
      unsub();
      window.removeEventListener('garden-profile-updated', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    soundEngine.playSparkle();
    setIsOpen(!isOpen);
  };

  const handleOpenSwitchAccount = () => {
    soundEngine.playSparkle();
    setIsAuthModalOpen(true);
    setIsOpen(false);
  };

  const isSolomon = activeUser.username === 'solomon';

  return (
    <>
      <div
        className="relative inline-flex items-center justify-center shrink-0"
        ref={popoverRef}
        style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px' }}
      >
        {/* Partner Avatar Button — Pure Visual Romance, Zero Text Clutter */}
        <button
          type="button"
          onClick={handleToggle}
          className="relative rounded-full hover:scale-105 active:scale-95 transition-all shadow-md shadow-pink-500/20 cursor-pointer focus:outline-none"
          style={{
            width: '36px',
            height: '36px',
            minWidth: '36px',
            minHeight: '36px',
            maxWidth: '36px',
            maxHeight: '36px',
            borderRadius: '50%',
            padding: '2px',
            background: 'linear-gradient(135deg, #ec4899, #f43f5e, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: 'none',
          }}
          title={`Connected to ${partner.displayName} ♡ (Tap for status)`}
          aria-label={`Partner: ${partner.displayName}`}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              minWidth: '32px',
              minHeight: '32px',
              borderRadius: '50%',
              overflow: 'hidden',
              backgroundColor: '#120726',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={partner.avatarUrl}
              alt={partner.displayName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%',
                display: 'block',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/memories/photo-sun-portrait.jpg';
              }}
            />
          </div>

          {/* Glowing Connected Dot */}
          <span
            style={{
              position: 'absolute',
              bottom: '1px',
              right: '1px',
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              backgroundColor: '#34d399',
              border: '2px solid #0d081e',
              boxShadow: '0 0 6px rgba(52, 211, 153, 0.8)',
              zIndex: 10,
            }}
            title="Connected in Sanctuary"
          />
        </button>

        {/* Sweet Couple Connection Card (When tapped) */}
        {isOpen && (
          <div
            className="absolute right-0 top-full mt-2.5 w-64 rounded-2xl bg-[#13072b]/95 border border-pink-400/40 shadow-2xl backdrop-blur-xl p-3.5 text-white animate-fade-in space-y-3 z-50"
            style={{ backgroundColor: 'rgba(19, 7, 43, 0.98)' }}
          >
            {/* Partner Details */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-pink-400 shadow-md shrink-0">
                <img
                  src={partner.avatarUrl}
                  alt={partner.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-pink-300 uppercase tracking-widest block">
                  Together Always
                </span>
                <h4 className="font-serif font-bold text-sm text-white truncate">
                  {partner.displayName}
                </h4>
                <div className="flex items-center gap-1 text-[11px] text-emerald-300 font-sans mt-0.5">
                  <Heart className="w-3 h-3 fill-pink-400 text-pink-400" />
                  <span>Connected with you</span>
                </div>
              </div>
            </div>

            {/* Quick Note About More Tab */}
            <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] text-purple-200/80 leading-relaxed font-sans">
              <p>
                🌸 You are viewing your garden as <span className="text-white font-semibold">{isSolomon ? 'Solomon' : 'Noella'}</span>.
              </p>
              <p className="mt-1 text-[10px] text-pink-300/80">
                To change your profile photo or passcode, tap the <strong>More</strong> tab below.
              </p>
            </div>

            {/* Switch Account Option */}
            <button
              type="button"
              onClick={handleOpenSwitchAccount}
              className="w-full py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-pink-300" />
                <span>Switch Account</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        )}
      </div>

      {/* Auth Modal for Passcode-Protected Account Switch */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialUser={isSolomon ? 'noella' : 'solomon'}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          refreshProfiles();
        }}
      />
    </>
  );
};
