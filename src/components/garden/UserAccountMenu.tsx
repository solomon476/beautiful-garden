import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Lock, KeyRound, ChevronDown, Key, Camera } from 'lucide-react';
import { authService } from '../../services/authService';
import type { UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import { AuthModal } from './AuthModal';
import { ChangePasscodeModal } from './ChangePasscodeModal';
import { ChangeProfilePhotoModal } from './ChangeProfilePhotoModal';

interface UserAccountMenuProps {
  currentUser: UserProfile;
  compact?: boolean;
}

export const UserAccountMenu: React.FC<UserAccountMenuProps> = ({ currentUser, compact: _compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChangePasscodeOpen, setIsChangePasscodeOpen] = useState(false);
  const [isChangePhotoOpen, setIsChangePhotoOpen] = useState(false);
  const [authModalTarget, setAuthModalTarget] = useState<'solomon' | 'noella' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authService.isAuthenticated());
  const [_profileRefreshKey, setProfileRefreshKey] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = authService.subscribeUser((_u) => {
      setIsAuthenticated(authService.isAuthenticated());
      setProfileRefreshKey((k) => k + 1);
    });
    const handleProfileUpdate = () => {
      setProfileRefreshKey((k) => k + 1);
    };
    window.addEventListener('garden-profile-updated', handleProfileUpdate);
    return () => {
      unsub();
      window.removeEventListener('garden-profile-updated', handleProfileUpdate);
    };
  }, []);

  const activeUser = authService.getCurrentUser();
  const displayedUser = currentUser.username === activeUser.username ? activeUser : currentUser;

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

  const handleOpenChangePasscode = () => {
    soundEngine.playSparkle();
    setIsChangePasscodeOpen(true);
    setIsOpen(false);
  };

  const handleOpenChangePhoto = () => {
    soundEngine.playSparkle();
    setIsChangePhotoOpen(true);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    soundEngine.playChime(440, 0.6, 0.08);
    await authService.signOut();
    setIsOpen(false);
  };

  // Label derived directly from the authenticated identity
  const isSolomon = displayedUser.username === 'solomon';
  const gardenLabel = isSolomon ? 'Solomon — My Garden' : 'Noella — My Garden';
  const partnerLabel = isSolomon ? 'Noella' : 'Solomon';

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
          <div
            className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden border border-pink-300/50 shadow-sm shrink-0"
            style={{ width: '26px', height: '26px', minWidth: '26px', minHeight: '26px' }}
          >
            <img
              src={displayedUser.avatarUrl}
              alt={displayedUser.displayName}
              className="w-full h-full object-cover"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {isAuthenticated && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0d071c]" />
            )}
          </div>

          {/* Account Label */}
          <div className="flex items-center gap-1.5 text-left">
            <span className="text-xs sm:text-xs font-serif font-bold text-white tracking-wide truncate">
              <span className="sm:hidden">{isSolomon ? 'Solomon' : 'Noella'}</span>
              <span className="hidden sm:inline">{gardenLabel}</span>
            </span>
            <ChevronDown
              className={`w-3 h-3 text-pink-300/80 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* Optional Quick Logout Link beside Menu (as in Mobile Reference) */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={handleSignOut}
            className="hidden xs:inline-flex items-center gap-1 text-[11px] font-sans text-purple-200/90 hover:text-white transition-colors px-2 py-1 rounded-full hover:bg-white/10 active:scale-95 cursor-pointer ml-1"
            title="Log out of sanctuary"
          >
            <LogOut className="w-3.5 h-3.5 text-pink-300" />
            <span>Log out</span>
          </button>
        )}

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-64 sm:w-72 rounded-2xl bg-[#120726]/98 border border-pink-400/40 shadow-2xl backdrop-blur-2xl p-2.5 text-white animate-fade-in space-y-2"
            style={{ zIndex: 15000, backgroundColor: '#13082a' }}
          >
            {/* Header info with interactive avatar change */}
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
              <div
                onClick={handleOpenChangePhoto}
                className="relative rounded-full overflow-hidden border-2 border-pink-400/70 shadow-md shrink-0 cursor-pointer group"
                style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
                title="Click to change profile photo"
              >
                <img
                  src={displayedUser.avatarUrl}
                  alt={displayedUser.displayName}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-serif font-bold text-white block truncate">
                  {displayedUser.displayName}
                </span>
                <button
                  type="button"
                  onClick={handleOpenChangePhoto}
                  className="text-[10px] text-pink-300/90 hover:text-pink-200 flex items-center gap-1 font-sans cursor-pointer mt-0.5 hover:underline"
                >
                  <Camera className="w-3 h-3" />
                  <span>Change Photo 📷</span>
                </button>
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
                    Sanctuary Account
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenChangePhoto}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs text-purple-100 hover:bg-pink-500/20 hover:text-pink-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-pink-300" />
                    <span>Change Profile Photo 📷</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenChangePasscode}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs text-purple-100 hover:bg-pink-500/20 hover:text-pink-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Key className="w-4 h-4 text-pink-300" />
                    <span>Change My Passcode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenLogin(isSolomon ? 'noella' : 'solomon')}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs text-purple-100 hover:bg-white/[0.08] hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-purple-300" />
                    <span>Switch to {partnerLabel} (Requires Passcode)</span>
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

      {/* Change Passcode Modal */}
      <ChangePasscodeModal
        isOpen={isChangePasscodeOpen}
        onClose={() => setIsChangePasscodeOpen(false)}
        currentUser={displayedUser}
      />

      {/* Change Profile Photo Modal */}
      <ChangeProfilePhotoModal
        isOpen={isChangePhotoOpen}
        onClose={() => setIsChangePhotoOpen(false)}
        currentUser={displayedUser}
      />
    </>
  );
};
