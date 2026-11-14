import { authService } from './gardenService';
import { notificationService } from './notificationService';
import { supabase, isLiveSupabaseConfigured } from './supabaseClient';
import { soundEngine } from '../utils/audio';

export interface GardenComment {
  id: string;
  targetId: string; // memory.id or song.id
  targetType: 'memory' | 'song';
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string; // ISO date string
}

const STORAGE_KEY = 'perfect_time_garden_comments_v1';

function loadLocalComments(): GardenComment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalComments(comments: GardenComment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  } catch (err) {
    console.warn('[Comments] Could not save comments to local storage:', err);
  }
}

export const commentService = {
  getComments(targetId: string): GardenComment[] {
    const all = loadLocalComments();
    return all
      .filter((c) => c.targetId === targetId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  getCommentCount(targetId: string): number {
    return this.getComments(targetId).length;
  },

  getAllComments(): GardenComment[] {
    return loadLocalComments();
  },

  async addComment(
    targetId: string,
    targetType: 'memory' | 'song',
    text: string,
    targetTitle?: string
  ): Promise<GardenComment> {
    const cleanText = text.trim();
    if (!cleanText) {
      throw new Error('Comment cannot be empty');
    }

    const currentUser = authService.getCurrentUser();
    const comment: GardenComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      targetId,
      targetType,
      authorId: currentUser.id,
      authorName: currentUser.displayName,
      authorAvatar: currentUser.avatarUrl,
      text: cleanText,
      createdAt: new Date().toISOString(),
    };

    // 1. Save locally
    const existing = loadLocalComments();
    const updated = [...existing, comment];
    saveLocalComments(updated);

    // 2. Play sound & dispatch local event
    try {
      soundEngine.playSparkle();
    } catch {}
    window.dispatchEvent(
      new CustomEvent('garden-comments-updated', {
        detail: { targetId, targetType, comment },
      })
    );

    // 3. Broadcast in real time via Supabase realtime channel if available
    try {
      if (isLiveSupabaseConfigured && supabase) {
        const channel = supabase.channel('garden_notifications_stream');
        channel.send({
          type: 'broadcast',
          event: 'garden_comment',
          payload: comment,
        });
      }
    } catch (err) {
      console.warn('[Comments] Realtime broadcast error:', err);
    }

    // 4. Send interactive notification to partner
    try {
      const isMemory = targetType === 'memory';
      const title = isMemory ? '💬 Keepsake Note' : '💬 Track Note';
      const titleSuffix = targetTitle ? ` on "${targetTitle}"` : '';
      const notificationMessage = `${currentUser.displayName} wrote${titleSuffix}: "${cleanText}" ♡`;

      const partner = authService.getPartner();
      await notificationService.sendNotification({
        type: isMemory ? 'memory' : 'song',
        title,
        message: notificationMessage,
        targetTab: isMemory ? 'archive' : 'music',
        senderId: currentUser.id,
        senderName: currentUser.displayName,
        recipientId: partner.id,
        entityId: targetId,
      });
    } catch (err) {
      console.warn('[Comments] Failed to send notification:', err);
    }

    // 5. Persist to Supabase cloud in background
    this.persistCommentToCloud(targetId, targetType).catch((err) => {
      console.warn('[Comments] Background cloud persistence failed:', err);
    });

    return comment;
  },

  async deleteComment(commentId: string): Promise<boolean> {
    const all = loadLocalComments();
    const target = all.find((c) => c.id === commentId);
    if (!target) return false;

    const updated = all.filter((c) => c.id !== commentId);
    saveLocalComments(updated);

    window.dispatchEvent(
      new CustomEvent('garden-comments-updated', {
        detail: { targetId: target.targetId, targetType: target.targetType },
      })
    );

    this.persistCommentToCloud(target.targetId, target.targetType).catch(() => {});
    return true;
  },

  mergeCloudComments(targetId: string, targetType: 'memory' | 'song', cloudComments: GardenComment[]): void {
    if (!cloudComments || !Array.isArray(cloudComments) || cloudComments.length === 0) return;

    const all = loadLocalComments();
    const existingIds = new Set(all.map((c) => c.id));
    let hasNew = false;
    const merged = [...all];

    for (const c of cloudComments) {
      if (c && c.id && !existingIds.has(c.id)) {
        existingIds.add(c.id);
        merged.push({
          ...c,
          targetId: c.targetId || targetId,
          targetType: c.targetType || targetType,
        });
        hasNew = true;
      }
    }

    if (hasNew) {
      saveLocalComments(merged);
      window.dispatchEvent(
        new CustomEvent('garden-comments-updated', {
          detail: { targetId, targetType },
        })
      );
    }
  },

  async persistCommentToCloud(targetId: string, targetType: 'memory' | 'song'): Promise<void> {
    if (!isLiveSupabaseConfigured || !supabase) return;

    const commentsForTarget = this.getComments(targetId);

    if (targetType === 'memory') {
      const { data, error } = await supabase
        .from('garden_memories')
        .select('description')
        .eq('id', targetId)
        .maybeSingle();

      if (error || !data) return;

      let packed: any = {};
      const desc = data.description || '';
      if (desc.startsWith('{')) {
        try {
          packed = JSON.parse(desc);
        } catch {
          packed = { note: desc };
        }
      } else {
        packed = { note: desc };
      }

      packed.comments = commentsForTarget;

      await supabase
        .from('garden_memories')
        .update({ description: JSON.stringify(packed) })
        .eq('id', targetId);
    } else if (targetType === 'song') {
      const { data, error } = await supabase
        .from('songs')
        .select('message')
        .eq('id', targetId)
        .maybeSingle();

      if (error || !data) return;

      let packed: any = {};
      const msg = data.message || '';
      if (msg.startsWith('{')) {
        try {
          packed = JSON.parse(msg);
        } catch {
          packed = { note: msg };
        }
      } else {
        packed = { note: msg };
      }

      packed.comments = commentsForTarget;

      await supabase
        .from('songs')
        .update({ message: JSON.stringify(packed) })
        .eq('id', targetId);
    }
  },

  subscribe(callback: () => void): () => void {
    const handleUpdate = () => callback();
    window.addEventListener('garden-comments-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('garden-comments-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  },
};
