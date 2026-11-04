import type { GardenNotification } from '../types/garden';
import { AUTHORIZED_PROFILES as DEFAULT_PROFILES } from './authService';

const STORAGE_KEY = 'perfect_time_notifications';

const INITIAL_NOTIFICATIONS: GardenNotification[] = [
  {
    id: 'seed-notif-1',
    type: 'letter',
    title: '💌 Letter in the Garden',
    message: 'Solomon shared a sweet letter: "Looking at our little universe..."',
    targetTab: 'letters',
    senderId: DEFAULT_PROFILES.solomon.id,
    senderName: DEFAULT_PROFILES.solomon.displayName,
    recipientId: DEFAULT_PROFILES.noella.id,
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    isPrivate: false,
  },
  {
    id: 'seed-notif-2',
    type: 'song',
    title: '🎵 Song Shared with You',
    message: 'Noella added "Golden Hour - JVKE" to Sound Garden!',
    targetTab: 'sound',
    senderId: DEFAULT_PROFILES.noella.id,
    senderName: DEFAULT_PROFILES.noella.displayName,
    recipientId: DEFAULT_PROFILES.solomon.id,
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    isPrivate: false,
  },
  {
    id: 'seed-notif-3',
    type: 'date',
    title: '📅 Date Suggestion',
    message: 'Solomon proposed: Sunset walk & coffee downtown ✨',
    targetTab: 'time',
    senderId: DEFAULT_PROFILES.solomon.id,
    senderName: DEFAULT_PROFILES.solomon.displayName,
    recipientId: DEFAULT_PROFILES.noella.id,
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    isPrivate: false,
  },
];

function loadNotifications(): GardenNotification[] {
  if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveNotifications(INITIAL_NOTIFICATIONS);
      return INITIAL_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_NOTIFICATIONS;
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

function saveNotifications(data: GardenNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save notifications', err);
  }
}

const listeners = new Set<() => void>();

export const notificationService = {
  subscribe(callback: () => void): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  notifyListeners(): void {
    listeners.forEach((fn) => fn());
  },

  getNotificationsForUser(userId: string): GardenNotification[] {
    const all = loadNotifications();
    return all
      .filter((n) => n.recipientId === userId && !n.isPrivate)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getUnreadCount(userId: string): number {
    return this.getNotificationsForUser(userId).filter((n) => !n.isRead).length;
  },

  sendNotification(params: {
    type: 'letter' | 'petal' | 'song' | 'shelf' | 'memory' | 'date' | 'mood';
    title: string;
    message: string;
    targetTab: string;
    senderId: string;
    senderName: string;
    recipientId: string;
    isPrivate?: boolean;
  }): void {
    // If it's private, NEVER notify the partner!
    if (params.isPrivate) return;

    const notif: GardenNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: params.type,
      title: params.title,
      message: params.message,
      targetTab: params.targetTab,
      senderId: params.senderId,
      senderName: params.senderName,
      recipientId: params.recipientId,
      isRead: false,
      createdAt: new Date().toISOString(),
      isPrivate: false,
    };

    const all = loadNotifications();
    all.unshift(notif);
    // Keep last 100 notifications
    if (all.length > 100) all.length = 100;
    saveNotifications(all);
    this.notifyListeners();

    // Trigger Browser Notification if supported and granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(params.title, {
          body: params.message,
          icon: '/icon.svg',
          badge: '/icon.svg',
        });
      } catch (err) {
        console.warn('Browser notification failed', err);
      }
    }
  },

  markAsRead(id: string): void {
    const all = loadNotifications();
    const updated = all.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    saveNotifications(updated);
    this.notifyListeners();
  },

  markAllAsRead(userId: string): void {
    const all = loadNotifications();
    const updated = all.map((n) => (n.recipientId === userId ? { ...n, isRead: true } : n));
    saveNotifications(updated);
    this.notifyListeners();
  },

  clearAll(userId: string): void {
    const all = loadNotifications();
    const remaining = all.filter((n) => n.recipientId !== userId);
    saveNotifications(remaining);
    this.notifyListeners();
  },

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch {
      return false;
    }
  },

  hasBrowserPermission(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return Notification.permission === 'granted';
  },
};

