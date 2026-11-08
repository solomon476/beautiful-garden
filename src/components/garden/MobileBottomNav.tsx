import React, { useState, useEffect } from 'react';
import {
  Home,
  Sparkles,
  Music2,
  BookOpen,
  Heart,
  PenLine,
  Smile,
  HelpCircle,
  Hourglass,
  Globe,
  X,
  Gift,
  Clock,
  Camera,
  KeyRound,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';
import { authService } from '../../services/authService';
import { memoryArchiveService } from '../../services/gardenService';
import { ChangeProfilePhotoModal } from './ChangeProfilePhotoModal';
import { ChangePasscodeModal } from './ChangePasscodeModal';
import { AuthModal } from './AuthModal';
import { GardenBinModal } from './GardenBinModal';

interface MobileBottomNavProps {
  currentView: 'home' | 'garden' | 'music' | 'archive' | 'more' | string;
  onNavigate: (target: 'home' | 'garden' | 'music' | 'archive' | 'more' | string) => void;
  isGardenOpen: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  isGardenOpen,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isChangePhotoOpen, setIsChangePhotoOpen] = useState(false);
  const [isChangePasscodeOpen, setIsChangePasscodeOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBinOpen, setIsBinOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [deletedCount, setDeletedCount] = useState(() => memoryArchiveService.getDeletedCount());

  useEffect(() => {
    const unsub = authService.subscribeUser((u) => {
      setCurrentUser(u);
      setDeletedCount(memoryArchiveService.getDeletedCount(u.id));
    });
    const handleAvatarUpdate = () => setCurrentUser(authService.getCurrentUser());
    const handleBinUpdate = () => setDeletedCount(memoryArchiveService.getDeletedCount());
    window.addEventListener('garden-profile-updated', handleAvatarUpdate);
    window.addEventListener('garden-bin-updated', handleBinUpdate);
    return () => {
      unsub();
      window.removeEventListener('garden-profile-updated', handleAvatarUpdate);
      window.removeEventListener('garden-bin-updated', handleBinUpdate);
    };
  }, []);

  const handleNavClick = (target: 'home' | 'garden' | 'music' | 'archive' | 'more') => {
    soundEngine.playSparkle();
    if (target === 'more') {
      setIsMoreMenuOpen(!isMoreMenuOpen);
    } else {
      setIsMoreMenuOpen(false);
      onNavigate(target);
    }
  };

  const handleSelectMoreOption = (subTab: string) => {
    soundEngine.playSparkle();
    setIsMoreMenuOpen(false);
    onNavigate(subTab);
  };

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      isActive: !isGardenOpen && (currentView === 'home' || currentView === 'welcome' || !currentView),
    },
    {
      id: 'garden',
      label: 'Our Garden',
      icon: Sparkles,
      isActive: isGardenOpen && (currentView === 'garden' || currentView === 'overview'),
    },
    {
      id: 'music',
      label: 'Music',
      icon: Music2,
      isActive: isGardenOpen && currentView === 'sound',
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: BookOpen,
      isActive: isGardenOpen ? currentView === 'archive' : currentView === 'memories',
    },
    {
      id: 'more',
      label: 'More',
      icon: Heart,
      isActive:
        isMoreMenuOpen ||
        ['letters', 'petals', 'moods', 'questions', 'shelf', 'capsule', 'world', 'time'].includes(
          currentView
        ),
    },
  ];

  const moreFeatures = [
    { id: 'petals', label: 'Petal Notes', icon: Sparkles, desc: 'Whispers of love & thoughts' },
    { id: 'letters', label: 'Letters in Garden', icon: PenLine, desc: 'Quiet shared letters' },
    { id: 'shelf', label: 'Exchange Shelf', icon: Gift, desc: 'Gifts, books & ideas' },
    { id: 'time', label: 'Our Time', icon: Clock, desc: 'Plans, dates & memories' },
    { id: 'moods', label: 'Mood Garden', icon: Smile, desc: 'Check in with feelings' },
    { id: 'questions', label: 'Little Questions', icon: HelpCircle, desc: 'Thoughtful conversation' },
    { id: 'capsule', label: 'Time Capsule', icon: Hourglass, desc: 'Future locked messages' },
    { id: 'world', label: 'The World Around Us', icon: Globe, desc: 'Causes and conversations' },
  ];

  return (
    <>
      {/* More Options Floating Bottom Sheet (when More is tapped) */}
      {isMoreMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md sm:hidden flex flex-col justify-end animate-fade-in"
          style={{ zIndex: 9999 }}
          onClick={() => setIsMoreMenuOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl border-t border-pink-400/40 p-5 shadow-2xl text-white space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up"
            style={{
              zIndex: 10000,
              background: 'linear-gradient(180deg, #1b0a33 0%, #100522 100%)',
              backgroundColor: '#120726',
              boxShadow: '0 -15px 50px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.15)',
              paddingBottom: 'max(90px, calc(80px + env(safe-area-inset-bottom)))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1 rounded-full bg-purple-300/40 mx-auto -mt-1 mb-2" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-purple-400/20">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                <h3 className="font-serif text-base font-bold text-white">More Garden Spaces</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-purple-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Avatar & Account Settings Card */}
            <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-pink-400/30 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    onClick={() => {
                      soundEngine.playSparkle();
                      setIsChangePhotoOpen(true);
                    }}
                    className="relative rounded-full overflow-hidden border-2 border-pink-400/70 shadow-md shrink-0 cursor-pointer group"
                    style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
                    title="Change photo"
                  >
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.displayName}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <span className="font-serif text-sm font-bold text-white block truncate">
                      {currentUser.displayName}
                    </span>
                    <span className="text-[10px] text-pink-200/70 block truncate">
                      Your Garden Profile
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSparkle();
                    setIsChangePhotoOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-full bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 text-pink-200 text-[11px] font-semibold flex items-center gap-1.5 shrink-0 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  <Camera className="w-3 h-3 text-pink-300" />
                  <span>Photo 📷</span>
                </button>
              </div>

              {/* Security & Account Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSparkle();
                    setIsChangePasscodeOpen(true);
                  }}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                >
                  <KeyRound className="w-3.5 h-3.5 text-pink-300" />
                  <span>Passcode 🔑</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSparkle();
                    setIsAuthModalOpen(true);
                  }}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                  <span>Switch Account</span>
                </button>
              </div>
            </div>

            {/* Private Garden Recycle Bin Button (Private on either side) */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playSparkle();
                setIsBinOpen(true);
              }}
              className="w-full p-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-rose-500/15 via-purple-500/15 to-pink-500/15 border border-pink-400/30 hover:border-pink-300/50 text-left flex items-center justify-between transition-all cursor-pointer active:scale-98 group shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300 group-hover:scale-105 transition-transform">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-serif font-bold text-xs text-white flex items-center gap-1.5">
                    <span>Garden Recycle Bin</span>
                    <span className="text-[9.5px] font-mono text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-400/30">
                      Private 🔒
                    </span>
                  </div>
                  <div className="text-[10px] text-pink-200/70 font-sans mt-0.5">
                    {deletedCount > 0
                      ? `${deletedCount} deleted item${deletedCount > 1 ? 's' : ''} • Tap to view or restore`
                      : 'Restore or permanently delete photos'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-pink-300">
                {deletedCount > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {deletedCount}
                  </span>
                )}
                <span>→</span>
              </div>
            </button>

            {/* 8 Features Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {moreFeatures.map((feat) => {
                const Icon = feat.icon;
                const isSelected = currentView === feat.id;
                return (
                  <button
                    key={feat.id}
                    type="button"
                    onClick={() => handleSelectMoreOption(feat.id)}
                    className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between gap-1.5 cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-purple-800/80 border-pink-400 shadow-lg scale-[1.02]'
                        : 'bg-white/[0.06] border-white/10 hover:border-pink-300/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-300">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-purple-300">→</span>
                    </div>
                    <div>
                      <span className="font-serif font-bold text-xs text-white block leading-tight">
                        {feat.label}
                      </span>
                      <span className="text-[10px] text-purple-200/70 font-sans block leading-tight mt-0.5 truncate">
                        {feat.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar — Mobile Only */}
      <nav
        className="mobile-bottom-nav sm:hidden"
        style={{ zIndex: 3000 }}
        aria-label="Mobile Bottom Navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id as any)}
              className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'stroke-[2.2] text-[#8b25a8]' : 'text-[#65487d]'
                  }`}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#8b25a8]" />
                )}
              </div>
              <span
                className={`text-[10px] font-sans ${
                  isActive ? 'font-bold text-[#8b25a8]' : 'text-[#65487d]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Change Profile Photo Modal for Mobile */}
      <ChangeProfilePhotoModal
        isOpen={isChangePhotoOpen}
        onClose={() => setIsChangePhotoOpen(false)}
        currentUser={currentUser}
      />

      {/* Change Passcode Modal for Mobile */}
      <ChangePasscodeModal
        isOpen={isChangePasscodeOpen}
        onClose={() => setIsChangePasscodeOpen(false)}
        currentUser={currentUser}
      />

      {/* Switch Account Modal for Mobile */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialUser={currentUser.username === 'solomon' ? 'noella' : 'solomon'}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          setCurrentUser(authService.getCurrentUser());
        }}
      />

      {/* Private Garden Recycle Bin Modal */}
      <GardenBinModal
        isOpen={isBinOpen}
        onClose={() => setIsBinOpen(false)}
        currentUser={currentUser}
      />
    </>
  );
};
