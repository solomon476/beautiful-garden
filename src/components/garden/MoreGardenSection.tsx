import React, { useState, useEffect } from 'react';
import {
  Heart,
  Sparkles,
  PenLine,
  Gift,
  Clock,
  Smile,
  HelpCircle,
  Hourglass,
  Globe,
  Camera,
  KeyRound,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';
import { authService } from '../../services/authService';
import { memoryArchiveService } from '../../services/gardenService';
import type { UserProfile } from '../../types/garden';
import { ChangeProfilePhotoModal } from './ChangeProfilePhotoModal';
import { ChangePasscodeModal } from './ChangePasscodeModal';
import { AuthModal } from './AuthModal';
import { GardenBinModal } from './GardenBinModal';
import styles from './MoreGardenPanel.module.css';

interface MoreGardenSectionProps {
  currentUser: UserProfile;
  onSelectTab: (tab: any) => void;
}

export const MoreGardenSection: React.FC<MoreGardenSectionProps> = ({
  currentUser: propUser,
  onSelectTab,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(propUser);
  const [isChangePhotoOpen, setIsChangePhotoOpen] = useState(false);
  const [isChangePasscodeOpen, setIsChangePasscodeOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBinOpen, setIsBinOpen] = useState(false);
  const [deletedCount, setDeletedCount] = useState(() => memoryArchiveService.getDeletedCount());

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
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
    <div className={styles.gardenPanel}>
      {/* Panel Heading (In-tab heading matching Sanctuary style) */}
      <div className={styles.panelHeading}>
        <div className={styles.panelHeadingTitle}>
          <Heart className="w-5 h-5 text-pink-400 fill-pink-400/20" />
          <span>More Garden Spaces</span>
        </div>
        <p className="text-xs text-pink-200/70 hidden sm:block">
          Profile settings, recycle bin & extra sanctuaries
        </p>
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
          setIsBinOpen(true);
        }}
        role="button"
        tabIndex={0}
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
              onClick={() => {
                soundEngine.playSparkle();
                onSelectTab(feat.id);
              }}
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

      {/* Sub-modals for Profile & Account Management */}
      <ChangeProfilePhotoModal
        isOpen={isChangePhotoOpen}
        onClose={() => setIsChangePhotoOpen(false)}
        currentUser={currentUser}
      />
      <ChangePasscodeModal
        isOpen={isChangePasscodeOpen}
        onClose={() => setIsChangePasscodeOpen(false)}
        currentUser={currentUser}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialUser={currentUser.username === 'solomon' ? 'noella' : 'solomon'}
        onSuccess={(newUser) => {
          setCurrentUser(newUser);
          setIsAuthModalOpen(false);
        }}
      />
      <GardenBinModal
        isOpen={isBinOpen}
        onClose={() => setIsBinOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
};
