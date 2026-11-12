import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, ExternalLink, Camera, PenLine, Headphones, Heart, Calendar } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { authService, DEFAULT_PROFILES } from '../../services/gardenService';
import type { GardenNotification } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

interface LiveNotificationToastProps {
  onOpenTab: (tab: string) => void;
}

export const LiveNotificationToast: React.FC<LiveNotificationToastProps> = ({ onOpenTab }) => {
  const [activeToast, setActiveToast] = useState<GardenNotification | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // 1. Listen for instant live toast events from realtime broadcast
    const handleToastEvent = (e: CustomEvent<GardenNotification>) => {
      const notif = e.detail;
      if (!notif) return;
      const currentUser = authService.getCurrentUser();
      if (notif.recipientId === currentUser.id) {
        showToast(notif);
      }
    };

    window.addEventListener('garden-toast-notification' as any, handleToastEvent);

    // 2. On mount / sync, check if there is a recent unread notification from partner that hasn't been toasted this session
    const checkUnread = () => {
      const currentUser = authService.getCurrentUser();
      const unreadList = notificationService
        .getNotificationsForUser(currentUser.id)
        .filter((n) => !n.isRead && n.senderId !== currentUser.id);

      if (unreadList.length > 0) {
        const latest = unreadList[0];
        const toastKey = `pt_toasted_${latest.id}`;
        if (!sessionStorage.getItem(toastKey)) {
          sessionStorage.setItem(toastKey, 'true');
          showToast(latest);
        }
      }
    };

    // Check after short delay to allow syncCloudNotifications to complete
    const timer = setTimeout(checkUnread, 1200);
    const unsub = notificationService.subscribe(checkUnread);

    return () => {
      window.removeEventListener('garden-toast-notification' as any, handleToastEvent);
      clearTimeout(timer);
      unsub();
    };
  }, []);

  const showToast = (notif: GardenNotification) => {
    setActiveToast(notif);
    setIsVisible(true);
    try {
      soundEngine.playSparkle();
    } catch {
      // Audio autoplay policy fallback
    }

    // Auto-dismiss after 8 seconds
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
    }, 8000);

    return () => clearTimeout(dismissTimer);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleOpen = () => {
    if (!activeToast) return;
    setIsVisible(false);
    const currentUser = authService.getCurrentUser();
    notificationService.markAsRead(activeToast.id, currentUser.id);
    onOpenTab(activeToast.targetTab || 'garden');
  };

  if (!activeToast || !isVisible) return null;

  const partner =
    activeToast.senderId === DEFAULT_PROFILES.noella.id
      ? DEFAULT_PROFILES.noella
      : DEFAULT_PROFILES.solomon;

  const getIcon = () => {
    switch (activeToast.type) {
      case 'memory':
        return <Camera className="w-4 h-4 text-pink-300" />;
      case 'letter':
        return <PenLine className="w-4 h-4 text-rose-300" />;
      case 'petal':
        return <Sparkles className="w-4 h-4 text-amber-300" />;
      case 'song':
        return <Headphones className="w-4 h-4 text-purple-300" />;
      case 'date':
        return <Calendar className="w-4 h-4 text-teal-300" />;
      default:
        return <Heart className="w-4 h-4 text-pink-300" />;
    }
  };

  const toastContent = (
    <aside
      aria-label="Partner notification"
      className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-[10000] animate-bounce-subtle pointer-events-auto"
      style={{
        zIndex: 10000,
      }}
    >
      <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-[#120824]/95 border border-pink-400/40 backdrop-blur-2xl shadow-2xl shadow-pink-500/25 text-white transition-all">
        {/* Left Avatar / Icon with Glowing Ring */}
        <div className="relative shrink-0">
          <img
            src={partner.avatarUrl}
            alt={partner.displayName}
            className="w-10 h-10 rounded-full object-cover border border-pink-300/50 shadow-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/memories/photo-sun-portrait.jpg';
            }}
          />
          <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-pink-600 border border-white/60 shadow">
            {getIcon()}
          </span>
        </div>

        {/* Middle Notification Text */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={handleOpen}>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-pink-200 truncate">
              {partner.displayName}
            </span>
            <span className="text-[10px] text-pink-300/70 font-mono">• Just now</span>
          </div>
          <p className="text-xs text-white/90 truncate font-medium mt-0.5">
            {activeToast.title}
          </p>
          <p className="text-[11px] text-slate-300/80 truncate italic">
            {activeToast.message}
          </p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleOpen}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-md shadow-pink-500/20"
          >
            <span>View</span>
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return typeof document !== 'undefined'
    ? createPortal(toastContent, document.body)
    : toastContent;
};

