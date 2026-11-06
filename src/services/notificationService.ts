import type { GardenNotification } from '../types/garden';
import { AUTHORIZED_PROFILES as DEFAULT_PROFILES } from './authService';
import { supabase, isLiveSupabaseConfigured } from './supabaseClient';
import { soundEngine } from '../utils/audio';

const STORAGE_KEY = 'perfect_time_notifications';
const READ_IDS_KEY = 'perfect_time_read_notification_ids';

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

function getReadNotificationIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(READ_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveReadNotificationIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(Array.from(ids)));
  } catch (err) {
    console.error('Failed to save read notification IDs', err);
  }
}

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
let realtimeChannel: any = null;
let isChannelSubscribed = false;

export const notificationService = {
  subscribe(callback: () => void): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  notifyListeners(): void {
    listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Error in notification listener', err);
      }
    });
  },

  getNotificationsForUser(userId: string): GardenNotification[] {
    const all = loadNotifications();
    const readIds = getReadNotificationIds();

    return all
      .filter((n) => n.recipientId === userId && !n.isPrivate)
      .map((n) => (readIds.has(n.id) ? { ...n, isRead: true } : n))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getUnreadCount(userId: string): number {
    return this.getNotificationsForUser(userId).filter((n) => !n.isRead).length;
  },

  /**
   * Initializes persistent Supabase Realtime broadcast and change stream
   */
  initRealtime(currentUserId: string): () => void {
    if (typeof window === 'undefined' || !isLiveSupabaseConfigured || !supabase) {
      return () => {};
    }

    if (realtimeChannel && isChannelSubscribed) {
      return () => {};
    }

    try {
      realtimeChannel = supabase.channel('garden_notifications_stream');

      // 1. Listen for instant cross-device broadcast messages
      realtimeChannel.on('broadcast', { event: 'garden_notification' }, ({ payload }: any) => {
        if (!payload) return;
        if (payload.recipientId === currentUserId) {
          this.handleIncomingNotification(payload);
        }
      });

      // 2. Listen for Postgres INSERT changes across all garden tables
      const handleDbChange = (_table: string, row: any) => {
        if (!row) return;
        // Don't notify self for self-initiated rows
        const authorId = row.suggested_by || row.author_id || row.added_by || row.contributor_id || row.user_id;
        if (authorId === currentUserId) return;

        // Sync cloud notifications to catch the new row
        this.syncCloudNotifications(currentUserId);
      };

      realtimeChannel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hangout_suggestions' }, (p: any) =>
          handleDbChange('hangout_suggestions', p.new)
        )
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notes' }, (p: any) =>
          handleDbChange('notes', p.new)
        )
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'petal_notes' }, (p: any) =>
          handleDbChange('petal_notes', p.new)
        )
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'songs' }, (p: any) =>
          handleDbChange('songs', p.new)
        )
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'garden_memories' }, (p: any) =>
          handleDbChange('garden_memories', p.new)
        )
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mood_entries' }, (p: any) =>
          handleDbChange('mood_entries', p.new)
        );

      realtimeChannel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          isChannelSubscribed = true;
        }
      });

      return () => {
        try {
          if (supabase && realtimeChannel) {
            supabase.removeChannel(realtimeChannel);
            realtimeChannel = null;
            isChannelSubscribed = false;
          }
        } catch (e) {
          console.warn('Error unsubscribing realtime channel', e);
        }
      };
    } catch (err) {
      console.warn('Realtime subscription initialization error', err);
      return () => {};
    }
  },

  /**
   * Handles incoming notification received over the wire
   */
  handleIncomingNotification(notif: GardenNotification): void {
    const all = loadNotifications();
    const readIds = getReadNotificationIds();

    // Check if duplicate
    const exists = all.some((n) => n.id === notif.id);
    if (!exists) {
      const entry: GardenNotification = {
        ...notif,
        isRead: readIds.has(notif.id) ? true : Boolean(notif.isRead),
      };
      all.unshift(entry);
      if (all.length > 100) all.length = 100;
      saveNotifications(all);
    }

    // Gentle audio chime for incoming notification
    try {
      soundEngine.playChime(659.25, 1.0, 0.08);
    } catch {
      // Audio autoplay policy fallback
    }

    // Trigger browser banner if permitted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notif.title, {
          body: notif.message,
          icon: '/icon.svg',
          badge: '/icon.svg',
        });
      } catch (err) {
        console.warn('Browser push notification failed', err);
      }
    }

    this.notifyListeners();
  },

  /**
   * Synchronizes recent partner activities from Supabase into notifications
   * (Ensures offline / missed notifications are never lost!)
   */
  async syncCloudNotifications(userId: string): Promise<void> {
    if (typeof window === 'undefined' || !isLiveSupabaseConfigured || !supabase) return;

    try {
      const partner = userId === DEFAULT_PROFILES.noella.id ? DEFAULT_PROFILES.solomon : DEFAULT_PROFILES.noella;
      const partnerName = partner.displayName;

      // Query recent partner activities across all tables
      const [hangouts, notes, petals, songs, memories, moods, shelf] = await Promise.all([
        supabase
          .from('hangout_suggestions')
          .select('*')
          .neq('suggested_by', userId)
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('notes')
          .select('*')
          .neq('author_id', userId)
          .eq('is_shared', true)
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('petal_notes')
          .select('*')
          .neq('author_id', userId)
          .eq('is_shared', true)
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('songs')
          .select('*')
          .neq('added_by', userId)
          .eq('is_shared', true)
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('garden_memories')
          .select('*')
          .neq('contributor_id', userId)
          .eq('is_shared', true)
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('mood_entries')
          .select('*')
          .neq('user_id', userId)
          .eq('is_shared', true)
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('recommendations')
          .select('*')
          .neq('contributor_id', userId)
          .eq('is_shared', true)
          .order('created_at', { ascending: false })
          .limit(15),
      ]);

      const cloudNotifs: GardenNotification[] = [];
      const readIds = getReadNotificationIds();

      // 1. Hangouts / Date Proposals
      if (hangouts.data) {
        for (const h of hangouts.data) {
          const id = `notif-hangout-${h.id}`;
          cloudNotifs.push({
            id,
            type: 'date',
            title: '📅 New Date Proposal',
            message: `${partnerName} proposed: "${h.title}"${h.date ? ` for ${h.date}` : ''} ✨`,
            targetTab: 'time',
            senderId: h.suggested_by,
            senderName: partnerName,
            recipientId: userId,
            isRead: readIds.has(id),
            createdAt: h.created_at,
            isPrivate: false,
          });
        }
      }

      // 2. Letters
      if (notes.data) {
        for (const n of notes.data) {
          const id = `notif-letter-${n.id}`;
          cloudNotifs.push({
            id,
            type: 'letter',
            title: '💌 Letter in the Garden',
            message: `${partnerName} shared a letter: "${n.title || n.body.slice(0, 35)}..."`,
            targetTab: 'letters',
            senderId: n.author_id,
            senderName: partnerName,
            recipientId: userId,
            isRead: readIds.has(id),
            createdAt: n.created_at,
            isPrivate: false,
          });
        }
      }

      // 3. Petal Notes
      if (petals.data) {
        for (const p of petals.data) {
          const id = `notif-petal-${p.id}`;
          cloudNotifs.push({
            id,
            type: 'petal',
            title: '🌸 Petal Note Whisper',
            message: `${partnerName} left you a note: "${p.body.slice(0, 40)}"`,
            targetTab: 'petals',
            senderId: p.author_id,
            senderName: partnerName,
            recipientId: userId,
            isRead: readIds.has(id),
            createdAt: p.created_at,
            isPrivate: false,
          });
        }
      }

      // 4. Songs / Music
      if (songs.data) {
        for (const s of songs.data) {
          const id = `notif-song-${s.id}`;
          cloudNotifs.push({
            id,
            type: 'song',
            title: '🎵 Song Shared with You',
            message: `${partnerName} added "${s.title} - ${s.artist}" to Sound Garden!`,
            targetTab: 'sound',
            senderId: s.added_by,
            senderName: partnerName,
            recipientId: userId,
            isRead: readIds.has(id),
            createdAt: s.created_at,
            isPrivate: false,
          });
        }
      }

      // 5. Memories
      if (memories.data) {
        for (const m of memories.data) {
          const id = `notif-memory-${m.id}`;
          cloudNotifs.push({
            id,
            type: 'memory',
            title: '📷 New Memory in Archive',
            message: `${partnerName} uploaded: "${m.title}" to Our Archive!`,
            targetTab: 'archive',
            senderId: m.contributor_id,
            senderName: partnerName,
            recipientId: userId,
            isRead: readIds.has(id),
            createdAt: m.created_at,
            isPrivate: false,
          });
        }
      }

      // 6. Moods
      if (moods.data) {
        for (const md of moods.data) {
          const id = `notif-mood-${md.id}`;
          cloudNotifs.push({
            id,
            type: 'mood',
            title: '🌙 Mood Shared in the Garden',
            message: `${partnerName} is feeling ${md.mood_label}${md.note ? `: "${md.note}"` : ''}`,
            targetTab: 'moods',
            senderId: md.user_id,
            senderName: partnerName,
            recipientId: userId,
            isRead: readIds.has(id),
            createdAt: md.created_at,
            isPrivate: false,
          });
        }
      }

      // 7. Shelf
      if (shelf.data) {
        for (const sh of shelf.data) {
          const id = `notif-shelf-${sh.id}`;
          cloudNotifs.push({
            id,
            type: 'shelf',
            title: '📚 New on Exchange Shelf',
            message: `${partnerName} shared: "${sh.title}" on the shelf!`,
            targetTab: 'shelf',
            senderId: sh.contributor_id,
            senderName: partnerName,
            recipientId: userId,
            isRead: readIds.has(id),
            createdAt: sh.created_at,
            isPrivate: false,
          });
        }
      }

      // Merge cloud notifications with local ones
      const existing = loadNotifications();
      const existingIds = new Set(existing.map((e) => e.id));

      const merged = [...existing];
      for (const cn of cloudNotifs) {
        if (!existingIds.has(cn.id)) {
          merged.push(cn);
          existingIds.add(cn.id);
        }
      }

      // Sort newest first
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (merged.length > 100) merged.length = 100;

      saveNotifications(merged);
      this.notifyListeners();
    } catch (err) {
      console.warn('Syncing cloud notifications error:', err);
    }
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
    if (all.length > 100) all.length = 100;
    saveNotifications(all);
    this.notifyListeners();

    // Broadcast across devices via Supabase Realtime channel
    if (typeof window !== 'undefined' && isLiveSupabaseConfigured && supabase) {
      try {
        const channel = realtimeChannel || supabase.channel('garden_notifications_stream');
        channel.send({
          type: 'broadcast',
          event: 'garden_notification',
          payload: notif,
        }).catch((err: any) => {
          console.warn('Realtime notification broadcast error:', err);
        });
      } catch (err) {
        console.warn('Failed to broadcast realtime notification:', err);
      }
    }

    // Trigger local Browser Notification if supported and granted
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
    const readIds = getReadNotificationIds();
    readIds.add(id);
    saveReadNotificationIds(readIds);

    const all = loadNotifications();
    const updated = all.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    saveNotifications(updated);
    this.notifyListeners();
  },

  markAllAsRead(userId: string): void {
    const all = loadNotifications();
    const readIds = getReadNotificationIds();

    all.forEach((n) => {
      if (n.recipientId === userId) {
        readIds.add(n.id);
      }
    });
    saveReadNotificationIds(readIds);

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
