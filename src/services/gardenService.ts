import { supabase, isLiveSupabaseConfigured } from './supabaseClient';
import type {
  UserProfile,
  NoteEntry,
  SongEntry,
  ShelfEntry,
  MemoryEntry,
  PetalNoteEntry,
  HangoutEntry,
  QuestionResponseEntry,
  TimeCapsuleEntry,
  MoodEntry,
  ShelfCategory,
  SongStatus,
  HangoutStatus,
} from '../types/garden';

// Default Profiles for Noella & Solomon
export const DEFAULT_PROFILES: Record<string, UserProfile> = {
  noella: {
    id: 'user-noella-uuid',
    username: 'noella',
    displayName: 'Noella ✨',
    avatarUrl: '/assets/memories/photo-sun-portrait.jpg',
  },
  solomon: {
    id: 'user-solomon-uuid',
    username: 'solomon',
    displayName: 'Solomon 🌿',
    avatarUrl: '/assets/memories/photo-desk-selfie.jpg',
  },
};

const STORAGE_KEYS = {
  CURRENT_USER: 'perfect_time_current_user',
  NOTES: 'perfect_time_notes',
  SONGS: 'perfect_time_songs',
  SHELF: 'perfect_time_shelf',
  MEMORIES: 'perfect_time_archive_memories',
  PETALS: 'perfect_time_petal_notes',
  HANGOUTS: 'perfect_time_hangouts',
  QUESTIONS: 'perfect_time_questions',
  CAPSULES: 'perfect_time_capsules',
  MOODS: 'perfect_time_moods',
};

// Safe LocalStorage helpers
function loadLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to local storage', err);
  }
}

// User state management
let activeUser: UserProfile = (() => {
  const saved = loadLocal<UserProfile | null>(STORAGE_KEYS.CURRENT_USER, null);
  return saved || DEFAULT_PROFILES.noella;
})();

const userListeners = new Set<(user: UserProfile) => void>();

export const authService = {
  getCurrentUser(): UserProfile {
    return activeUser;
  },

  setCurrentUser(user: UserProfile): void {
    activeUser = user;
    saveLocal(STORAGE_KEYS.CURRENT_USER, user);
    userListeners.forEach((fn) => fn(user));
  },

  switchUser(username: 'noella' | 'solomon'): void {
    const target = DEFAULT_PROFILES[username];
    if (target) {
      this.setCurrentUser(target);
    }
  },

  subscribeUser(listener: (user: UserProfile) => void): () => void {
    userListeners.add(listener);
    return () => userListeners.delete(listener);
  },

  getPartner(): UserProfile {
    return activeUser.username === 'noella' ? DEFAULT_PROFILES.solomon : DEFAULT_PROFILES.noella;
  },
};

// ==============================================================================
// Feature A: Letters in the Garden (Notes)
// ==============================================================================
export const notesService = {
  async getNotes(): Promise<NoteEntry[]> {
    const user = authService.getCurrentUser();

    if (isLiveSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase getNotes error, falling back to local', error);
      } else if (data) {
        return data.map((d: any) => ({
          id: d.id,
          authorId: d.author_id,
          recipientId: d.recipient_id,
          title: d.title || '',
          body: d.body,
          isShared: d.is_shared,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
          authorName: d.author_id === DEFAULT_PROFILES.noella.id ? 'Noella' : 'Solomon',
        }));
      }
    }

    // Local simulated RLS
    const all = loadLocal<NoteEntry[]>(STORAGE_KEYS.NOTES, []);
    return all.filter((note) => {
      // Author sees their own (private or shared)
      if (note.authorId === user.id) return true;
      // Recipient sees only if shared
      if (note.isShared && (!note.recipientId || note.recipientId === user.id)) return true;
      return false;
    });
  },

  async saveNote(note: { id?: string; title: string; body: string; isShared: boolean }): Promise<NoteEntry> {
    const user = authService.getCurrentUser();
    const partner = authService.getPartner();
    const now = new Date().toISOString();

    const noteEntry: NoteEntry = {
      id: note.id || `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      authorId: user.id,
      authorName: user.displayName,
      recipientId: partner.id,
      title: note.title.trim(),
      body: note.body.trim(),
      isShared: note.isShared,
      createdAt: now,
      updatedAt: now,
    };

    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('notes').upsert({
        id: note.id || undefined,
        author_id: user.id,
        recipient_id: partner.id,
        title: noteEntry.title,
        body: noteEntry.body,
        is_shared: noteEntry.isShared,
        updated_at: now,
      });
    }

    const all = loadLocal<NoteEntry[]>(STORAGE_KEYS.NOTES, []);
    const existingIndex = all.findIndex((n) => n.id === noteEntry.id);
    if (existingIndex >= 0) {
      if (all[existingIndex].authorId !== user.id) {
        throw new Error('Unauthorized: You cannot edit another person’s letter.');
      }
      noteEntry.createdAt = all[existingIndex].createdAt;
      all[existingIndex] = noteEntry;
    } else {
      all.unshift(noteEntry);
    }
    saveLocal(STORAGE_KEYS.NOTES, all);
    return noteEntry;
  },

  async deleteNote(id: string): Promise<void> {
    const user = authService.getCurrentUser();

    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('notes').delete().eq('id', id).eq('author_id', user.id);
    }

    const all = loadLocal<NoteEntry[]>(STORAGE_KEYS.NOTES, []);
    const target = all.find((n) => n.id === id);
    if (target && target.authorId !== user.id) {
      throw new Error('Unauthorized: You can only delete your own letters.');
    }
    saveLocal(STORAGE_KEYS.NOTES, all.filter((n) => n.id !== id));
  },
};

// ==============================================================================
// Feature B: The Sound Garden (Songs)
// ==============================================================================
export const soundGardenService = {
  async getSongs(): Promise<SongEntry[]> {
    if (isLiveSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          addedBy: d.added_by,
          addedByName: d.added_by === DEFAULT_PROFILES.noella.id ? 'Noella' : 'Solomon',
          title: d.title,
          artist: d.artist,
          musicUrl: d.music_url,
          message: d.message || '',
          status: d.status as SongStatus,
          createdAt: d.created_at,
        }));
      }
    }

    return loadLocal<SongEntry[]>(STORAGE_KEYS.SONGS, []);
  },

  async addSong(song: {
    title: string;
    artist: string;
    musicUrl: string;
    message?: string;
    status?: SongStatus;
  }): Promise<SongEntry> {
    const user = authService.getCurrentUser();
    const entry: SongEntry = {
      id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      addedBy: user.id,
      addedByName: user.displayName,
      title: song.title.trim(),
      artist: song.artist.trim(),
      musicUrl: song.musicUrl.trim(),
      message: song.message?.trim() || '',
      status: song.status || 'want_to_listen',
      createdAt: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('songs').insert({
        added_by: user.id,
        title: entry.title,
        artist: entry.artist,
        music_url: entry.musicUrl,
        message: entry.message,
        status: entry.status,
      });
    }

    const all = loadLocal<SongEntry[]>(STORAGE_KEYS.SONGS, []);
    all.unshift(entry);
    saveLocal(STORAGE_KEYS.SONGS, all);
    return entry;
  },

  async updateSongStatus(id: string, status: SongStatus): Promise<void> {
    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('songs').update({ status }).eq('id', id);
    }
    const all = loadLocal<SongEntry[]>(STORAGE_KEYS.SONGS, []);
    const updated = all.map((s) => (s.id === id ? { ...s, status } : s));
    saveLocal(STORAGE_KEYS.SONGS, updated);
  },

  async deleteSong(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('songs').delete().eq('id', id).eq('added_by', user.id);
    }
    const all = loadLocal<SongEntry[]>(STORAGE_KEYS.SONGS, []);
    const target = all.find((s) => s.id === id);
    if (target && target.addedBy !== user.id) {
      throw new Error('Unauthorized: You can only remove songs you recommended.');
    }
    saveLocal(STORAGE_KEYS.SONGS, all.filter((s) => s.id !== id));
  },
};

// ==============================================================================
// Feature C: The Exchange Shelf (Recommendations)
// ==============================================================================
export const shelfService = {
  async getItems(): Promise<ShelfEntry[]> {
    if (isLiveSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          contributorId: d.contributor_id,
          contributorName: d.contributor_id === DEFAULT_PROFILES.noella.id ? 'Noella' : 'Solomon',
          title: d.title,
          category: d.category as ShelfCategory,
          description: d.description || '',
          link: d.link || '',
          status: d.status,
          createdAt: d.created_at,
        }));
      }
    }
    return loadLocal<ShelfEntry[]>(STORAGE_KEYS.SHELF, []);
  },

  async addItem(item: {
    title: string;
    category: ShelfCategory;
    description?: string;
    link?: string;
  }): Promise<ShelfEntry> {
    const user = authService.getCurrentUser();
    const entry: ShelfEntry = {
      id: `shelf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      contributorId: user.id,
      contributorName: user.displayName,
      title: item.title.trim(),
      category: item.category,
      description: item.description?.trim(),
      link: item.link?.trim(),
      status: 'to_explore',
      createdAt: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('recommendations').insert({
        contributor_id: user.id,
        title: entry.title,
        category: entry.category,
        description: entry.description,
        link: entry.link,
        status: entry.status,
      });
    }

    const all = loadLocal<ShelfEntry[]>(STORAGE_KEYS.SHELF, []);
    all.unshift(entry);
    saveLocal(STORAGE_KEYS.SHELF, all);
    return entry;
  },

  async updateItemStatus(id: string, status: any): Promise<void> {
    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('recommendations').update({ status }).eq('id', id);
    }
    const all = loadLocal<ShelfEntry[]>(STORAGE_KEYS.SHELF, []);
    saveLocal(STORAGE_KEYS.SHELF, all.map((i) => (i.id === id ? { ...i, status } : i)));
  },

  async deleteItem(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('recommendations').delete().eq('id', id).eq('contributor_id', user.id);
    }
    const all = loadLocal<ShelfEntry[]>(STORAGE_KEYS.SHELF, []);
    const target = all.find((i) => i.id === id);
    if (target && target.contributorId !== user.id) {
      throw new Error('Unauthorized: You can only remove items you recommended.');
    }
    saveLocal(STORAGE_KEYS.SHELF, all.filter((i) => i.id !== id));
  },
};

// ==============================================================================
// Feature D: Our Little Archive (Memories)
// ==============================================================================
export const memoryArchiveService = {
  async getMemories(): Promise<MemoryEntry[]> {
    const user = authService.getCurrentUser();
    if (isLiveSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('garden_memories')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          contributorId: d.contributor_id,
          contributorName: d.contributor_id === DEFAULT_PROFILES.noella.id ? 'Noella' : 'Solomon',
          title: d.title,
          caption: d.caption,
          description: d.description,
          photoUrl: d.photo_url,
          dateTaken: d.date_taken,
          isShared: d.is_shared,
          createdAt: d.created_at,
        }));
      }
    }
    const all = loadLocal<MemoryEntry[]>(STORAGE_KEYS.MEMORIES, []);
    return all.filter((m) => m.contributorId === user.id || m.isShared);
  },

  async addMemory(memory: {
    title: string;
    caption?: string;
    description?: string;
    photoUrl: string;
    dateTaken?: string;
    isShared?: boolean;
  }): Promise<MemoryEntry> {
    const user = authService.getCurrentUser();
    const entry: MemoryEntry = {
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      contributorId: user.id,
      contributorName: user.displayName,
      title: memory.title.trim(),
      caption: memory.caption?.trim(),
      description: memory.description?.trim(),
      photoUrl: memory.photoUrl.trim(),
      dateTaken: memory.dateTaken?.trim() || 'Keepsake Date',
      isShared: memory.isShared !== undefined ? memory.isShared : true,
      createdAt: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('garden_memories').insert({
        contributor_id: user.id,
        title: entry.title,
        caption: entry.caption,
        description: entry.description,
        photo_url: entry.photoUrl,
        date_taken: entry.dateTaken,
        is_shared: entry.isShared,
      });
    }

    const all = loadLocal<MemoryEntry[]>(STORAGE_KEYS.MEMORIES, []);
    all.unshift(entry);
    saveLocal(STORAGE_KEYS.MEMORIES, all);
    return entry;
  },

  async deleteMemory(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('garden_memories').delete().eq('id', id).eq('contributor_id', user.id);
    }
    const all = loadLocal<MemoryEntry[]>(STORAGE_KEYS.MEMORIES, []);
    const target = all.find((m) => m.id === id);
    if (target && target.contributorId !== user.id) {
      throw new Error('Unauthorized: You can only delete memories you added.');
    }
    saveLocal(STORAGE_KEYS.MEMORIES, all.filter((m) => m.id !== id));
  },
};

// ==============================================================================
// Feature E: Petal Notes (Short Messages)
// ==============================================================================
export const petalNotesService = {
  async getPetals(): Promise<PetalNoteEntry[]> {
    const user = authService.getCurrentUser();
    if (isLiveSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('petal_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          authorId: d.author_id,
          authorName: d.author_id === DEFAULT_PROFILES.noella.id ? 'Noella' : 'Solomon',
          recipientId: d.recipient_id,
          body: d.body,
          color: d.color,
          emoji: d.emoji,
          isShared: d.is_shared,
          createdAt: d.created_at,
        }));
      }
    }
    const all = loadLocal<PetalNoteEntry[]>(STORAGE_KEYS.PETALS, []);
    return all.filter((p) => p.authorId === user.id || (p.isShared && (!p.recipientId || p.recipientId === user.id)));
  },

  async addPetal(petal: { body: string; color: string; emoji: string; isShared: boolean }): Promise<PetalNoteEntry> {
    const user = authService.getCurrentUser();
    const partner = authService.getPartner();
    const entry: PetalNoteEntry = {
      id: `petal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorId: user.id,
      authorName: user.displayName,
      recipientId: partner.id,
      body: petal.body.trim(),
      color: petal.color,
      emoji: petal.emoji,
      isShared: petal.isShared,
      createdAt: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('petal_notes').insert({
        author_id: user.id,
        recipient_id: partner.id,
        body: entry.body,
        color: entry.color,
        emoji: entry.emoji,
        is_shared: entry.isShared,
      });
    }

    const all = loadLocal<PetalNoteEntry[]>(STORAGE_KEYS.PETALS, []);
    all.unshift(entry);
    saveLocal(STORAGE_KEYS.PETALS, all);
    return entry;
  },

  async deletePetal(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('petal_notes').delete().eq('id', id).eq('author_id', user.id);
    }
    const all = loadLocal<PetalNoteEntry[]>(STORAGE_KEYS.PETALS, []);
    const target = all.find((p) => p.id === id);
    if (target && target.authorId !== user.id) {
      throw new Error('Unauthorized: You can only remove your own petal notes.');
    }
    saveLocal(STORAGE_KEYS.PETALS, all.filter((p) => p.id !== id));
  },
};

// ==============================================================================
// Feature F: Our Time (Hangout & Activity Planning)
// ==============================================================================
export const hangoutService = {
  async getHangouts(): Promise<HangoutEntry[]> {
    if (isLiveSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('hangout_suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          suggestedBy: d.suggested_by,
          suggestedByName: d.suggested_by === DEFAULT_PROFILES.noella.id ? 'Noella' : 'Solomon',
          title: d.title,
          description: d.description,
          proposedDate: d.proposed_date,
          status: d.status as HangoutStatus,
          createdAt: d.created_at,
        }));
      }
    }
    return loadLocal<HangoutEntry[]>(STORAGE_KEYS.HANGOUTS, []);
  },

  async addHangout(plan: { title: string; description?: string; proposedDate?: string }): Promise<HangoutEntry> {
    const user = authService.getCurrentUser();
    const entry: HangoutEntry = {
      id: `hang-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      suggestedBy: user.id,
      suggestedByName: user.displayName,
      title: plan.title.trim(),
      description: plan.description?.trim(),
      proposedDate: plan.proposedDate?.trim(),
      status: 'proposed',
      createdAt: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('hangout_suggestions').insert({
        suggested_by: user.id,
        title: entry.title,
        description: entry.description,
        proposed_date: entry.proposedDate,
        status: entry.status,
      });
    }

    const all = loadLocal<HangoutEntry[]>(STORAGE_KEYS.HANGOUTS, []);
    all.unshift(entry);
    saveLocal(STORAGE_KEYS.HANGOUTS, all);
    return entry;
  },

  async updateHangoutStatus(id: string, status: HangoutStatus): Promise<void> {
    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('hangout_suggestions').update({ status }).eq('id', id);
    }
    const all = loadLocal<HangoutEntry[]>(STORAGE_KEYS.HANGOUTS, []);
    saveLocal(STORAGE_KEYS.HANGOUTS, all.map((h) => (h.id === id ? { ...h, status } : h)));
  },

  async deleteHangout(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('hangout_suggestions').delete().eq('id', id).eq('suggested_by', user.id);
    }
    const all = loadLocal<HangoutEntry[]>(STORAGE_KEYS.HANGOUTS, []);
    const target = all.find((h) => h.id === id);
    if (target && target.suggestedBy !== user.id) {
      throw new Error('Unauthorized: You can only remove plans you suggested.');
    }
    saveLocal(STORAGE_KEYS.HANGOUTS, all.filter((h) => h.id !== id));
  },
};

// ==============================================================================
// Feature G: Little Questions (Conversation Prompts)
// ==============================================================================
export const CONVERSATION_PROMPTS: { id: string; question: string; category: string }[] = [
  { id: 'q-1', question: 'What is a song that instantly shifts your mood, no matter what?', category: 'Sound' },
  { id: 'q-2', question: 'What is your absolute favorite way to spend an unexpected free afternoon?', category: 'Vibe' },
  { id: 'q-3', question: 'If we took a spontaneous road trip right now, where is our first stop?', category: 'Adventure' },
  { id: 'q-4', question: 'What is a small, quiet moment recently that made you smile?', category: 'Reflection' },
  { id: 'q-5', question: 'What food craving are you never ready to turn down?', category: 'Treat' },
  { id: 'q-6', question: 'What is something you’re really looking forward to this season?', category: 'Looking Ahead' },
];

export const questionsService = {
  async getResponses(): Promise<QuestionResponseEntry[]> {
    const user = authService.getCurrentUser();
    if (isLiveSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('question_responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          questionId: d.question_id,
          userId: d.user_id,
          userName: d.user_id === DEFAULT_PROFILES.noella.id ? 'Noella' : 'Solomon',
          answer: d.answer,
          isShared: d.is_shared,
          createdAt: d.created_at,
        }));
      }
    }
    const all = loadLocal<QuestionResponseEntry[]>(STORAGE_KEYS.QUESTIONS, []);
    return all.filter((r) => r.userId === user.id || r.isShared);
  },

  async saveResponse(questionId: string, answer: string, isShared: boolean): Promise<QuestionResponseEntry> {
    const user = authService.getCurrentUser();
    const entry: QuestionResponseEntry = {
      id: `ans-${questionId}-${user.id}`,
      questionId,
      userId: user.id,
      userName: user.displayName,
      answer: answer.trim(),
      isShared,
      createdAt: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('question_responses').upsert({
        question_id: questionId,
        user_id: user.id,
        answer: entry.answer,
        is_shared: entry.isShared,
      });
    }

    const all = loadLocal<QuestionResponseEntry[]>(STORAGE_KEYS.QUESTIONS, []);
    const filtered = all.filter((r) => !(r.questionId === questionId && r.userId === user.id));
    filtered.unshift(entry);
    saveLocal(STORAGE_KEYS.QUESTIONS, filtered);
    return entry;
  },
};

// ==============================================================================
// Feature H: Time Capsule (Controlled Server Release Dates)
// ==============================================================================
export const timeCapsuleService = {
  async getCapsules(): Promise<TimeCapsuleEntry[]> {
    const user = authService.getCurrentUser();
    const now = new Date();

    if (isLiveSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('time_capsules')
        .select('*')
        .order('release_at', { ascending: true });

      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          authorId: d.author_id,
          authorName: d.author_id === DEFAULT_PROFILES.noella.id ? 'Noella' : 'Solomon',
          recipientId: d.recipient_id,
          title: d.title,
          body: d.body,
          releaseAt: d.release_at,
          isShared: d.is_shared,
          createdAt: d.created_at,
        }));
      }
    }

    // Local simulated RLS rule:
    // 1. Author sees all their capsules (including previewing the message).
    // 2. Intended recipient sees capsule ONLY IF isShared is true.
    // 3. If releaseAt > now and viewer is NOT the author, the body is completely locked/redacted!
    const all = loadLocal<TimeCapsuleEntry[]>(STORAGE_KEYS.CAPSULES, []);
    return all
      .filter((c) => {
        if (c.authorId === user.id) return true;
        if (c.isShared && (!c.recipientId || c.recipientId === user.id)) return true;
        return false;
      })
      .map((c) => {
        const isLocked = new Date(c.releaseAt) > now;
        if (c.authorId !== user.id && isLocked) {
          // STRICT SECURITY ENFORCEMENT: Redact body completely!
          return {
            ...c,
            body: '[LOCKED UNTIL RELEASE DATE]',
          };
        }
        return c;
      });
  },

  async createCapsule(capsule: {
    title: string;
    body: string;
    releaseAt: string;
    isShared: boolean;
  }): Promise<TimeCapsuleEntry> {
    const user = authService.getCurrentUser();
    const partner = authService.getPartner();
    const entry: TimeCapsuleEntry = {
      id: `cap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorId: user.id,
      authorName: user.displayName,
      recipientId: partner.id,
      title: capsule.title.trim(),
      body: capsule.body.trim(),
      releaseAt: capsule.releaseAt,
      isShared: capsule.isShared,
      createdAt: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('time_capsules').insert({
        author_id: user.id,
        recipient_id: partner.id,
        title: entry.title,
        body: entry.body,
        release_at: entry.releaseAt,
        is_shared: entry.isShared,
      });
    }

    const all = loadLocal<TimeCapsuleEntry[]>(STORAGE_KEYS.CAPSULES, []);
    all.unshift(entry);
    saveLocal(STORAGE_KEYS.CAPSULES, all);
    return entry;
  },

  async deleteCapsule(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('time_capsules').delete().eq('id', id).eq('author_id', user.id);
    }
    const all = loadLocal<TimeCapsuleEntry[]>(STORAGE_KEYS.CAPSULES, []);
    const target = all.find((c) => c.id === id);
    if (target && target.authorId !== user.id) {
      throw new Error('Unauthorized: You can only delete capsules you authored.');
    }
    saveLocal(STORAGE_KEYS.CAPSULES, all.filter((c) => c.id !== id));
  },
};

// ==============================================================================
// Feature I: Mood Garden (Optional Mood Check-ins)
// ==============================================================================
export const MOOD_OPTIONS = [
  { key: 'peaceful', label: 'Peaceful', emoji: '🌿' },
  { key: 'excited', label: 'Excited', emoji: '✨' },
  { key: 'happy', label: 'Happy', emoji: '🌷' },
  { key: 'tired', label: 'Tired', emoji: '🌙' },
  { key: 'listening', label: 'Looking for Music', emoji: '🎧' },
  { key: 'thoughtful', label: 'Thoughtful', emoji: '💭' },
];

export const moodGardenService = {
  async getMoods(): Promise<MoodEntry[]> {
    const user = authService.getCurrentUser();
    if (isLiveSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((d: any) => {
          const opt = MOOD_OPTIONS.find((m) => m.key === d.mood_key);
          return {
            id: d.id,
            userId: d.user_id,
            userName: d.user_id === DEFAULT_PROFILES.noella.id ? 'Noella' : 'Solomon',
            moodKey: d.mood_key,
            moodLabel: d.mood_label,
            emoji: opt ? opt.emoji : '✨',
            note: d.note,
            isShared: d.is_shared,
            createdAt: d.created_at,
          };
        });
      }
    }
    const all = loadLocal<MoodEntry[]>(STORAGE_KEYS.MOODS, []);
    return all.filter((m) => m.userId === user.id || m.isShared);
  },

  async setMood(moodKey: string, note?: string, isShared: boolean = false): Promise<MoodEntry> {
    const user = authService.getCurrentUser();
    const opt = MOOD_OPTIONS.find((m) => m.key === moodKey) || MOOD_OPTIONS[0];

    const entry: MoodEntry = {
      id: `mood-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: user.id,
      userName: user.displayName,
      moodKey,
      moodLabel: opt.label,
      emoji: opt.emoji,
      note: note?.trim(),
      isShared,
      createdAt: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('mood_entries').insert({
        user_id: user.id,
        mood_key: entry.moodKey,
        mood_label: entry.moodLabel,
        note: entry.note,
        is_shared: entry.isShared,
      });
    }

    const all = loadLocal<MoodEntry[]>(STORAGE_KEYS.MOODS, []);
    all.unshift(entry);
    saveLocal(STORAGE_KEYS.MOODS, all);
    return entry;
  },
};
