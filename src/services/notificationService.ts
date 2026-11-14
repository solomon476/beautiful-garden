import type { GardenNotification } from '../types/garden';
import { AUTHORIZED_PROFILES as DEFAULT_PROFILES } from './authService';
import { supabase, isLiveSupabaseConfigured } from './supabaseClient';
import { soundEngine } from '../utils/audio';
import { commentService } from './commentService';

const STORAGE_KEY = 'perfect_time_notifications_v2';
const READ_IDS_KEY = 'perfect_time_read_notification_ids_v2';
const CLEARED_AT_KEY = 'perfect_time_notifications_cleared_at';
const DELETED_IDS_KEY = 'perfect_time_deleted_notif_ids';
const V2_INIT_KEY = 'perfect_time_notifs_fresh_v2';
const CLEARED_AT_FIX_KEY = 'pt_cleared_at_fix_v3';

// Clear legacy clearedAt timestamp if it was prematurely set by older build
if (typeof window !== 'undefined') {
  try {
    if (!localStorage.getItem(CLEARED_AT_FIX_KEY)) {
      localStorage.setItem(CLEARED_AT_FIX_KEY, 'true');
      localStorage.removeItem(CLEARED_AT_KEY);
      localStorage.removeItem(`${CLEARED_AT_KEY}_${DEFAULT_PROFILES.solomon.id}`);
      localStorage.removeItem(`${CLEARED_AT_KEY}_${DEFAULT_PROFILES.noella.id}`);
    }
  } catch {}
}

export function deduplicateNotifications(list: GardenNotification[]): GardenNotification[] {
  const seenIds = new Set<string>();
  const seenFingerprints = new Set<string>();
  const deduped: GardenNotification[] = [];

  for (const n of list) {
    if (!n || !n.id) continue;
    if (seenIds.has(n.id)) continue;

    // Build fingerprint by normalizing message and title to eliminate duplicated notifications
    // across local action generation, Supabase sync, and Realtime broadcasts
    const normMsg = (n.message || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 45);
    const normTitle = (n.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 25);
    const fingerprint = `${n.type || ''}-${n.senderId || ''}-${n.recipientId || ''}-${normTitle}-${normMsg}`;

    if (seenFingerprints.has(fingerprint)) {
      continue;
    }

    seenIds.add(n.id);
    seenFingerprints.add(fingerprint);
    deduped.push(n);
  }

  return deduped;
}

function getClearedAt(userId?: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const key = userId ? `${CLEARED_AT_KEY}_${userId}` : CLEARED_AT_KEY;
    const raw = localStorage.getItem(key);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

function setClearedAt(userId?: string, timestamp: number = Date.now()): void {
  if (typeof window === 'undefined') return;
  try {
    if (userId) {
      localStorage.setItem(`${CLEARED_AT_KEY}_${userId}`, timestamp.toString());
    }
    localStorage.setItem(CLEARED_AT_KEY, timestamp.toString());
  } catch (err) {
    console.error('Failed to set cleared at timestamp', err);
  }
}

function getDeletedNotificationIds(userId?: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const key = userId ? `${DELETED_IDS_KEY}_${userId}` : DELETED_IDS_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveDeletedNotificationIds(ids: Set<string>, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const arr = Array.from(ids);
    if (userId) {
      localStorage.setItem(`${DELETED_IDS_KEY}_${userId}`, JSON.stringify(arr));
    }
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(arr));
  } catch (err) {
    console.error('Failed to save deleted notification IDs', err);
  }
}

function getReadNotificationIds(userId?: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const key = userId ? `${READ_IDS_KEY}_${userId}` : READ_IDS_KEY;
    const raw = localStorage.getItem(key) || (userId ? localStorage.getItem(READ_IDS_KEY) : null);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveReadNotificationIds(ids: Set<string>, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const arr = Array.from(ids);
    if (userId) {
      localStorage.setItem(`${READ_IDS_KEY}_${userId}`, JSON.stringify(arr));
    }
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(arr));
  } catch (err) {
    console.error('Failed to save read notification IDs', err);
  }
}

function loadNotifications(): GardenNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const isFreshV2 = localStorage.getItem(V2_INIT_KEY);
    if (!isFreshV2) {
      // Clear out all historical seed notifications for clean slate
      localStorage.setItem(V2_INIT_KEY, 'true');
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return deduplicateNotifications(parsed);
  } catch {
    return [];
  }
}

function saveNotifications(data: GardenNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    const deduped = deduplicateNotifications(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
  } catch (err) {
    console.error('Failed to save notifications', err);
  }
}

const listeners = new Set<() => void>();
let realtimeChannel: any = null;
let isChannelSubscribed = false;
let realtimeSubscribersCount = 0;

function triggerSystemNotification(title: string, body: string, targetTab?: string): void {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;

  const url = window.location.origin + (targetTab ? `/?tab=${targetTab}` : '');
  const options: NotificationOptions = {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: { url },
  };

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => {
        reg.showNotification(title, options);
      })
      .catch(() => {
        try {
          new Notification(title, options);
        } catch (e) {
          console.warn('System notification fallback failed:', e);
        }
      });
  } else {
    try {
      new Notification(title, options);
    } catch (e) {
      console.warn('System notification fallback failed:', e);
    }
  }
}

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
    const readIds = getReadNotificationIds(userId);

    return deduplicateNotifications(all)
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

    realtimeSubscribersCount++;

    const cleanup = () => {
      realtimeSubscribersCount = Math.max(0, realtimeSubscribersCount - 1);
      if (realtimeSubscribersCount === 0 && supabase && realtimeChannel) {
        try {
          supabase.removeChannel(realtimeChannel);
        } catch (e) {
          console.warn('Error unsubscribing realtime channel', e);
        }
        realtimeChannel = null;
        isChannelSubscribed = false;
      }
    };

    if (realtimeChannel && isChannelSubscribed) {
      return cleanup;
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

      // 1.5. Listen for instant cross-device comment broadcasts
      realtimeChannel.on('broadcast', { event: 'garden_comment' }, ({ payload }: any) => {
        if (!payload) return;
        if (payload.authorId !== currentUserId) {
          commentService.mergeCloudComments(payload.targetId, payload.targetType, [payload]);
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

      return cleanup;
    } catch (err) {
      console.warn('Realtime subscription initialization error', err);
      return cleanup;
    }
  },

  /**
   * Handles incoming notification received over the wire
   */
  handleIncomingNotification(notif: GardenNotification): void {
    const all = loadNotifications();
    const readIds = getReadNotificationIds(notif.recipientId);

    // Check duplicate by id
    const exists = all.some((n) => n.id === notif.id);

    // Check duplicate by content fingerprint to prevent broadcast vs db echo
    const normMsg = (notif.message || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 45);
    const normTitle = (notif.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 25);
    const fingerprint = `${notif.type || ''}-${notif.senderId || ''}-${notif.recipientId || ''}-${normTitle}-${normMsg}`;
    const hasDuplicateContent = all.some((n) => {
      const m = (n.message || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 45);
      const t = (n.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 25);
      return `${n.type || ''}-${n.senderId || ''}-${n.recipientId || ''}-${t}-${m}` === fingerprint;
    });

    if (!exists && !hasDuplicateContent) {
      const entry: GardenNotification = {
        ...notif,
        isRead: readIds.has(notif.id) ? true : Boolean(notif.isRead),
      };
      all.unshift(entry);
      const deduped = deduplicateNotifications(all);
      if (deduped.length > 100) deduped.length = 100;
      saveNotifications(deduped);

      // Play gentle chime ONLY for genuine new incoming notification
      try {
        soundEngine.playChime(659.25, 1.0, 0.08);
      } catch {
        // Audio autoplay policy fallback
      }

      // Trigger in-app live toast pop
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('garden-toast-notification', { detail: entry }));
      }

      // Trigger browser/system banner if permitted
      triggerSystemNotification(notif.title, notif.message, notif.targetTab);

      this.notifyListeners();
    }
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
      const readIds = getReadNotificationIds(userId);
      const clearedAt = getClearedAt(userId);
      const deletedIds = getDeletedNotificationIds(userId);

      const shouldInclude = (id: string, createdAt: string) => {
        if (deletedIds.has(id)) return false;
        if (clearedAt > 0 && new Date(createdAt).getTime() <= clearedAt) return false;
        return true;
      };

      // 1. Hangouts / Date Proposals
      if (hangouts.data) {
        for (const h of hangouts.data) {
          const id = `notif-date-${h.id}`;
          if (!shouldInclude(id, h.created_at)) continue;
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
            entityId: h.id,
          });
        }
      }

      // 2. Letters
      if (notes.data) {
        for (const n of notes.data) {
          const id = `notif-letter-${n.id}`;
          if (!shouldInclude(id, n.created_at)) continue;
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
            entityId: n.id,
          });
        }
      }

      // 3. Petal Notes
      if (petals.data) {
        for (const p of petals.data) {
          const id = `notif-petal-${p.id}`;
          if (!shouldInclude(id, p.created_at)) continue;
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
            entityId: p.id,
          });
        }
      }

      // 4. Songs / Music
      if (songs.data) {
        for (const s of songs.data) {
          const id = `notif-song-${s.id}`;
          if (!shouldInclude(id, s.created_at)) continue;
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
            entityId: s.id,
          });
        }
      }

      // 5. Memories
      if (memories.data) {
        for (const m of memories.data) {
          const id = `notif-memory-${m.id}`;
          if (!shouldInclude(id, m.created_at)) continue;
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
            entityId: m.id,
          });
        }
      }

      // 6. Moods
      if (moods.data) {
        for (const md of moods.data) {
          const id = `notif-mood-${md.id}`;
          if (!shouldInclude(id, md.created_at)) continue;
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
            entityId: md.id,
          });
        }
      }

      // 7. Shelf
      if (shelf.data) {
        for (const sh of shelf.data) {
          const id = `notif-shelf-${sh.id}`;
          if (!shouldInclude(id, sh.created_at)) continue;
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
            entityId: sh.id,
          });
        }
      }

      // Merge cloud notifications with local ones and deduplicate
      const existing = loadNotifications();
      const merged = deduplicateNotifications([...cloudNotifs, ...existing]);

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
    type: 'letter' | 'petal' | 'song' | 'shelf' | 'memory' | 'date' | 'mood' | 'question';
    title: string;
    message: string;
    targetTab: string;
    senderId: string;
    senderName: string;
    recipientId: string;
    isPrivate?: boolean;
    entityId?: string;
  }): void {
    // If it's private, NEVER notify the partner!
    if (params.isPrivate) return;

    // Use deterministic entity-based ID to ensure cloud-sync never duplicates local actions
    const notifId = params.entityId
      ? `notif-${params.type}-${params.entityId}`
      : `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const notif: GardenNotification = {
      id: notifId,
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
      entityId: params.entityId,
    };

    const all = loadNotifications();
    const exists = all.some((n) => n.id === notif.id);
    if (!exists) {
      all.unshift(notif);
      const deduped = deduplicateNotifications(all);
      if (deduped.length > 100) deduped.length = 100;
      saveNotifications(deduped);
      this.notifyListeners();
    }

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

    // Trigger system notification if supported and granted
    triggerSystemNotification(params.title, params.message, params.targetTab);
  },

  markAsRead(id: string, userId?: string): void {
    const readIds = getReadNotificationIds(userId);
    readIds.add(id);
    saveReadNotificationIds(readIds, userId);

    const all = loadNotifications();
    const updated = all.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    saveNotifications(updated);
    this.notifyListeners();
  },

  markAllAsRead(userId: string): void {
    const all = loadNotifications();
    const readIds = getReadNotificationIds(userId);

    all.forEach((n) => {
      if (n.recipientId === userId) {
        readIds.add(n.id);
      }
    });
    saveReadNotificationIds(readIds, userId);

    const updated = all.map((n) => (n.recipientId === userId ? { ...n, isRead: true } : n));
    saveNotifications(updated);
    this.notifyListeners();
  },

  deleteNotification(id: string, userId: string): void {
    const deletedIds = getDeletedNotificationIds(userId);
    deletedIds.add(id);
    saveDeletedNotificationIds(deletedIds, userId);

    const all = loadNotifications();
    const remaining = all.filter((n) => !(n.id === id && n.recipientId === userId));
    saveNotifications(remaining);
    this.notifyListeners();
  },

  clearAll(userId: string): void {
    setClearedAt(userId, Date.now());
    const all = loadNotifications();
    const remaining = all.filter((n) => n.recipientId !== userId);
    saveNotifications(remaining);
    this.notifyListeners();
  },

  clearRead(userId: string): void {
    const readIds = getReadNotificationIds(userId);
    const all = loadNotifications();
    const remaining = all.filter((n) => {
      if (n.recipientId !== userId) return true;
      return !n.isRead && !readIds.has(n.id);
    });
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
