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
import styles from './MoreGardenPanel.module.css';

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
      {/* More Options Floating Full Panel (when More is tapped) */}
      {isMoreMenuOpen && (
        <div
          className={styles.gardenPanelOverlay}
          onClick={() => setIsMoreMenuOpen(false)}
        >
          <div
            className={styles.gardenPanel}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel Heading */}
            <div className={styles.panelHeading}>
              <div className={styles.panelHeadingTitle}>
                <Heart className="w-5 h-5 text-pink-400 fill-pink-400/20" />
                <span>More Garden Spaces</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(false)}
                className={styles.closeButton}
                aria-label="Close More Spaces"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Card */}
            <div className={styles.profileCard}>
              <div className={styles.profileTop}>
                <div className={styles.profileInformation}>
                  <div className={styles.profileAvatarWrapper}>
                    <span className={styles.profileCrown} role="img" aria-label="crown">👑</span>
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.displayName}
                      className={styles.profileImage}
                      onClick={() => {
                        soundEngine.playSparkle();
                        setIsMoreMenuOpen(false);
                        setIsChangePhotoOpen(true);
                      }}
                      title="Change photo"
                    />
                  </div>
                  <div>
                    <h3 className={styles.profileName}>
                      <span>{currentUser.displayName}</span>
                    </h3>
                    <p className={styles.profileSubtitle}>Your Garden Profile</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSparkle();
                    setIsMoreMenuOpen(false);
                    setIsChangePhotoOpen(true);
                  }}
                  className={styles.photoButton}
                >
                  <Camera className="w-3.5 h-3.5 text-pink-300" />
                  <span>Photo 📷</span>
                </button>
              </div>

              {/* Account Controls */}
              <div className={styles.accountActions}>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSparkle();
                    setIsMoreMenuOpen(false);
                    setIsChangePasscodeOpen(true);
                  }}
                  className={styles.accountButton}
                >
                  <KeyRound className="w-4 h-4 text-pink-300" />
                  <span>Passcode 🔑</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSparkle();
                    setIsMoreMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className={styles.accountButton}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-300" />
                  <span>Switch Account</span>
                </button>
              </div>
            </div>

            {/* Recycle Bin Card */}
            <div
              className={styles.recycleBin}
              onClick={() => {
                soundEngine.playSparkle();
                setIsMoreMenuOpen(false);
                setIsBinOpen(true);
              }}
            >
              <div className={styles.recycleLeft}>
                <div className={styles.recycleIcon}>
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <div className={styles.recycleTitleRow}>
                    <span className={styles.recycleTitle}>Garden Recycle Bin</span>
                    <span className={styles.privateLabel}>Private 🔒</span>
                  </div>
                  <p className={styles.recycleDescription}>
                    {deletedCount > 0
                      ? `${deletedCount} deleted item${deletedCount > 1 ? 's' : ''} • Tap to view or restore`
                      : 'Restore or permanently delete photos'}
                  </p>
                </div>
              </div>
              <span className={styles.recycleArrow}>›</span>
            </div>

            {/* 8 Features Grid */}
            <div className={styles.gardenGrid}>
              {moreFeatures.map((feat) => {
                const Icon = feat.icon;
                return (
                  <button
                    key={feat.id}
                    type="button"
                    onClick={() => handleSelectMoreOption(feat.id)}
                    className={styles.gardenFeature}
                  >
                    <div className={styles.featureIcon}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className={styles.featureContent}>
                      <h3>{feat.label}</h3>
                      <p>{feat.desc}</p>
                    </div>
                    <span className={styles.featureArrow}>›</span>
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
        onClose={() => {
          setIsChangePhotoOpen(false);
          setIsMoreMenuOpen(true);
        }}
        currentUser={currentUser}
      />

      {/* Change Passcode Modal for Mobile */}
      <ChangePasscodeModal
        isOpen={isChangePasscodeOpen}
        onClose={() => {
          setIsChangePasscodeOpen(false);
          setIsMoreMenuOpen(true);
        }}
        currentUser={currentUser}
      />

      {/* Switch Account Modal for Mobile */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialUser={currentUser.username === 'solomon' ? 'noella' : 'solomon'}
        onClose={() => {
          setIsAuthModalOpen(false);
          setIsMoreMenuOpen(true);
        }}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          setCurrentUser(authService.getCurrentUser());
          setIsMoreMenuOpen(true);
        }}
      />

      {/* Private Garden Recycle Bin Modal */}
      <GardenBinModal
        isOpen={isBinOpen}
        onClose={() => {
          setIsBinOpen(false);
          setIsMoreMenuOpen(true);
        }}
        currentUser={currentUser}
      />
    </>
  );
};
