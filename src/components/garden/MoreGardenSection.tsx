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
  RotateCw,
} from 'lucide-react';
import { forceAppSync } from '../../utils/appSync';
import { soundEngine } from '../../utils/audio';
import { authService } from '../../services/authService';
import type { UserProfile } from '../../types/garden';
import { ChangeProfilePhotoModal } from './ChangeProfilePhotoModal';
import { ChangePasscodeModal } from './ChangePasscodeModal';
import { AuthModal } from './AuthModal';
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

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
    const unsub = authService.subscribeUser((u) => {
      setCurrentUser(u);
    });
    const handleAvatarUpdate = () => setCurrentUser(authService.getCurrentUser());
    window.addEventListener('garden-profile-updated', handleAvatarUpdate);
    return () => {
      unsub();
      window.removeEventListener('garden-profile-updated', handleAvatarUpdate);
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

      {/* App Version & 1-Tap Sync Card */}
      <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-400/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg my-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-pink-300 shrink-0">
            <RotateCw className="w-5 h-5 text-pink-300" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
              <span>Sanctuary Sync & Updates</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/30 text-pink-200 border border-pink-400/40 font-mono">v4.2</span>
            </h4>
            <p className="text-xs text-pink-200/70">
              Tap anytime to force-refresh & clear mobile cache immediately
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            soundEngine.playSparkle();
            forceAppSync();
          }}
          className="self-end sm:self-center px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-pink-500/25 active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          Sync Now 🔄
        </button>
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
    </div>
  );
};
