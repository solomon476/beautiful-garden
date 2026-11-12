import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Sparkles,
  X,
  Heart,
  PenLine,
  Headphones,
  Layers,
  Camera,
  CalendarDays,
  CheckCheck,
  Trash2,
  Smile,
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import type { GardenNotification, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import { extractMemoryIdFromNotification } from '../../utils/notificationHelpers';

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
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');
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
    notificationService.markAsRead(notif.id, currentUser.id);
    setIsOpen(false);

    // If it's a memory / photo like notification, take them directly to the liked moment!
    const memoryId = extractMemoryIdFromNotification(notif);
    if (memoryId) {
      sessionStorage.setItem('pending_open_memory_id', memoryId);
      window.dispatchEvent(new CustomEvent('garden-open-memory', { detail: { memoryId } }));
    }

    if (notif.targetTab) {
      onSelectTab(notif.targetTab);
    }
  };

  const handleDeleteNotification = (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    soundEngine.playSparkle();
    notificationService.deleteNotification(notifId, currentUser.id);
  };

  const handleMarkAllRead = () => {
    soundEngine.playChime(523.25, 0.5, 0.08);
    notificationService.markAllAsRead(currentUser.id);
  };

  const handleClearAll = () => {
    soundEngine.playSparkle();
    notificationService.clearAll(currentUser.id);
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

  const getBadgeMeta = (type: string) => {
    switch (type) {
      case 'letter':
        return {
          icon: <PenLine className="w-3.5 h-3.5 text-pink-300" />,
          bg: 'bg-pink-500/15 border-pink-400/30',
        };
      case 'song':
        return {
          icon: <Headphones className="w-3.5 h-3.5 text-purple-300" />,
          bg: 'bg-purple-500/15 border-purple-400/30',
        };
      case 'shelf':
        return {
          icon: <Layers className="w-3.5 h-3.5 text-emerald-300" />,
          bg: 'bg-emerald-500/15 border-emerald-400/30',
        };
      case 'memory':
        return {
          icon: <Camera className="w-3.5 h-3.5 text-rose-300" />,
          bg: 'bg-rose-500/15 border-rose-400/30',
        };
      case 'date':
        return {
          icon: <CalendarDays className="w-3.5 h-3.5 text-teal-300" />,
          bg: 'bg-teal-500/15 border-teal-400/30',
        };
      case 'mood':
        return {
          icon: <Smile className="w-3.5 h-3.5 text-amber-300" />,
          bg: 'bg-amber-500/15 border-amber-400/30',
        };
      default:
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-pink-300" />,
          bg: 'bg-pink-500/15 border-pink-400/30',
        };
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
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const displayedNotifications = filterMode === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      ref={dropdownRef}
      style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px' }}
    >
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-pink-300/40 text-slate-200 hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
        style={{
          width: '36px',
          height: '36px',
          minWidth: '36px',
          minHeight: '36px',
          maxWidth: '36px',
          maxHeight: '36px',
          borderRadius: '50%',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Garden Notifications"
        title="Garden Reminders & Notifications"
      >
        <Bell className="w-4 h-4 text-pink-200" />
        {unreadCount > 0 && (
          <span
            className="absolute rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold flex items-center justify-center shadow-md shadow-pink-500/50 animate-pulse border border-white/40"
            style={{
              top: '-2px',
              right: '-2px',
              minWidth: '16px',
              height: '16px',
              padding: '0 3px',
              fontSize: '9px',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Opaque, Mobile-Clamped Responsive Dropdown Panel */}
      {isOpen && (
        <div className="notification-dropdown animate-fade-in">
          {/* Header */}
          <div className="p-3.5 px-4 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-pink-500/20 text-pink-300">
                <Bell className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="font-serif text-sm font-bold text-white block leading-tight">
                  Garden Reminders & Updates
                </span>
                <span className="text-[10px] text-pink-300/70 font-mono">
                  {unreadCount === 0 ? 'All caught up ✨' : `${unreadCount} unread note${unreadCount > 1 ? 's' : ''}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-[10px] font-mono text-pink-200 hover:text-white transition-colors border border-white/10"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3 h-3 text-pink-300" />
                  <span>Mark read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="p-1 rounded-full hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Pills Bar */}
          <div className="px-4 py-2 border-b border-white/5 bg-white/[0.015] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                  filterMode === 'all'
                    ? 'bg-pink-500 text-white shadow-sm shadow-pink-500/40'
                    : 'bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilterMode('unread')}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                  filterMode === 'unread'
                    ? 'bg-pink-500 text-white shadow-sm shadow-pink-500/40'
                    : 'bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            <span className="text-[10px] text-slate-400 font-mono">
              Tap to open
            </span>
          </div>

          {/* Browser Permission Prompt if not active */}
          {!hasPermission && (
            <div className="p-3 bg-pink-500/15 border-b border-pink-400/20 flex items-center justify-between gap-2">
              <div className="text-[11px] text-pink-200 leading-tight">
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
          <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
            {displayedNotifications.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-2">
                <Heart className="w-7 h-7 mx-auto text-pink-400/40 animate-pulse" />
                <p className="text-xs text-slate-300 font-serif italic">
                  {filterMode === 'unread'
                    ? 'All caught up! No unread reminders 🌸'
                    : 'All peaceful in our sanctuary...'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {filterMode === 'unread'
                    ? 'Switch to "All" to view previous notes and songs.'
                    : 'When either of you shares a note, song, or date, it will bloom here.'}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const meta = getBadgeMeta(notif.type);
                const isUnread = !notif.isRead;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group relative p-3.5 px-4 flex items-start gap-3 hover:bg-white/[0.07] cursor-pointer transition-all ${
                      isUnread
                        ? 'bg-pink-500/[0.08] border-l-2 border-pink-400'
                        : 'border-l-2 border-transparent'
                    }`}
                  >
                    {/* Category Icon Badge */}
                    <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${meta.bg}`}>
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-white leading-tight">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] font-mono text-pink-200/70 shrink-0 whitespace-nowrap">
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300/95 font-light mt-1 leading-snug line-clamp-2">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-mono text-pink-300/80 bg-white/5 px-1.5 py-0.5 rounded">
                          From {notif.senderName}
                        </span>
                        {isUnread && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-pink-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse shadow-sm shadow-pink-400/80" />
                            New
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Individual Dismiss / Delete Action Button */}
                    <button
                      onClick={(e) => handleDeleteNotification(e, notif.id)}
                      className="absolute right-2 top-2 p-1 rounded-full text-slate-500 hover:text-rose-300 hover:bg-white/10 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Dismiss notification"
                      aria-label="Dismiss notification"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
