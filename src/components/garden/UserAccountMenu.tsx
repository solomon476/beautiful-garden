import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Lock, KeyRound, ChevronDown } from 'lucide-react';
import { authService } from '../../services/authService';
import type { UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import { AuthModal } from './AuthModal';

interface UserAccountMenuProps {
  currentUser: UserProfile;
  compact?: boolean;
}

export const UserAccountMenu: React.FC<UserAccountMenuProps> = ({ currentUser, compact: _compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTarget, setAuthModalTarget] = useState<'solomon' | 'noella' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authService.isAuthenticated());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = authService.subscribeUser((u) => {
      setIsAuthenticated(u !== null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggleMenu = () => {
    soundEngine.playSparkle();
    setIsOpen(!isOpen);
  };

  const handleOpenLogin = (target?: 'solomon' | 'noella') => {
    soundEngine.playSparkle();
    setAuthModalTarget(target || null);
    setIsAuthModalOpen(true);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    soundEngine.playChime(440, 0.6, 0.08);
    await authService.signOut();
    setIsOpen(false);
  };

  // Label derived directly from the authenticated identity
  const isSolomon = currentUser.username === 'solomon';
  const gardenLabel = isSolomon ? 'Solomon — My Garden' : 'Ella — My Garden';
  const partnerLabel = isSolomon ? 'Ella' : 'Solomon';

  return (
    <>
      <div className="relative inline-block" ref={menuRef}>
        {/* Trigger Pill */}
        <button
          type="button"
          onClick={handleToggleMenu}
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-pink-400/30 hover:border-pink-300/60 backdrop-blur-md text-white transition-all duration-200 shadow-sm cursor-pointer active:scale-95 group focus:outline-none focus:ring-2 focus:ring-pink-400/40"
          aria-expanded={isOpen}
          aria-haspopup="true"
          title={isAuthenticated ? `${gardenLabel} (Account Menu)` : 'Unlock Sanctuary Account'}
        >
          {/* Avatar */}
          <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden border border-pink-300/50 shadow-sm shrink-0">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-full h-full object-cover"
            />
            {isAuthenticated && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0d071c]" />
            )}
          </div>

          {/* Account Label */}
          <div className="flex items-center gap-1.5 text-left">
            <span className="text-xs sm:text-xs font-serif font-bold text-white tracking-wide truncate max-w-[130px] sm:max-w-none">
              {gardenLabel}
            </span>
            <ChevronDown
              className={`w-3 h-3 text-pink-300/80 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-64 sm:w-72 rounded-2xl bg-[#120726]/98 border border-pink-400/40 shadow-2xl backdrop-blur-2xl p-2.5 z-[3500] text-white animate-fade-in space-y-2"
            style={{ backgroundColor: '#13082a' }}
          >
            {/* Header info */}
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-pink-400/60 shadow-md shrink-0">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-serif font-bold text-white block truncate">
                  {currentUser.displayName}
                </span>
                <span className="text-[10px] font-mono text-purple-200/70 block truncate">
                  {isAuthenticated ? 'Authenticated Account 🔐' : 'Temporary Guest Mode'}
                </span>
              </div>
            </div>

            {/* Menu Options */}
            <div className="space-y-1">
              {!isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => handleOpenLogin()}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs text-white hover:bg-pink-500/20 hover:text-pink-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-pink-300" />
                  <span>Unlock My Personal Account</span>
                </button>
              ) : (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-mono text-purple-300/60 uppercase tracking-wider">
                    Sanctuary Security
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenLogin(isSolomon ? 'noella' : 'solomon')}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs text-purple-100 hover:bg-white/[0.08] hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-purple-300" />
                    <span>Log in as {partnerLabel} (Requires Passcode)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs text-rose-300 hover:bg-rose-500/20 hover:text-rose-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Lock Sanctuary & Log Out</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
        initialUser={authModalTarget}
      />
    </>
  );
};
