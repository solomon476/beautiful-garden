import { supabase, isLiveSupabaseConfigured } from './supabaseClient';
import { notificationService } from './notificationService';

export interface ChatEventData {
  eventType: 'like' | 'song' | 'question' | 'petal' | 'celebration' | 'letter' | 'moment';
  title: string;
  linkTab?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'text' | 'voice' | 'photo' | 'event';
  eventData?: ChatEventData;
  reactions?: Record<string, string>; // userId -> emoji
  voiceNoteUrl?: string;
  voiceDuration?: number;
  photoUrl?: string;
  isRead?: boolean;
}

const STORAGE_KEY = 'garden_chat_messages_v1';
const listeners = new Set<() => void>();
let chatRealtimeChannel: any = null;

const SEED_MESSAGES: ChatMessage[] = [
  {
    id: 'seed-msg-1',
    senderId: 'system',
    senderName: 'Garden Spirit 🌸',
    content: 'Welcome to our private whispers! A quiet little corner just for the two of us ♡',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    type: 'event',
    eventData: {
      eventType: 'moment',
      title: 'Sanctuary Whispers Opened',
      linkTab: 'garden',
    },
    isRead: true,
  },
  {
    id: 'seed-msg-2',
    senderId: 'solomon',
    senderName: 'Solomon',
    content: 'Whenever you open this app, know that I am right here thinking of you. ✨',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    type: 'text',
    reactions: { noella: '❤️' },
    isRead: true,
  },
  {
    id: 'seed-msg-3',
    senderId: 'system',
    senderName: 'Garden Spirit 🌸',
    content: '🌸 Solomon sent a shower of cherry blossoms! "Thinking of you" ♡',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    type: 'event',
    eventData: {
      eventType: 'petal',
      title: 'Thinking of You',
      linkTab: 'garden',
    },
    isRead: true,
  },
];

function loadLocalMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return SEED_MESSAGES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_MESSAGES));
      return SEED_MESSAGES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_MESSAGES;
  } catch {
    return SEED_MESSAGES;
  }
}

function saveLocalMessages(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (err) {
    console.error('Failed to save chat messages', err);
  }
}

function notifyAll(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.warn('Chat listener err', e);
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('garden-chat-updated'));
  }
}

export const chatService = {
  getMessages(): ChatMessage[] {
    return loadLocalMessages().sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  },

  getUnreadCount(currentUserId: string): number {
    const all = loadLocalMessages();
    return all.filter((m) => m.senderId !== currentUserId && !m.isRead).length;
  },

  markAllRead(currentUserId: string): void {
    const all = loadLocalMessages();
    let changed = false;
    const updated = all.map((m) => {
      if (m.senderId !== currentUserId && !m.isRead) {
        changed = true;
        return { ...m, isRead: true };
      }
      return m;
    });

    if (changed) {
      saveLocalMessages(updated);
      notifyAll();
    }
  },

  subscribe(callback: () => void): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  async sendMessage(params: {
    content: string;
    senderId: string;
    senderName: string;
    recipientId: string;
    type?: 'text' | 'voice' | 'photo';
    voiceNoteUrl?: string;
    voiceDuration?: number;
    photoUrl?: string;
  }): Promise<ChatMessage> {
    const newMsg: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderId: params.senderId,
      senderName: params.senderName,
      content: params.content,
      timestamp: new Date().toISOString(),
      type: params.type || 'text',
      voiceNoteUrl: params.voiceNoteUrl,
      voiceDuration: params.voiceDuration,
      photoUrl: params.photoUrl,
      isRead: false,
    };

    const all = loadLocalMessages();
    const updated = [...all, newMsg];
    saveLocalMessages(updated);
    notifyAll();

    // Broadcast in real-time via Supabase
    if (typeof window !== 'undefined' && isLiveSupabaseConfigured && supabase) {
      try {
        const channel = chatRealtimeChannel || supabase.channel('garden_chat_stream');
        channel.send({
          type: 'broadcast',
          event: 'chat_message',
          payload: newMsg,
        });
      } catch (err) {
        console.warn('Realtime chat broadcast non-critical:', err);
      }
    }

    // Send partner notification
    notificationService.sendNotification({
      type: 'letter',
      title: `💬 New Whisper from ${params.senderName}`,
      message: params.type === 'voice'
        ? `🎙️ Spoken whisper (${Math.round(params.voiceDuration || 0)}s) ♡`
        : params.type === 'photo'
        ? `📸 Sent a photo moment ♡`
        : `"${params.content.slice(0, 75)}" ♡`,
      targetTab: 'chat',
      senderId: params.senderId,
      senderName: params.senderName,
      recipientId: params.recipientId,
    });

    return newMsg;
  },

  async postEventMessage(params: {
    eventType: 'like' | 'song' | 'question' | 'petal' | 'celebration' | 'letter' | 'moment';
    title: string;
    content: string;
    actorId: string;
    actorName: string;
    linkTab?: string;
  }): Promise<ChatMessage> {
    const newMsg: ChatMessage = {
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderId: 'system',
      senderName: 'Garden Spirit 🌸',
      content: params.content,
      timestamp: new Date().toISOString(),
      type: 'event',
      eventData: {
        eventType: params.eventType,
        title: params.title,
        linkTab: params.linkTab,
      },
      isRead: false,
    };

    const all = loadLocalMessages();
    // Avoid duplicate event messages within 5 seconds
    const recent = all[all.length - 1];
    if (recent && recent.content === newMsg.content && (Date.now() - new Date(recent.timestamp).getTime()) < 5000) {
      return recent;
    }

    const updated = [...all, newMsg];
    saveLocalMessages(updated);
    notifyAll();

    if (typeof window !== 'undefined' && isLiveSupabaseConfigured && supabase) {
      try {
        const channel = chatRealtimeChannel || supabase.channel('garden_chat_stream');
        channel.send({
          type: 'broadcast',
          event: 'chat_event',
          payload: newMsg,
        });
      } catch {
        // ignore
      }
    }

    return newMsg;
  },

  async toggleReaction(messageId: string, userId: string, emoji: string = '❤️'): Promise<void> {
    const all = loadLocalMessages();
    const updated = all.map((m) => {
      if (m.id === messageId) {
        const reactions = { ...(m.reactions || {}) };
        if (reactions[userId] === emoji) {
          delete reactions[userId];
        } else {
          reactions[userId] = emoji;
        }
        return { ...m, reactions };
      }
      return m;
    });

    saveLocalMessages(updated);
    notifyAll();

    if (typeof window !== 'undefined' && isLiveSupabaseConfigured && supabase) {
      try {
        const channel = chatRealtimeChannel || supabase.channel('garden_chat_stream');
        channel.send({
          type: 'broadcast',
          event: 'chat_reaction',
          payload: { messageId, userId, emoji },
        });
      } catch {
        // ignore
      }
    }
  },

  initRealtime(): () => void {
    if (typeof window === 'undefined' || !isLiveSupabaseConfigured || !supabase) {
      return () => {};
    }

    if (!chatRealtimeChannel) {
      chatRealtimeChannel = supabase.channel('garden_chat_stream');
      chatRealtimeChannel
        .on('broadcast', { event: 'chat_message' }, (payload: any) => {
          if (payload?.payload) {
            const incoming: ChatMessage = payload.payload;
            const current = loadLocalMessages();
            if (!current.some((m) => m.id === incoming.id)) {
              saveLocalMessages([...current, incoming]);
              notifyAll();
            }
          }
        })
        .on('broadcast', { event: 'chat_event' }, (payload: any) => {
          if (payload?.payload) {
            const incoming: ChatMessage = payload.payload;
            const current = loadLocalMessages();
            if (!current.some((m) => m.id === incoming.id)) {
              saveLocalMessages([...current, incoming]);
              notifyAll();
            }
          }
        })
        .on('broadcast', { event: 'chat_reaction' }, (payload: any) => {
          if (payload?.payload) {
            const { messageId, userId, emoji } = payload.payload;
            const current = loadLocalMessages();
            const updated = current.map((m) => {
              if (m.id === messageId) {
                const reactions = { ...(m.reactions || {}) };
                if (reactions[userId] === emoji) {
                  delete reactions[userId];
                } else {
                  reactions[userId] = emoji;
                }
                return { ...m, reactions };
              }
              return m;
            });
            saveLocalMessages(updated);
            notifyAll();
          }
        })
        .subscribe();
    }

    return () => {
      // Keep standing connection alive for fast responses
    };
  },
};
