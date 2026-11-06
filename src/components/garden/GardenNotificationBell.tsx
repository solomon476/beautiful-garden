import React, { useState, useEffect, useRef } from 'react';
import { Bell, Sparkles, X, Heart, PenLine, Headphones, Layers, Camera, CalendarDays } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import type { GardenNotification, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

interface GardenNotificationBellProps {
  currentUser: UserProfile;
  onSelectTab: (tab: any) => void;
}

export const GardenNotificationBell: React.FC<GardenNotificationBellProps> = ({
  currentUser,
  onSelectTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<GardenNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasPermission, setHasPermission] = useState(notificationService.hasBrowserPermission());
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const refresh = () => {
    const list = notificationService.getNotificationsForUser(currentUser.id);
    setNotifications(list);
    setUnreadCount(notificationService.getUnreadCount(currentUser.id));
  };

  useEffect(() => {
    refresh();
    notificationService.syncCloudNotifications(currentUser.id);
    const cleanupRealtime = notificationService.initRealtime(currentUser.id);
    const unsub = notificationService.subscribe(refresh);

    return () => {
      unsub();
      cleanupRealtime();
    };
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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

  const handleNotificationClick = (notif: GardenNotification) => {
    soundEngine.playSparkle();
    notificationService.markAsRead(notif.id);
    setIsOpen(false);
    if (notif.targetTab) {
      onSelectTab(notif.targetTab);
    }
  };

  const handleMarkAllRead = () => {
    soundEngine.playChime(523.25, 0.5, 0.08);
    notificationService.markAllAsRead(currentUser.id);
  };

  const handleEnablePush = async () => {
    const granted = await notificationService.requestPermission();
    setHasPermission(granted);
    if (granted) {
      soundEngine.playChime(659.25, 1.0, 0.08);
      notificationService.sendNotification({
        type: 'letter',
        title: '🔔 Notifications Enabled!',
        message: 'You will receive gentle reminders and notes right to your device.',
        targetTab: 'garden',
        senderId: 'system',
        senderName: 'Garden Spirit 🌸',
        recipientId: currentUser.id,
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'letter':
        return <PenLine className="w-3.5 h-3.5 text-pink-300" />;
      case 'song':
        return <Headphones className="w-3.5 h-3.5 text-purple-300" />;
      case 'shelf':
        return <Layers className="w-3.5 h-3.5 text-amber-300" />;
      case 'memory':
        return <Camera className="w-3.5 h-3.5 text-rose-300" />;
      case 'date':
        return <CalendarDays className="w-3.5 h-3.5 text-teal-300" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-pink-300" />;
    }
  };

  const formatTimeAgo = (iso: string) => {
    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-pink-300/40 text-slate-200 hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
        aria-label="Garden Notifications"
        title="Garden Reminders & Notifications"
      >
        <Bell className="w-4 h-4 text-pink-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md shadow-pink-500/50 animate-pulse border border-white/40">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Opaque, Perfectly Aligned Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border-2 border-pink-400/50 shadow-2xl shadow-black/90 z-[3000] overflow-hidden animate-fade-in text-white"
          style={{
            backgroundColor: '#0d071c',
            maxWidth: 'calc(100vw - 20px)',
          }}
        >
          {/* Header */}
          <div className="p-3.5 px-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-pink-500/20 text-pink-300">
                <Bell className="w-3.5 h-3.5" />
              </span>
              <span className="font-serif text-sm font-bold text-white">
                Garden Reminders & Updates
              </span>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-mono text-pink-300 hover:text-white transition-colors"
                >
                  Mark read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Browser Permission Prompt if not active */}
          {!hasPermission && (
            <div className="p-3 bg-pink-500/15 border-b border-pink-400/20 flex items-center justify-between gap-2">
              <div className="text-[11px] text-pink-200">
                Get notified when your partner writes or plans a date!
              </div>
              <button
                onClick={handleEnablePush}
                className="px-2.5 py-1 rounded-full bg-pink-500 hover:bg-pink-400 text-white text-[10px] font-semibold tracking-wide whitespace-nowrap shadow-sm active:scale-95 transition-all"
              >
                Allow
              </button>
            </div>
          )}

          {/* Notification Items List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-2">
                <Heart className="w-7 h-7 mx-auto text-pink-400/40 animate-pulse" />
                <p className="text-xs text-slate-300 font-serif italic">
                  All peaceful in our sanctuary...
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  When either of you shares a note, song, or date, it will bloom here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 px-4 flex items-start gap-3 hover:bg-white/[0.06] cursor-pointer transition-all ${
                    !notif.isRead ? 'bg-pink-500/[0.08]' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white/[0.06] border border-white/10 shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-semibold text-white truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300/90 font-light mt-0.5 line-clamp-2 leading-snug">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-mono text-pink-300/80">
                        From {notif.senderName}
                      </span>
                      {!notif.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
