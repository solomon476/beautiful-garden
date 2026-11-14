import { supabase, isLiveSupabaseConfigured } from './supabaseClient';
import { notificationService } from './notificationService';
import { authService, AUTHORIZED_PROFILES } from './authService';
import { mediaStorage } from '../utils/mediaStorage';
import { isSpotifyUrl, getCleanSpotifyUrl, fetchSpotifyOEmbed } from '../utils/spotify';
export { authService };
export const DEFAULT_PROFILES = AUTHORIZED_PROFILES;
export type { UserProfile } from '../types/garden';
import type {
  NoteEntry,
  SongEntry,
  ShelfEntry,
  MemoryEntry,
  DeletedMemoryItem,
  PetalNoteEntry,
  HangoutEntry,
  QuestionResponseEntry,
  TimeCapsuleEntry,
  MoodEntry,
  ShelfCategory,
  SongStatus,
  HangoutStatus,
  WorldCause,
  WorldArticle,
  WorldPrompt,
  WorldPromptResponse,
  WorldSmallAction,
} from '../types/garden';

// Default Profiles for Noella & Solomon (re-exported from authService)
// DEFAULT_PROFILES is aliased to AUTHORIZED_PROFILES above

export const DEFAULT_INITIAL_SONGS: SongEntry[] = [
  {
    id: 'seed-song-1',
    addedBy: DEFAULT_PROFILES.solomon.id,
    addedByName: DEFAULT_PROFILES.solomon.displayName,
    title: 'Flying',
    artist: 'Tom Odell',
    musicUrl: 'https://open.spotify.com/track/6UelLqGlWMcVH1E5c4H7gY',
    audioUrl: '/assets/tom_odell_flying_vocal.mp3',
    message: 'The song that reminds me of our long talks...',
    status: 'listened',
    createdAt: '2026-11-01T12:00:00.000Z',
    coverUrl: '/assets/garden/cover_flying.jpg',
    reaction: 'Love it!',
  },
  {
    id: 'seed-song-2',
    addedBy: DEFAULT_PROFILES.noella.id,
    addedByName: DEFAULT_PROFILES.noella.displayName,
    title: 'Golden Hour (Piano)',
    artist: 'JVKE',
    musicUrl: 'https://open.spotify.com/track/5odlY52u43F5BjByFp9vMw',
    audioUrl: '/assets/music.mp3',
    message: 'Perfect for sunsets and you...',
    status: 'want_to_listen',
    createdAt: '2026-11-02T10:30:00.000Z',
    coverUrl: '/assets/garden/cover_golden_hour.jpg',
    reaction: 'My Vibe',
  },
];

export const DEFAULT_INITIAL_SHELF: ShelfEntry[] = [
  {
    id: 'seed-shelf-1',
    contributorId: DEFAULT_PROFILES.solomon.id,
    contributorName: DEFAULT_PROFILES.solomon.displayName,
    category: 'films',
    title: 'About Time (2013)',
    description: 'A reminder that ordinary, gentle moments shared together are the most precious.',
    link: 'https://www.imdb.com/title/tt2194499/',
    status: 'loved',
    createdAt: '2026-11-01T14:00:00.000Z',
  },
  {
    id: 'seed-shelf-2',
    contributorId: DEFAULT_PROFILES.noella.id,
    contributorName: DEFAULT_PROFILES.noella.displayName,
    category: 'food',
    title: 'Matcha Strawberry Boba & Macarons',
    description: 'We have to try that new French bakery downtown this Saturday afternoon 🍰',
    link: '',
    status: 'to_explore',
    createdAt: '2026-11-02T11:15:00.000Z',
  },
];

export const DEFAULT_INITIAL_MEMORIES: MemoryEntry[] = [];

export const DEFAULT_INITIAL_PETALS: PetalNoteEntry[] = [
  {
    id: 'seed-petal-1',
    authorId: DEFAULT_PROFILES.solomon.id,
    authorName: DEFAULT_PROFILES.solomon.displayName,
    body: 'Your laugh brightens up even the longest day. Never forget how loved you are 🌸',
    color: '#f472b6',
    emoji: '🌸',
    isShared: true,
    createdAt: '2026-11-02T09:00:00.000Z',
  },
  {
    id: 'seed-petal-2',
    authorId: DEFAULT_PROFILES.noella.id,
    authorName: DEFAULT_PROFILES.noella.displayName,
    body: 'Thank you for always listening and for being my favorite person to talk to ✨',
    color: '#a855f7',
    emoji: '🌷',
    isShared: true,
    createdAt: '2026-11-02T10:00:00.000Z',
  },
];

export const DEFAULT_INITIAL_HANGOUTS: HangoutEntry[] = [
  {
    id: 'seed-plan-1',
    suggestedBy: DEFAULT_PROFILES.solomon.id,
    suggestedByName: DEFAULT_PROFILES.solomon.displayName,
    title: 'Sunset Picnic & Gelato Run 🍦',
    description: 'Blanket on the grass, favorite snacks, music, and catching the golden sunset.',
    proposedDate: 'This Saturday @ 5:30 PM',
    status: 'interested',
    createdAt: '2026-11-02T11:00:00.000Z',
  },
];

export const DEFAULT_INITIAL_CAPSULES: TimeCapsuleEntry[] = [
  {
    id: 'seed-cap-1',
    authorId: DEFAULT_PROFILES.solomon.id,
    authorName: DEFAULT_PROFILES.solomon.displayName,
    title: 'Open on Your Next Birthday 🎂',
    body: 'Happy birthday Noella! I wrote this months ago hoping we would be celebrating today even happier, closer, and more in love than before. You mean the world to me.',
    releaseAt: '2027-11-02T00:00:00.000Z',
    isShared: true,
    createdAt: '2026-11-02T12:00:00.000Z',
  },
];

export const DEFAULT_INITIAL_WORLD_CAUSES: WorldCause[] = [
  {
    id: 'seed-cause-1',
    title: "Men's Mental Health & Emotional Wellbeing",
    category: 'Mental Wellbeing',
    description: 'Creating space for emotional honesty, breaking the silence around vulnerability, and ensuring men have safe, judgement-free support.',
    whyItMatters: 'Men often feel conditioned to carry burdens silently. Giving voice to internal struggles saves lives and nurtures deeper empathy.',
    resourceLink: 'https://us.movember.com/mens-health/mental-health',
    resourceName: 'Movember & Mental Health Foundation',
    addedBy: DEFAULT_PROFILES.solomon.id,
    addedByName: DEFAULT_PROFILES.solomon.displayName,
    createdAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'seed-cause-2',
    title: 'Epilepsy & Invisible Neurological Health',
    category: 'Health & Awareness',
    description: 'Raising understanding of seizure disorders, first-aid response, and dismantling the stigma that surrounds unseen physical and neurological conditions.',
    whyItMatters: 'Millions navigate life with neurological conditions that are invisible on good days but isolating on tough ones. Compassionate awareness dispels fear.',
    resourceLink: 'https://www.epilepsy.org.uk/',
    resourceName: 'Epilepsy Society & Global Awareness',
    addedBy: DEFAULT_PROFILES.noella.id,
    addedByName: DEFAULT_PROFILES.noella.displayName,
    createdAt: '2026-11-01T11:00:00.000Z',
  },
  {
    id: 'seed-cause-3',
    title: 'Everyday Gender Equality & Human Dignity',
    category: 'Equality & Dignity',
    description: "Advocating for mutual respect, equal access, honoring each person's agency, and celebrating diverse strengths in daily conversations.",
    whyItMatters: "Equality isn't just about legislation—it lives in how we listen, honor each other's opinions, and share credit.",
    resourceLink: 'https://www.unwomen.org/',
    resourceName: 'UN Women & Human Rights Watch',
    addedBy: DEFAULT_PROFILES.noella.id,
    addedByName: DEFAULT_PROFILES.noella.displayName,
    createdAt: '2026-11-02T09:00:00.000Z',
  },
  {
    id: 'seed-cause-4',
    title: 'Everyday Kindness & Gentle Community Care',
    category: 'Kindness & Society',
    description: 'Reminding society to value human pacing over endless burnout, and encouraging people to check on one another without strings attached.',
    whyItMatters: 'In a hurried world, intentional care, active listening, and softness are forms of quiet courage.',
    resourceLink: 'https://www.mind.org.uk/',
    resourceName: 'Mind UK & Rest as Resistance',
    addedBy: DEFAULT_PROFILES.solomon.id,
    addedByName: DEFAULT_PROFILES.solomon.displayName,
    createdAt: '2026-11-02T10:00:00.000Z',
  },
];

export const DEFAULT_INITIAL_WORLD_ARTICLES: WorldArticle[] = [
  {
    id: 'seed-article-1',
    title: 'How Successful People Use Journaling to Process Inner Truths (2026)',
    source: 'Journaling & Reflection',
    link: 'https://images.openai.com/static-rsc-4/_JBwtqcwOefXi77Hie5R9MyqvC2B_glrp8qT_TtP-nYTpJqe_-4hY_RLl360V_hlmj8muupnCgDOimxkaeWNq2lqWUoqSFafCCQsmIzcalB1RaIXWLBNhzCRRGzj-EipAfmbuW_N3-nDixohqC44WScBjxxW_kxK0YbaxLHSEw4?purpose=inline',
    type: 'article',
    whyItMatters: 'Writing down our thoughts and worries privately gives clarity when the outside world feels chaotic or noisy.',
    addedBy: DEFAULT_PROFILES.solomon.id,
    addedByName: DEFAULT_PROFILES.solomon.displayName,
    createdAt: '2026-11-01T14:30:00.000Z',
    isShared: true,
  },
  {
    id: 'seed-article-2',
    title: 'Epilepsy Awareness Campaign: Illuminating the Unseen',
    source: 'Behance / Visual Storytelling',
    link: 'https://images.openai.com/static-rsc-4/9G8vfgKSdug1INxvGxMH6UDh9gLkmtybHF97YIji7-zspp6nnPmjQcYwOVQa4rmOgl-W8UaVv73PApN6r8KWK_CTZeV8rodZA0euO0YBkuLZ8Xn3h8acxGT2reSp-rY_r3yC05baRGR3vQH6Qhy5rUps4nWnbpmFCegeG6zJdUc?purpose=inline',
    type: 'post',
    whyItMatters: 'A powerful awareness campaign that proves thoughtful visual design can de-stigmatize invisible medical conditions.',
    addedBy: DEFAULT_PROFILES.noella.id,
    addedByName: DEFAULT_PROFILES.noella.displayName,
    createdAt: '2026-11-02T09:15:00.000Z',
    isShared: true,
  },
  {
    id: 'seed-article-3',
    title: 'The Courage to Be Vulnerable in Modern Life',
    source: 'TED / Deep Conversation',
    link: 'https://www.ted.com/talks',
    type: 'video',
    whyItMatters: 'A reminder that emotional honesty and asking for help are the truest measures of inner strength.',
    addedBy: DEFAULT_PROFILES.solomon.id,
    addedByName: DEFAULT_PROFILES.solomon.displayName,
    createdAt: '2026-11-02T11:00:00.000Z',
    isShared: true,
  },
];

export const DEFAULT_INITIAL_WORLD_PROMPTS: WorldPrompt[] = [
  {
    id: 'prompt-1',
    promptText: "What do you think people misunderstand the most about men's mental health?",
    category: "Men's Mental Health",
    contextNote: 'A gentle space to reflect on silent burdens, stoicism, and expectations.',
    responses: [
      {
        id: 'resp-seed-1',
        authorId: DEFAULT_PROFILES.solomon.id,
        authorName: DEFAULT_PROFILES.solomon.displayName,
        reflection: "People often assume that if a man isn't visibly distressed or breaking down, everything must be fine. But silence is often where the heaviest weight is carried alone.",
        createdAt: '2026-11-02T13:00:00.000Z',
      },
      {
        id: 'resp-seed-2',
        authorId: DEFAULT_PROFILES.noella.id,
        authorName: DEFAULT_PROFILES.noella.displayName,
        reflection: "I think creating an everyday environment where nobody feels mocked or judged for resting, crying, or saying 'I am struggling today' is what truly builds safety.",
        createdAt: '2026-11-02T14:20:00.000Z',
      },
    ],
  },
  {
    id: 'prompt-2',
    promptText: 'What is an invisible challenge or issue you wish more people approached with patient curiosity instead of judgement?',
    category: 'Empathy & Understanding',
    contextNote: 'Invisible illnesses, sensory overload, neurodiversity, or quiet grief.',
    responses: [],
  },
  {
    id: 'prompt-3',
    promptText: 'How can we cultivate the habit of listening to understand, rather than listening to immediately give advice?',
    category: 'Everyday Presence',
    contextNote: 'Being a safe haven for others without rushing them toward a fix.',
    responses: [],
  },
];

export const DEFAULT_INITIAL_WORLD_ACTIONS: WorldSmallAction[] = [
  {
    id: 'act-1',
    title: 'Listen without jumping to offer a quick solution',
    description: 'When someone opens up, pause and hold space before offering advice. Often, knowing you are heard is the entire remedy.',
    category: 'listening',
    suggestedBy: DEFAULT_PROFILES.noella.id,
    suggestedByName: DEFAULT_PROFILES.noella.displayName,
    heartsCount: 7,
    hasHeartedByMe: true,
    createdAt: '2026-11-01T12:00:00.000Z',
  },
  {
    id: 'act-2',
    title: 'Check in on someone with zero hidden agenda',
    description: 'Send a genuine message without expecting anything back: "Just thinking of you today, no need to reply, hope your heart feels light."',
    category: 'care',
    suggestedBy: DEFAULT_PROFILES.solomon.id,
    suggestedByName: DEFAULT_PROFILES.solomon.displayName,
    heartsCount: 9,
    hasHeartedByMe: true,
    createdAt: '2026-11-01T15:00:00.000Z',
  },
  {
    id: 'act-3',
    title: 'Gently challenge a harmful stereotype in casual conversation',
    description: 'Speak up with kindness when someone makes a dismissive comment about emotional vulnerability or invisible illness.',
    category: 'perspective',
    suggestedBy: DEFAULT_PROFILES.noella.id,
    suggestedByName: DEFAULT_PROFILES.noella.displayName,
    heartsCount: 5,
    hasHeartedByMe: false,
    createdAt: '2026-11-02T10:00:00.000Z',
  },
  {
    id: 'act-4',
    title: 'Share a trustworthy helpline or resource quietly',
    description: 'Keep verified helplines and wellness contacts saved, and share them without stigma when a friend is having a difficult time.',
    category: 'learning',
    suggestedBy: DEFAULT_PROFILES.solomon.id,
    suggestedByName: DEFAULT_PROFILES.solomon.displayName,
    heartsCount: 6,
    hasHeartedByMe: false,
    createdAt: '2026-11-02T11:30:00.000Z',
  },
];

const STORAGE_KEYS = {
  CURRENT_USER: 'perfect_time_current_user',
  NOTES: 'perfect_time_notes',
  SONGS: 'perfect_time_songs',
  SHELF: 'perfect_time_shelf',
  MEMORIES: 'perfect_time_archive_memories',
  DELETED_MEMORIES: 'perfect_time_deleted_memories_v1',
  DELETED_MEMORY_IDS: 'perfect_time_deleted_memory_ids_v1',
  PETALS: 'perfect_time_petal_notes',
  HANGOUTS: 'perfect_time_hangouts',
  QUESTIONS: 'perfect_time_questions',
  CAPSULES: 'perfect_time_capsules',
  MOODS: 'perfect_time_moods',
  WORLD_CAUSES: 'perfect_time_world_causes',
  WORLD_ARTICLES: 'perfect_time_world_articles',
  WORLD_PROMPTS: 'perfect_time_world_prompts',
  WORLD_ACTIONS: 'perfect_time_world_actions',
};

// Safe storage helpers with memory fallback for universal SSR / testing environments
const memoryFallbackStore = new Map<string, string>();

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = typeof window !== 'undefined' && window.localStorage
      ? localStorage.getItem(key)
      : memoryFallbackStore.get(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(fallback) && fallback.length > 0) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function saveLocal<T>(key: string, data: T): void {
  try {
    const serialized = JSON.stringify(data);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, serialized);
    }
    memoryFallbackStore.set(key, serialized);
  } catch (err) {
    console.error('Failed to save to local storage', err);
  }
}

// ==============================================================================
// Automatic Local-to-Cloud Sync Migration
// Ensures any posts, letters, moods or photos saved while offline/in-localStorage
// are seamlessly uploaded to Supabase as soon as cloud credentials are active.
// ==============================================================================
let hasSyncedDrafts = false;

export async function syncLocalDraftsToCloud(): Promise<void> {
  if (hasSyncedDrafts || !isLiveSupabaseConfigured || !supabase) return;
  const user = authService.getCurrentUser();
  if (!user || !user.id) return;

  try {
    hasSyncedDrafts = true;

    // 1. Sync any local notes (Letters)
    const localNotes = loadLocal<NoteEntry[]>(STORAGE_KEYS.NOTES, []);
    for (const note of localNotes) {
      if (note.authorId === user.id && !note.id.startsWith('seed-')) {
        await supabase.from('notes').upsert({
          id: note.id,
          author_id: note.authorId,
          recipient_id: note.recipientId,
          title: note.title,
          body: note.body,
          is_shared: note.isShared,
          created_at: note.createdAt,
          updated_at: note.updatedAt,
        });
      }
    }

    // 2. Sync any local petal notes
    const localPetals = loadLocal<PetalNoteEntry[]>(STORAGE_KEYS.PETALS, []);
    for (const petal of localPetals) {
      if (petal.authorId === user.id && !petal.id.startsWith('seed-')) {
        await supabase.from('petal_notes').upsert({
          id: petal.id,
          author_id: petal.authorId,
          recipient_id: petal.recipientId,
          body: petal.body,
          color: petal.color,
          emoji: petal.emoji,
          is_shared: petal.isShared,
          created_at: petal.createdAt,
        });
      }
    }

    // 3. Sync any local mood check-ins
    const localMoods = loadLocal<MoodEntry[]>(STORAGE_KEYS.MOODS, []);
    for (const m of localMoods) {
      if (m.userId === user.id && !m.id.startsWith('seed-')) {
        await supabase.from('mood_entries').upsert({
          id: m.id,
          user_id: m.userId,
          mood_key: m.moodKey,
          mood_label: m.moodLabel,
          note: m.note,
          is_shared: m.isShared,
          created_at: m.createdAt,
        });
      }
    }

    // 4. Sync any local archive memories (Photos)
    const localMemories = loadLocal<MemoryEntry[]>(STORAGE_KEYS.MEMORIES, []);
    for (const mem of localMemories) {
      if (mem.contributorId === user.id && !mem.id.startsWith('seed-')) {
        await supabase.from('garden_memories').upsert({
          id: mem.id,
          contributor_id: mem.contributorId,
          title: mem.title,
          caption: mem.caption,
          description: mem.description,
          photo_url: mem.photoUrl,
          date_taken: mem.dateTaken,
          is_shared: mem.isShared,
          created_at: mem.createdAt,
        });
      }
    }

    // 5. Sync any local recommendations (Books, Films, etc.)
    const localShelf = loadLocal<ShelfEntry[]>(STORAGE_KEYS.SHELF, []);
    for (const item of localShelf) {
      if (item.contributorId === user.id && !item.id.startsWith('seed-')) {
        await supabase.from('recommendations').upsert({
          id: item.id,
          contributor_id: item.contributorId,
          title: item.title,
          category: item.category,
          description: item.description,
          link: item.link,
          status: item.status,
          is_shared: true,
          created_at: item.createdAt,
        });
      }
    }

    // 6. Sync any local songs
    const localSongs = loadLocal<SongEntry[]>(STORAGE_KEYS.SONGS, []);
    for (const song of localSongs) {
      if (song.addedBy === user.id && !song.id.startsWith('seed-')) {
        await supabase.from('songs').upsert({
          id: song.id,
          added_by: song.addedBy,
          title: song.title,
          artist: song.artist,
          music_url: song.musicUrl,
          message: song.message,
          status: song.status,
          created_at: song.createdAt,
        });
      }
    }

    // 7. Sync any local hangouts (Dates)
    const localHangouts = loadLocal<HangoutEntry[]>(STORAGE_KEYS.HANGOUTS, []);
    for (const h of localHangouts) {
      if (h.suggestedBy === user.id && !h.id.startsWith('seed-')) {
        await supabase.from('hangout_suggestions').upsert({
          id: h.id,
          suggested_by: h.suggestedBy,
          title: h.title,
          idea: h.description || h.title || 'Hangout plan',
          location: h.location || null,
          date: h.proposedDate || null,
          status: h.status,
          is_shared: true,
        });
      }
    }
  } catch (err) {
    console.warn('Syncing local drafts to cloud error:', err);
    hasSyncedDrafts = false;
  }
}

// User state management is now securely handled by AuthService (imported above)
// with separate sessions, salted password hashing, and zero instant identity switching.

// ==============================================================================
// Feature A: Letters in the Garden (Notes)
// ==============================================================================
export const notesService = {
  async getNotes(): Promise<NoteEntry[]> {
    const user = authService.getCurrentUser();
    const isAuthed = authService.isAuthenticated();

    if (isLiveSupabaseConfigured && supabase) {
      syncLocalDraftsToCloud().catch((err) => console.warn('Background sync error:', err));
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase getNotes error, falling back to local', error);
      } else if (data) {
        const mapped: NoteEntry[] = data.map((d: any) => ({
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
        return mapped.filter((note) => {
          if (!isAuthed) return note.isShared;
          if (note.authorId === user.id) return true;
          return note.isShared && (!note.recipientId || note.recipientId === user.id);
        });
      }
    }

    // Local simulated RLS
    const all = loadLocal<NoteEntry[]>(STORAGE_KEYS.NOTES, []);
    return all.filter((note) => {
      if (!isAuthed) {
        return note.isShared;
      }
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
        id: noteEntry.id,
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

    if (noteEntry.isShared) {
      notificationService.sendNotification({
        type: 'letter',
        title: '💌 Letter in the Garden',
        message: `${user.displayName} wrote: "${noteEntry.title || 'A gentle letter for you'}"`,
        targetTab: 'letters',
        senderId: user.id,
        senderName: user.displayName,
        recipientId: partner.id,
        isPrivate: false,
        entityId: noteEntry.id,
      });
    }

    return noteEntry;
  },

  async toggleNotePrivacy(id: string, isShared: boolean): Promise<NoteEntry> {
    const user = authService.getCurrentUser();
    const all = loadLocal<NoteEntry[]>(STORAGE_KEYS.NOTES, []);
    const existing = all.find((n) => n.id === id);
    if (!existing) throw new Error('Note not found');
    if (existing.authorId !== user.id) throw new Error('Unauthorized');
    return this.saveNote({
      id: existing.id,
      title: existing.title,
      body: existing.body,
      isShared,
    });
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
        return data.map((d: any) => {
          const rawUrl = d.music_url || '';
          const isAudioData =
            rawUrl.startsWith('data:audio') ||
            rawUrl.startsWith('blob:') ||
            rawUrl.endsWith('.mp3') ||
            rawUrl.endsWith('.m4a') ||
            rawUrl.endsWith('.webm') ||
            rawUrl.endsWith('.wav') ||
            rawUrl.endsWith('.ogg');

          const isVoice =
            d.is_voice_note ??
            (d.title?.toLowerCase().includes('voice note') ||
              d.title?.toLowerCase().includes('voice memo') ||
              (isAudioData && !rawUrl.startsWith('http')));

          return {
            id: d.id,
            addedBy: d.added_by,
            addedByName: d.added_by === DEFAULT_PROFILES.noella.id ? 'Noella' : 'Solomon',
            title: d.title,
            artist: d.artist,
            musicUrl: isAudioData ? undefined : (rawUrl || undefined),
            audioUrl: isAudioData ? rawUrl : (d.audio_url || undefined),
            isVoiceNote: isVoice,
            message: d.message || '',
            status: d.status as SongStatus,
            createdAt: d.created_at,
            coverUrl:
              d.cover_url ||
              (d.title?.toLowerCase().includes('flying')
                ? '/assets/garden/cover_flying.jpg'
                : d.title?.toLowerCase().includes('golden hour')
                ? '/assets/garden/cover_golden_hour.jpg'
                : undefined),
            reaction:
              d.reaction ||
              (d.title?.toLowerCase().includes('flying') ? 'Love it!' : 'My Vibe'),
          };
        });
      }
    }

    const local = loadLocal<SongEntry[]>(STORAGE_KEYS.SONGS, DEFAULT_INITIAL_SONGS);
    return local.map((s) => {
      if (s.title.toLowerCase().includes('flying') && !s.coverUrl) {
        return { ...s, coverUrl: '/assets/garden/cover_flying.jpg', reaction: s.reaction || 'Love it!' };
      }
      if (s.title.toLowerCase().includes('golden hour') && !s.coverUrl) {
        return { ...s, coverUrl: '/assets/garden/cover_golden_hour.jpg', reaction: s.reaction || 'My Vibe' };
      }
      return s;
    });
  },

  async addSong(song: {
    title: string;
    artist: string;
    musicUrl?: string;
    audioUrl?: string;
    audioFileName?: string;
    isVoiceNote?: boolean;
    voiceNoteDuration?: number;
    message?: string;
    status?: SongStatus;
    coverUrl?: string;
    reaction?: string;
  }): Promise<SongEntry> {
    const user = authService.getCurrentUser();
    const partner = authService.getPartner();

    let cleanMusicUrl = song.musicUrl?.trim() || '';
    let coverUrl = song.coverUrl;

    if (isSpotifyUrl(cleanMusicUrl)) {
      cleanMusicUrl = getCleanSpotifyUrl(cleanMusicUrl);
      if (!coverUrl) {
        try {
          const meta = await fetchSpotifyOEmbed(cleanMusicUrl);
          if (meta?.thumbnailUrl) {
            coverUrl = meta.thumbnailUrl;
          }
        } catch (e) {
          console.warn('Could not fetch Spotify oEmbed thumbnail:', e);
        }
      }
    }

    const entry: SongEntry = {
      id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      addedBy: user.id,
      addedByName: user.displayName,
      title: song.title.trim(),
      artist: song.artist.trim(),
      musicUrl: cleanMusicUrl,
      audioUrl: song.audioUrl,
      audioFileName: song.audioFileName,
      isVoiceNote: song.isVoiceNote,
      voiceNoteDuration: song.voiceNoteDuration,
      message: song.message?.trim() || '',
      status: song.status || 'want_to_listen',
      coverUrl,
      reaction: song.reaction,
      createdAt: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('songs').insert({
        id: entry.id,
        added_by: user.id,
        title: entry.title,
        artist: entry.artist,
        music_url: song.audioUrl || cleanMusicUrl || '',
        message: entry.message,
        status: entry.status,
        cover_url: entry.coverUrl || null,
        reaction: entry.reaction || null,
      });
    }

    const all = loadLocal<SongEntry[]>(STORAGE_KEYS.SONGS, DEFAULT_INITIAL_SONGS);
    all.unshift(entry);
    saveLocal(STORAGE_KEYS.SONGS, all);

    notificationService.sendNotification({
      type: 'song',
      title: entry.isVoiceNote ? '🎙️ New Voice Note in Sound Garden' : '🎵 New Song in Sound Garden',
      message: `${user.displayName} shared "${entry.title} - ${entry.artist}"`,
      targetTab: 'sound',
      senderId: user.id,
      senderName: user.displayName,
      recipientId: partner.id,
      isPrivate: false,
      entityId: entry.id,
    });

    return entry;
  },

  async updateSongStatus(id: string, status: SongStatus): Promise<void> {
    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('songs').update({ status }).eq('id', id);
    }
    const all = loadLocal<SongEntry[]>(STORAGE_KEYS.SONGS, DEFAULT_INITIAL_SONGS);
    const updated = all.map((s) => (s.id === id ? { ...s, status } : s));
    saveLocal(STORAGE_KEYS.SONGS, updated);
  },

  async updateSongReaction(id: string, reaction: string): Promise<void> {
    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('songs').update({ reaction }).eq('id', id);
    }
    const all = loadLocal<SongEntry[]>(STORAGE_KEYS.SONGS, DEFAULT_INITIAL_SONGS);
    const updated = all.map((s) => (s.id === id ? { ...s, reaction } : s));
    saveLocal(STORAGE_KEYS.SONGS, updated);
  },

  async deleteSong(id: string): Promise<void> {
    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('songs').delete().eq('id', id);
    }
    const all = loadLocal<SongEntry[]>(STORAGE_KEYS.SONGS, DEFAULT_INITIAL_SONGS);
    saveLocal(STORAGE_KEYS.SONGS, all.filter((s) => s.id !== id));
  },
};

// ==============================================================================
// Feature C: The Exchange Shelf (Recommendations)
// ==============================================================================
export const shelfService = {
  async getItems(): Promise<ShelfEntry[]> {
    const local = loadLocal<ShelfEntry[]>(STORAGE_KEYS.SHELF, DEFAULT_INITIAL_SHELF);
    if (isLiveSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const cloudEntries: ShelfEntry[] = data.map((d: any) => ({
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
        const cloudIds = new Set(cloudEntries.map((c) => c.id));
        const localOnly = local.filter((l) => !cloudIds.has(l.id));
        return [...cloudEntries, ...localOnly];
      }
    }
    return local;
  },

  async addItem(item: {
    title: string;
    category: ShelfCategory;
    description?: string;
    link?: string;
    pdfUrl?: string;
    pdfFileName?: string;
    pdfFileSize?: number;
    photoUrl?: string;
    voiceNoteUrl?: string;
  }): Promise<ShelfEntry> {
    const user = authService.getCurrentUser();
    const partner = authService.getPartner();
    const entry: ShelfEntry = {
      id: `shelf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      contributorId: user.id,
      contributorName: user.displayName,
      title: item.title.trim(),
      category: item.category,
      description: item.description?.trim(),
      link: item.link?.trim(),
      pdfUrl: item.pdfUrl,
      pdfFileName: item.pdfFileName,
      pdfFileSize: item.pdfFileSize,
      photoUrl: item.photoUrl,
      voiceNoteUrl: item.voiceNoteUrl,
      status: 'to_explore',
      createdAt: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('recommendations').insert({
        id: entry.id,
        contributor_id: user.id,
        title: entry.title,
        category: entry.category,
        description: entry.description,
        link: entry.link,
        status: entry.status,
        is_shared: true,
      });
    }

    const all = loadLocal<ShelfEntry[]>(STORAGE_KEYS.SHELF, []);
    all.unshift(entry);
    saveLocal(STORAGE_KEYS.SHELF, all);

    notificationService.sendNotification({
      type: 'shelf',
      title: item.pdfUrl ? '📄 New Book PDF on Exchange Shelf' : '📚 New Recommendation on Shelf',
      message: `${user.displayName} shared "${entry.title}" (${entry.category})`,
      targetTab: 'shelf',
      senderId: user.id,
      senderName: user.displayName,
      recipientId: partner.id,
      isPrivate: false,
      entityId: entry.id,
    });

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
export const PERMANENTLY_EXCLUDED_MEMORY_IDS = new Set<string>([
  'mem-1',
  'mem-6',
  'mem-solomon-del-test',
  'mem-solomon-real-1',
  'mem-1794412387784-01sm',
  'mem-1794412389282-703c',
]);

export const isExcludedMemory = (m?: { id?: string; title?: string; photoUrl?: string }): boolean => {
  if (!m) return true;
  if (m.id && PERMANENTLY_EXCLUDED_MEMORY_IDS.has(m.id)) return true;
  if (m.title && m.title.trim().toLowerCase().includes('signature noella energy')) return true;
  if (m.photoUrl && (m.photoUrl.includes('photo-balcony.jpg') || m.photoUrl.includes('photo-balcony-peace.jpg'))) return true;
  return false;
};

export const memoryArchiveService = {
  getDeletedMemoryIds(): string[] {
    const userDeleted = loadLocal<string[]>(STORAGE_KEYS.DELETED_MEMORY_IDS, []);
    return Array.from(new Set([...userDeleted, ...PERMANENTLY_EXCLUDED_MEMORY_IDS]));
  },

  getCachedMemories(): MemoryEntry[] {
    const user = authService.getCurrentUser();
    const deletedIds = new Set(this.getDeletedMemoryIds());
    const localAll = loadLocal<MemoryEntry[]>(STORAGE_KEYS.MEMORIES, []);
    const isAuthed = authService.isAuthenticated();
    return localAll
      .filter((m) => !deletedIds.has(m.id) && !isExcludedMemory(m))
      .filter((m) => (isAuthed ? m.contributorId === user.id || m.isShared : m.isShared));
  },

  async getMemories(): Promise<MemoryEntry[]> {
    const user = authService.getCurrentUser();
    const deletedIds = new Set(this.getDeletedMemoryIds());

    // Always load local cache first — this guarantees newly uploaded photos show immediately
    const localAll = loadLocal<MemoryEntry[]>(STORAGE_KEYS.MEMORIES, []);
    const isAuthed = authService.isAuthenticated();
    const localVisible = localAll
      .filter((m) => !deletedIds.has(m.id) && !isExcludedMemory(m))
      .filter((m) => (isAuthed ? m.contributorId === user.id || m.isShared : m.isShared));

    if (isLiveSupabaseConfigured && supabase) {
      syncLocalDraftsToCloud().catch((err) => console.warn('Background sync error:', err));
      const { data, error } = await supabase
        .from('garden_memories')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const cloudEntries: MemoryEntry[] = data
          .map((d: any) => {
            let videoUrl: string | undefined = d.video_url || undefined;
            let videoMediaId: string | undefined = undefined;
            let mediaType: 'photo' | 'video' = d.media_type || (videoUrl ? 'video' : 'photo');
            let description: string = d.description || '';

            let musicUrl: string | undefined = undefined;
            let musicTitle: string | undefined = undefined;
            let musicArtist: string | undefined = undefined;

            // Check if description is packed JSON containing video or soundtrack metadata
            if (
              description &&
              typeof description === 'string' &&
              description.startsWith('{') &&
              (description.includes('"videoUrl"') || description.includes('"musicUrl"'))
            ) {
              try {
                const parsed = JSON.parse(description);
                if (parsed.videoUrl) {
                  videoUrl = parsed.videoUrl;
                  mediaType = 'video';
                }
                if (parsed.videoMediaId) {
                  videoMediaId = parsed.videoMediaId;
                  mediaType = 'video';
                }
                if (parsed.mediaType) {
                  mediaType = parsed.mediaType;
                }
                if (parsed.musicUrl) {
                  musicUrl = parsed.musicUrl;
                }
                if (parsed.musicTitle) {
                  musicTitle = parsed.musicTitle;
                }
                if (parsed.musicArtist) {
                  musicArtist = parsed.musicArtist;
                }
                if (parsed.note !== undefined) {
                  description = parsed.note;
                }
              } catch {}
            }

            return {
              id: d.id,
              contributorId: d.contributor_id,
              contributorName: d.contributor_id === DEFAULT_PROFILES.noella.id ? 'Noella' : 'Solomon',
              title: d.title,
              caption: d.caption,
              description: description,
              photoUrl: d.photo_url,
              videoUrl: videoUrl,
              videoMediaId: videoMediaId,
              mediaType: mediaType,
              musicUrl: musicUrl,
              musicTitle: musicTitle,
              musicArtist: musicArtist,
              dateTaken: d.date_taken,
              isShared: d.is_shared,
              createdAt: d.created_at,
            };
          })
          .filter((d) => !deletedIds.has(d.id) && !isExcludedMemory(d));

        // Filter cloud entries by privacy (private memories only visible to contributor)
        const visibleCloudEntries = cloudEntries.filter((d) =>
          isAuthed ? d.contributorId === user.id || d.isShared : d.isShared
        );

        // Merge: preserve videoUrl & mediaType from local cache or IndexedDB
        const localMap = new Map<string, MemoryEntry>(localVisible.map((l) => [l.id, l]));
        const mergedCloudEntries = await Promise.all(visibleCloudEntries.map(async (c) => {
          const l = localMap.get(c.id);
          let videoUrl = c.videoUrl || l?.videoUrl;
          const videoMediaId = c.videoMediaId || l?.videoMediaId;
          const mediaType = c.mediaType || l?.mediaType || (videoMediaId || videoUrl ? 'video' : 'photo');

          // Always resolve fresh Blob URL from IndexedDB if videoMediaId is present
          if (videoMediaId) {
            try {
              const idbUrl = await mediaStorage.getMediaUrl(videoMediaId);
              if (idbUrl) videoUrl = idbUrl;
            } catch {}
          }

          // If videoUrl is a base64 data URL, convert to streaming Blob URL for full mobile/browser compatibility
          if (videoUrl && videoUrl.startsWith('data:video/')) {
            try {
              const blob = mediaStorage.dataUrlToBlob(videoUrl);
              videoUrl = URL.createObjectURL(blob);
            } catch (err) {
              console.warn('[Archive] Could not convert dataUrl to blob URL:', err);
            }
          }

          return {
            ...c,
            videoUrl,
            videoMediaId,
            mediaType,
            musicUrl: c.musicUrl || l?.musicUrl,
            musicTitle: c.musicTitle || l?.musicTitle,
            musicArtist: c.musicArtist || l?.musicArtist,
          };
        }));

        const cloudIds = new Set(mergedCloudEntries.map((e) => e.id));
        const resolvedLocalEntries = await Promise.all(
          localVisible
            .filter((m) => !cloudIds.has(m.id) && !m.id.startsWith('mem-') && !isExcludedMemory(m))
            .map(async (l) => {
              let videoUrl = l.videoUrl;
              if (l.videoMediaId) {
                try {
                  const idbUrl = await mediaStorage.getMediaUrl(l.videoMediaId);
                  if (idbUrl) videoUrl = idbUrl;
                } catch {}
              }
              if (videoUrl && videoUrl.startsWith('data:video/')) {
                try {
                  const blob = mediaStorage.dataUrlToBlob(videoUrl);
                  videoUrl = URL.createObjectURL(blob);
                } catch {}
              }
              return { ...l, videoUrl };
            })
        );

        const fullEntries = [...resolvedLocalEntries, ...mergedCloudEntries].filter((m) => !isExcludedMemory(m));
        // Cache to local storage so subsequent opens are instant with ZERO delay or placeholder flicker!
        saveLocal(STORAGE_KEYS.MEMORIES, fullEntries);
        return fullEntries;
      }
    }

    // Fallback: local only with resolved IndexedDB video URLs
    return Promise.all(
      localVisible
        .filter((l) => !isExcludedMemory(l))
        .map(async (l) => {
        let videoUrl = l.videoUrl;
        if (l.videoMediaId) {
          try {
            const idbUrl = await mediaStorage.getMediaUrl(l.videoMediaId);
            if (idbUrl) videoUrl = idbUrl;
          } catch {}
        }
        if (videoUrl && videoUrl.startsWith('data:video/')) {
          try {
            const blob = mediaStorage.dataUrlToBlob(videoUrl);
            videoUrl = URL.createObjectURL(blob);
          } catch {}
        }
        return { ...l, videoUrl };
      })
    );
  },

  async addMemory(memory: {
    title: string;
    caption?: string;
    description?: string;
    photoUrl: string;
    videoUrl?: string;
    videoMediaId?: string;
    mediaType?: 'photo' | 'video';
    voiceNoteUrl?: string;
    audioFileName?: string;
    musicUrl?: string;
    musicTitle?: string;
    musicArtist?: string;
    dateTaken?: string;
    isShared?: boolean;
  }): Promise<MemoryEntry> {
    const user = authService.getCurrentUser();
    const partner = authService.getPartner();

    // Check for recent duplicate submission within 12 seconds to prevent multi-posting
    const existingList = loadLocal<MemoryEntry[]>(STORAGE_KEYS.MEMORIES, []);
    const recentDuplicate = existingList.find((m) => {
      const isSameVideo = Boolean(memory.videoMediaId && m.videoMediaId === memory.videoMediaId);
      const isSameTitle = m.title.trim().toLowerCase() === memory.title.trim().toLowerCase() && m.contributorId === user.id;
      const isRecent = Math.abs(Date.now() - new Date(m.createdAt).getTime()) < 12000;
      return (isSameVideo || isSameTitle) && isRecent;
    });
    if (recentDuplicate) {
      console.warn('[Archive] Debounced duplicate memory submission within 12s');
      return recentDuplicate;
    }

    const entry: MemoryEntry = {
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      contributorId: user.id,
      contributorName: user.displayName,
      title: memory.title.trim(),
      caption: memory.caption?.trim(),
      description: memory.description?.trim(),
      photoUrl: memory.photoUrl.trim(),
      videoUrl: memory.videoUrl,
      videoMediaId: memory.videoMediaId,
      mediaType: memory.mediaType || (memory.videoUrl || memory.videoMediaId ? 'video' : 'photo'),
      voiceNoteUrl: memory.voiceNoteUrl,
      audioFileName: memory.audioFileName,
      musicUrl: memory.musicUrl,
      musicTitle: memory.musicTitle,
      musicArtist: memory.musicArtist,
      dateTaken: memory.dateTaken?.trim() || 'Keepsake Date',
      isShared: memory.isShared !== undefined ? memory.isShared : true,
      createdAt: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured && supabase) {
      try {
        let descriptionToSave = entry.description || entry.caption || '';
        if (
          entry.mediaType === 'video' ||
          entry.videoUrl ||
          entry.videoMediaId ||
          entry.musicUrl ||
          entry.musicTitle
        ) {
          // If videoUrl is a local blob: URL, do not sync the dead blob URL to cloud!
          // Only sync remote URLs or base64 data URLs to cloud
          const syncableVideoUrl =
            entry.videoUrl && !entry.videoUrl.startsWith('blob:')
              ? entry.videoUrl
              : undefined;

          descriptionToSave = JSON.stringify({
            note: entry.description || entry.caption || '',
            videoUrl: syncableVideoUrl,
            videoMediaId: entry.videoMediaId,
            mediaType: entry.mediaType,
            musicUrl: entry.musicUrl,
            musicTitle: entry.musicTitle,
            musicArtist: entry.musicArtist,
          });
        }

        const { error: insertError } = await supabase.from('garden_memories').insert({
          id: entry.id,
          contributor_id: user.id,
          title: entry.title,
          caption: entry.caption,
          description: descriptionToSave,
          photo_url: entry.photoUrl,
          date_taken: entry.dateTaken,
          is_shared: entry.isShared,
        });
        if (insertError) {
          console.warn('[Archive] Supabase insert failed, saving to localStorage only:', insertError.message);
        }
      } catch (err) {
        console.warn('[Archive] Supabase insert error:', err);
      }
    }

    // Always save to localStorage as a reliable local cache
    // Strip giant base64 dataUrls so localStorage never throws QuotaExceededError
    try {
      const all = loadLocal<MemoryEntry[]>(STORAGE_KEYS.MEMORIES, []);
      const storageEntry: MemoryEntry = {
        ...entry,
        videoUrl: entry.videoUrl && entry.videoUrl.length > 500000 ? undefined : entry.videoUrl,
      };
      // Prevent duplicates in localStorage by ID and videoMediaId
      const filtered = all.filter(
        (m) =>
          m.id !== entry.id &&
          (!entry.videoMediaId || m.videoMediaId !== entry.videoMediaId)
      );
      filtered.unshift(storageEntry);
      saveLocal(STORAGE_KEYS.MEMORIES, filtered);
    } catch (storageErr) {
      console.warn('[Archive] localStorage save failed (possibly full):', storageErr);
    }

    if (entry.isShared) {
      notificationService.sendNotification({
        type: 'memory',
        title: entry.mediaType === 'video' ? '🎬 New Video in Our Archive' : '📷 New Keepsake in Our Archive',
        message: `${user.displayName} saved a new ${entry.mediaType === 'video' ? 'video clip' : 'moment'}: "${entry.title}"`,
        targetTab: 'archive',
        senderId: user.id,
        senderName: user.displayName,
        recipientId: partner.id,
        isPrivate: false,
        entityId: entry.id,
      });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('garden-memories-updated'));
      window.dispatchEvent(new Event('garden-memory-added'));
    }

    return entry;
  },

  async deleteMemory(id: string, memoryFallback?: MemoryEntry): Promise<void> {
    const user = authService.getCurrentUser();
    // 1. Locate the item being deleted from local storage, fallback, or cloud
    const localActive = loadLocal<MemoryEntry[]>(STORAGE_KEYS.MEMORIES, []);
    let target = memoryFallback || localActive.find((m) => m.id === id);

    // If still not found, fetch from Supabase
    if (!target && isLiveSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('garden_memories').select('*').eq('id', id).maybeSingle();
        if (data) {
          target = {
            id: data.id,
            contributorId: data.contributor_id,
            contributorName: data.contributor_id === DEFAULT_PROFILES.noella.id ? 'Noella' : 'Solomon',
            title: data.title,
            caption: data.caption,
            description: data.description,
            photoUrl: data.photo_url,
            videoUrl: data.video_url,
            dateTaken: data.date_taken,
            isShared: data.is_shared,
            createdAt: data.created_at,
          };
        }
      } catch (err) {
        console.warn('[Archive] Could not fetch target memory before delete:', err);
      }
    }

    // Strict ownership: Neither partner can EVER delete a memory posted by the other!
    if (target && target.contributorId && target.contributorId !== user.id) {
      console.warn('[Archive] Unauthorized: You can only move memories you personally posted to the bin.');
      return;
    }

    // 2. Add ID to DELETED_MEMORY_IDS so it immediately disappears everywhere
    const deletedIds = loadLocal<string[]>(STORAGE_KEYS.DELETED_MEMORY_IDS, []);
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      saveLocal(STORAGE_KEYS.DELETED_MEMORY_IDS, deletedIds);
    }

    // 3. Move into Garden Recycle Bin with user attribution (Private on either side)
    const binItems = loadLocal<DeletedMemoryItem[]>(STORAGE_KEYS.DELETED_MEMORIES, []);
    const alreadyInBin = binItems.some((b) => b.id === id);
    if (!alreadyInBin) {
      const deletedEntry: DeletedMemoryItem = {
        id,
        originalMemory: target || {
          id,
          contributorId: user.id,
          contributorName: user.displayName,
          title: 'Treasured Keepsake ♡',
          caption: 'Memories kept in bloom',
          photoUrl: '/assets/memories/photo-holding-hands.jpg',
          isShared: true,
          createdAt: new Date().toISOString(),
        },
        deletedAt: new Date().toISOString(),
        deletedBy: user.id,
      };
      binItems.unshift(deletedEntry);
      saveLocal(STORAGE_KEYS.DELETED_MEMORIES, binItems);
    }

    // 4. Remove from active local array
    saveLocal(STORAGE_KEYS.MEMORIES, localActive.filter((m) => m.id !== id));

    // 5. Delete from cloud database if available
    if (isLiveSupabaseConfigured && supabase) {
      try {
        await supabase.from('garden_memories').delete().eq('id', id).eq('contributor_id', user.id);
      } catch (err) {
        console.warn('[Archive] Cloud delete failed:', err);
      }
    }

    // 6. Broadcast event so Archive, Scrapbook and More Tab Bin update instantly
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('garden-memories-updated'));
      window.dispatchEvent(new Event('garden-memory-deleted'));
      window.dispatchEvent(new Event('garden-bin-updated'));
    }
  },

  async updateMemory(id: string, updates: { title?: string; caption?: string; isShared?: boolean }): Promise<MemoryEntry> {
    const user = authService.getCurrentUser();
    const partner = authService.getPartner();
    const all = loadLocal<MemoryEntry[]>(STORAGE_KEYS.MEMORIES, []);
    const existingIndex = all.findIndex((m) => m.id === id);
    if (existingIndex < 0) throw new Error('Memory not found');
    const target = all[existingIndex];
    if (target.contributorId && target.contributorId !== user.id) {
      throw new Error('Unauthorized: You can only edit moments you personally contributed.');
    }

    const wasPrivate = !target.isShared;
    const updated: MemoryEntry = {
      ...target,
      title: updates.title !== undefined ? updates.title.trim() : target.title,
      caption: updates.caption !== undefined ? updates.caption.trim() : target.caption,
      isShared: updates.isShared !== undefined ? updates.isShared : target.isShared,
    };

    all[existingIndex] = updated;
    saveLocal(STORAGE_KEYS.MEMORIES, all);

    if (isLiveSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('garden_memories')
          .update({
            title: updated.title,
            caption: updated.caption,
            is_shared: updated.isShared,
          })
          .eq('id', id)
          .eq('contributor_id', user.id);
      } catch (err) {
        console.warn('[Archive] Cloud memory update error:', err);
      }
    }

    if (wasPrivate && updated.isShared) {
      notificationService.sendNotification({
        type: 'memory',
        title: updated.mediaType === 'video' ? '🎬 Moment Bloomed for Us' : '📷 Keepsake Bloomed for Us',
        message: `${user.displayName} shared a moment: "${updated.title}"`,
        targetTab: 'archive',
        senderId: user.id,
        senderName: user.displayName,
        recipientId: partner.id,
        isPrivate: false,
        entityId: updated.id,
      });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('garden-memories-updated'));
    }

    return updated;
  },

  async toggleMemoryPrivacy(id: string, isShared: boolean): Promise<MemoryEntry> {
    return this.updateMemory(id, { isShared });
  },

  async updateMemoryVoiceWhisper(id: string, voiceNoteUrl: string, audioFileName?: string): Promise<void> {
    const all = loadLocal<MemoryEntry[]>(STORAGE_KEYS.MEMORIES, []);
    const updated = all.map((m) => (m.id === id ? { ...m, voiceNoteUrl, audioFileName } : m));
    saveLocal(STORAGE_KEYS.MEMORIES, updated);

    if (isLiveSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('garden_memories')
          .update({
            voice_note_url: voiceNoteUrl,
          })
          .eq('id', id);
      } catch (err) {
        console.warn('[Archive] Cloud voice note update failed:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('garden-memories-updated'));
    }
  },

  // -------------------------------------------------------------
  // Private Garden Recycle Bin Methods (Private per user)
  // -------------------------------------------------------------
  getDeletedMemories(userId?: string): DeletedMemoryItem[] {
    const user = authService.getCurrentUser();
    const targetUserId = userId || user.id;
    const allDeleted = loadLocal<DeletedMemoryItem[]>(STORAGE_KEYS.DELETED_MEMORIES, []);
    const activeMemories = loadLocal<MemoryEntry[]>(STORAGE_KEYS.MEMORIES, []);

    // Heal any legacy bin items where photoUrl fell back to dreamy_night_garden
    let hasHealed = false;
    const healed = allDeleted.map((item) => {
      if (item.originalMemory && item.originalMemory.photoUrl === '/assets/dreamy_night_garden.jpg') {
        const found = activeMemories.find((m) => m.id === item.id);
        if (found && found.photoUrl && found.photoUrl !== '/assets/dreamy_night_garden.jpg') {
          hasHealed = true;
          return {
            ...item,
            originalMemory: {
              ...item.originalMemory,
              photoUrl: found.photoUrl,
              title: found.title || item.originalMemory.title,
              caption: found.caption || item.originalMemory.caption,
            },
          };
        }
      }
      return item;
    });

    if (hasHealed) {
      saveLocal(STORAGE_KEYS.DELETED_MEMORIES, healed);
    }

    // Completely private! Solomon only sees items deleted by Solomon; Noella sees items deleted by Noella.
    return healed.filter(
      (item) =>
        item.deletedBy === targetUserId ||
        (user.username && item.deletedBy === user.username) ||
        (targetUserId === 'user-solomon-uuid' && item.deletedBy === 'solomon') ||
        (targetUserId === 'user-noella-uuid' && (item.deletedBy === 'noella' || item.deletedBy === 'ella'))
    );
  },

  getDeletedCount(userId?: string): number {
    return this.getDeletedMemories(userId).length;
  },

  async restoreMemory(id: string): Promise<boolean> {
    const allDeleted = loadLocal<DeletedMemoryItem[]>(STORAGE_KEYS.DELETED_MEMORIES, []);
    const item = allDeleted.find((b) => b.id === id);
    if (!item) return false;

    // Remove from bin
    saveLocal(
      STORAGE_KEYS.DELETED_MEMORIES,
      allDeleted.filter((b) => b.id !== id)
    );

    // Remove from deleted IDs
    const deletedIds = loadLocal<string[]>(STORAGE_KEYS.DELETED_MEMORY_IDS, []);
    saveLocal(
      STORAGE_KEYS.DELETED_MEMORY_IDS,
      deletedIds.filter((did) => did !== id)
    );

    // Add back to active memories
    const active = loadLocal<MemoryEntry[]>(STORAGE_KEYS.MEMORIES, []);
    if (!active.some((m) => m.id === item.originalMemory.id)) {
      active.unshift(item.originalMemory);
      saveLocal(STORAGE_KEYS.MEMORIES, active);
    }

    // Cloud re-add if available
    if (isLiveSupabaseConfigured && supabase) {
      try {
        await supabase.from('garden_memories').upsert({
          id: item.originalMemory.id,
          contributor_id: item.originalMemory.contributorId,
          title: item.originalMemory.title,
          caption: item.originalMemory.caption,
          description: item.originalMemory.description,
          photo_url: item.originalMemory.photoUrl,
          date_taken: item.originalMemory.dateTaken,
          is_shared: item.originalMemory.isShared,
        });
      } catch (e) {
        console.warn('Cloud restore error', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('garden-memories-updated'));
      window.dispatchEvent(new Event('garden-memory-added'));
      window.dispatchEvent(new Event('garden-bin-updated'));
    }

    return true;
  },

  async permanentlyDelete(id: string): Promise<void> {
    const allDeleted = loadLocal<DeletedMemoryItem[]>(STORAGE_KEYS.DELETED_MEMORIES, []);
    saveLocal(
      STORAGE_KEYS.DELETED_MEMORIES,
      allDeleted.filter((b) => b.id !== id)
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('garden-bin-updated'));
    }
  },

  async emptyBin(userId: string): Promise<void> {
    const allDeleted = loadLocal<DeletedMemoryItem[]>(STORAGE_KEYS.DELETED_MEMORIES, []);
    // Keep other partner's deleted items untouched
    const kept = allDeleted.filter((b) => b.deletedBy !== userId);
    saveLocal(STORAGE_KEYS.DELETED_MEMORIES, kept);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('garden-bin-updated'));
    }
  },
};

// ==============================================================================
// Feature E: Petal Notes (Short Messages)
// ==============================================================================
export const petalNotesService = {
  getCachedPetals(): PetalNoteEntry[] {
    const user = authService.getCurrentUser();
    const local = loadLocal<PetalNoteEntry[]>(STORAGE_KEYS.PETALS, DEFAULT_INITIAL_PETALS);
    return local.filter((p) => {
      if (p.authorId === user.id) return true;
      return p.isShared && (!p.recipientId || p.recipientId === user.id);
    });
  },

  async getPetals(): Promise<PetalNoteEntry[]> {
    const user = authService.getCurrentUser();
    const local = loadLocal<PetalNoteEntry[]>(STORAGE_KEYS.PETALS, DEFAULT_INITIAL_PETALS);
    const localVisible = local.filter((p) => {
      // Author always sees their own petals; partner sees shared ones
      if (p.authorId === user.id) return true;
      return p.isShared && (!p.recipientId || p.recipientId === user.id);
    });

    if (isLiveSupabaseConfigured && supabase) {
      try {
        syncLocalDraftsToCloud().catch((err) => console.warn('Background sync error:', err));
        const { data, error } = await supabase
          .from('petal_notes')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const cloudEntries: PetalNoteEntry[] = data
            .map((d: any) => ({
              id: d.id,
              authorId: d.author_id,
              authorName: d.author_id === DEFAULT_PROFILES.noella.id ? 'Noella' : 'Solomon',
              recipientId: d.recipient_id,
              body: d.body,
              color: d.color,
              emoji: d.emoji,
              isShared: d.is_shared,
              createdAt: d.created_at,
            }))
            .filter((p) => {
              if (p.authorId === user.id) return true;
              return p.isShared && (!p.recipientId || p.recipientId === user.id);
            });

          const cloudIds = new Set(cloudEntries.map((c) => c.id));
          const localOnly = localVisible.filter((l) => !cloudIds.has(l.id));
          return [...cloudEntries, ...localOnly];
        }
      } catch (err) {
        console.warn('Background petal fetch error:', err);
      }
    }
    return localVisible;
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
      try {
        await supabase.from('petal_notes').insert({
          id: entry.id,
          author_id: user.id,
          recipient_id: partner.id,
          body: entry.body,
          color: entry.color,
          emoji: entry.emoji,
          is_shared: entry.isShared,
        });
      } catch (err) {
        console.warn('Supabase insert petal error:', err);
      }
    }

    const all = loadLocal<PetalNoteEntry[]>(STORAGE_KEYS.PETALS, DEFAULT_INITIAL_PETALS);
    all.unshift(entry);
    saveLocal(STORAGE_KEYS.PETALS, all);

    if (entry.isShared) {
      notificationService.sendNotification({
        type: 'petal',
        title: `${entry.emoji} New Petal Note`,
        message: `${user.displayName} left a petal: "${entry.body.slice(0, 50)}${entry.body.length > 50 ? '...' : ''}"`,
        targetTab: 'petals',
        senderId: user.id,
        senderName: user.displayName,
        recipientId: partner.id,
        isPrivate: false,
        entityId: entry.id,
      });
    }

    return entry;
  },

  async deletePetal(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (isLiveSupabaseConfigured && supabase) {
      try {
        await supabase.from('petal_notes').delete().eq('id', id).eq('author_id', user.id);
      } catch (err) {
        console.warn('Supabase delete petal error:', err);
      }
    }
    const all = loadLocal<PetalNoteEntry[]>(STORAGE_KEYS.PETALS, DEFAULT_INITIAL_PETALS);
    const target = all.find((p) => p.id === id);
    if (target && target.authorId !== user.id) {
      throw new Error('Unauthorized: You can only remove your own petal notes.');
    }
    saveLocal(STORAGE_KEYS.PETALS, all.filter((p) => p.id !== id));
  },

  async updatePetal(petal: { id: string; body: string; color: string; emoji: string; isShared: boolean }): Promise<PetalNoteEntry> {
    const user = authService.getCurrentUser();
    const partner = authService.getPartner();
    const all = loadLocal<PetalNoteEntry[]>(STORAGE_KEYS.PETALS, DEFAULT_INITIAL_PETALS);
    const existingIndex = all.findIndex((p) => p.id === petal.id);
    if (existingIndex < 0) throw new Error('Petal note not found');
    if (all[existingIndex].authorId !== user.id) {
      throw new Error('Unauthorized: You can only edit your own petal notes.');
    }

    const wasPrivate = !all[existingIndex].isShared;
    const updated: PetalNoteEntry = {
      ...all[existingIndex],
      body: petal.body.trim(),
      color: petal.color,
      emoji: petal.emoji,
      isShared: petal.isShared,
    };

    all[existingIndex] = updated;
    saveLocal(STORAGE_KEYS.PETALS, all);

    if (isLiveSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('petal_notes')
          .update({
            body: updated.body,
            color: updated.color,
            emoji: updated.emoji,
            is_shared: updated.isShared,
          })
          .eq('id', updated.id)
          .eq('author_id', user.id);
      } catch (err) {
        console.warn('Supabase update petal error:', err);
      }
    }

    if (wasPrivate && updated.isShared) {
      notificationService.sendNotification({
        type: 'petal',
        title: `${updated.emoji} Petal Bloomed for Us`,
        message: `${user.displayName} shared a petal: "${updated.body.slice(0, 50)}${updated.body.length > 50 ? '...' : ''}"`,
        targetTab: 'petals',
        senderId: user.id,
        senderName: user.displayName,
        recipientId: partner.id,
        isPrivate: false,
        entityId: updated.id,
      });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('garden-petals-updated'));
    }

    return updated;
  },

  async togglePetalPrivacy(id: string, isShared: boolean): Promise<PetalNoteEntry> {
    const all = loadLocal<PetalNoteEntry[]>(STORAGE_KEYS.PETALS, DEFAULT_INITIAL_PETALS);
    const existing = all.find((p) => p.id === id);
    if (!existing) throw new Error('Petal not found');
    return this.updatePetal({
      id: existing.id,
      body: existing.body,
      color: existing.color,
      emoji: existing.emoji,
      isShared,
    });
  },
};

// ==============================================================================
// Feature F: Our Time (Hangout & Activity Planning)
// ==============================================================================
export const hangoutService = {
  async getHangouts(): Promise<HangoutEntry[]> {
    const local = loadLocal<HangoutEntry[]>(STORAGE_KEYS.HANGOUTS, DEFAULT_INITIAL_HANGOUTS);
    if (isLiveSupabaseConfigured && supabase) {
      syncLocalDraftsToCloud().catch((err) => console.warn('Background sync error:', err));
      const { data, error } = await supabase
        .from('hangout_suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const cloudEntries: HangoutEntry[] = data.map((d: any) => ({
          id: d.id,
          suggestedBy: d.suggested_by,
          suggestedByName: d.suggested_by === DEFAULT_PROFILES.noella.id ? 'Noella' : 'Solomon',
          title: d.title,
          description: d.idea || d.description || '',
          proposedDate: d.date || d.proposed_date || '',
          location: d.location || '',
          reminderEnabled: true,
          status: d.status as HangoutStatus,
          createdAt: d.created_at,
        }));
        const cloudIds = new Set(cloudEntries.map((c) => c.id));
        const localOnly = local.filter((l) => !cloudIds.has(l.id));
        return [...cloudEntries, ...localOnly];
      }
    }
    return local;
  },

  async addHangout(plan: {
    title: string;
    description?: string;
    proposedDate?: string;
    location?: string;
    reminderEnabled?: boolean;
    reminderTime?: string;
  }): Promise<HangoutEntry> {
    const user = authService.getCurrentUser();
    const partner = authService.getPartner();
    const entry: HangoutEntry = {
      id: `hang-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      suggestedBy: user.id,
      suggestedByName: user.displayName,
      title: plan.title.trim(),
      description: plan.description?.trim(),
      proposedDate: plan.proposedDate?.trim(),
      location: plan.location?.trim(),
      reminderEnabled: plan.reminderEnabled ?? true,
      reminderTime: plan.reminderTime,
      status: 'proposed',
      createdAt: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured && supabase) {
      const { error: insertErr } = await supabase.from('hangout_suggestions').insert({
        id: entry.id,
        suggested_by: user.id,
        title: entry.title,
        idea: entry.description || entry.title || 'Hangout plan',
        location: entry.location || null,
        date: entry.proposedDate || null,
        status: entry.status,
        is_shared: true,
      });
      if (insertErr) {
        console.error('Failed to save date suggestion to Supabase:', insertErr);
      }
    }

    const all = loadLocal<HangoutEntry[]>(STORAGE_KEYS.HANGOUTS, []);
    all.unshift(entry);
    saveLocal(STORAGE_KEYS.HANGOUTS, all);

    notificationService.sendNotification({
      type: 'date',
      title: '📅 New Date Proposal',
      message: `${user.displayName} suggested: "${entry.title}"${entry.proposedDate ? ` for ${entry.proposedDate}` : ''}`,
      targetTab: 'time',
      senderId: user.id,
      senderName: user.displayName,
      recipientId: partner.id,
      isPrivate: false,
      entityId: entry.id,
    });

    return entry;
  },

  async updateHangoutStatus(id: string, status: HangoutStatus): Promise<void> {
    const user = authService.getCurrentUser();
    const partner = authService.getPartner();
    if (isLiveSupabaseConfigured && supabase) {
      await supabase.from('hangout_suggestions').update({ status }).eq('id', id);
    }
    const all = loadLocal<HangoutEntry[]>(STORAGE_KEYS.HANGOUTS, []);
    const plan = all.find((h) => h.id === id);
    saveLocal(STORAGE_KEYS.HANGOUTS, all.map((h) => (h.id === id ? { ...h, status } : h)));

    if (plan && status === 'confirmed') {
      notificationService.sendNotification({
        type: 'date',
        title: '✨ Date Confirmed!',
        message: `${user.displayName} confirmed your date: "${plan.title}"! 💖`,
        targetTab: 'time',
        senderId: user.id,
        senderName: user.displayName,
        recipientId: partner.id,
        isPrivate: false,
        entityId: `confirmed-${plan.id}`,
      });
    }
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
    const isAuthed = authService.isAuthenticated();

    if (isLiveSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('question_responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data
          .map((d: any) => ({
            id: d.id,
            questionId: d.question_id,
            userId: d.user_id,
            userName: d.user_id === DEFAULT_PROFILES.noella.id ? 'Noella' : 'Solomon',
            answer: d.response || d.answer || '',
            isShared: d.is_shared,
            createdAt: d.created_at,
          }))
          .filter((r: QuestionResponseEntry) => (isAuthed ? r.userId === user.id || r.isShared : r.isShared));
      }
    }
    const all = loadLocal<QuestionResponseEntry[]>(STORAGE_KEYS.QUESTIONS, []);
    return all.filter((r) => (isAuthed ? r.userId === user.id || r.isShared : r.isShared));
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
        id: entry.id,
        question_id: questionId,
        user_id: user.id,
        response: entry.answer,
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
    const isAuthed = authService.isAuthenticated();

    if (isLiveSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('time_capsules')
        .select('*')
        .order('release_at', { ascending: true });

      if (!error && data) {
        if (!isAuthed) return [];
        return data
          .map((d: any) => ({
            id: d.id,
            authorId: d.author_id,
            authorName: d.author_id === DEFAULT_PROFILES.noella.id ? 'Noella' : 'Solomon',
            recipientId: d.recipient_id,
            title: d.title,
            body: d.message || d.body || '',
            releaseAt: d.unlock_date || d.release_at || d.created_at,
            isShared: d.is_shared,
            createdAt: d.created_at,
          }))
          .filter((c: TimeCapsuleEntry) => {
            if (c.authorId === user.id) return true;
            if (c.isShared && (!c.recipientId || c.recipientId === user.id)) return true;
            return false;
          })
          .map((c: TimeCapsuleEntry) => {
            const isLocked = new Date(c.releaseAt) > now;
            if (c.authorId !== user.id && isLocked) {
              return {
                ...c,
                body: '[LOCKED UNTIL RELEASE DATE]',
              };
            }
            return c;
          });
      }
    }

    // Local simulated RLS rule:
    // 1. Author sees all their capsules (including previewing the message).
    // 2. Intended recipient sees capsule ONLY IF isShared is true.
    // 3. If releaseAt > now and viewer is NOT the author, the body is completely locked/redacted!
    if (!isAuthed) return [];
    const all = loadLocal<TimeCapsuleEntry[]>(STORAGE_KEYS.CAPSULES, DEFAULT_INITIAL_CAPSULES);
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
        id: entry.id,
        author_id: user.id,
        recipient_id: partner.id,
        title: entry.title,
        message: entry.body,
        unlock_date: entry.releaseAt,
        is_shared: entry.isShared,
      });
    }

    const all = loadLocal<TimeCapsuleEntry[]>(STORAGE_KEYS.CAPSULES, []);
    all.unshift(entry);
    saveLocal(STORAGE_KEYS.CAPSULES, all);

    if (entry.isShared) {
      notificationService.sendNotification({
        type: 'letter',
        title: '⌛ A Time Capsule was Buried',
        message: `${user.displayName} sealed a Time Capsule to open on ${new Date(entry.releaseAt).toLocaleDateString()}`,
        targetTab: 'capsule',
        senderId: user.id,
        senderName: user.displayName,
        recipientId: partner.id,
        isPrivate: false,
        entityId: entry.id,
      });
    }

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
  { key: 'happy', label: 'Happy', emoji: '😊' },
  { key: 'in_love', label: 'In Love', emoji: '😍' },
  { key: 'calm', label: 'Calm', emoji: '😌' },
  { key: 'sad', label: 'Sad', emoji: '🥺' },
  { key: 'thoughtful', label: 'Thoughtful', emoji: '🤔' },
  { key: 'excited', label: 'Excited', emoji: '🤩' },
  { key: 'peaceful', label: 'Peaceful', emoji: '🌿' },
  { key: 'tired', label: 'Tired', emoji: '🌙' },
  { key: 'listening', label: 'Looking for Music', emoji: '🎧' },
];

export const moodGardenService = {
  async getMoods(): Promise<MoodEntry[]> {
    const user = authService.getCurrentUser();
    const isAuthed = authService.isAuthenticated();

    if (isLiveSupabaseConfigured && supabase) {
      syncLocalDraftsToCloud().catch((err) => console.warn('Background sync error:', err));
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data
          .filter((d: any) => (isAuthed ? d.user_id === user.id || d.is_shared : d.is_shared))
          .map((d: any) => {
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
    return all.filter((m) => (isAuthed ? m.userId === user.id || m.isShared : m.isShared));
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
        id: entry.id,
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

    if (entry.isShared) {
      notificationService.sendNotification({
        type: 'mood',
        title: '🌙 Mood Shared in the Garden',
        message: `${user.displayName} is feeling ${entry.emoji} ${entry.moodLabel}${entry.note ? `: "${entry.note}"` : ''}`,
        targetTab: 'moods',
        senderId: user.id,
        senderName: user.displayName,
        recipientId: authService.getPartner().id,
        isPrivate: false,
        entityId: entry.id,
      });
    }

    return entry;
  },
};

// The World Around Us service
type WorldListener = () => void;
const worldListeners = new Set<WorldListener>();
const notifyWorldSubscribers = () => {
  worldListeners.forEach((l) => {
    try {
      l();
    } catch (e) {
      console.error(e);
    }
  });
};

export const worldAroundUsService = {
  subscribe(listener: WorldListener): () => void {
    worldListeners.add(listener);
    return () => worldListeners.delete(listener);
  },

  async getCauses(): Promise<WorldCause[]> {
    return loadLocal<WorldCause[]>(STORAGE_KEYS.WORLD_CAUSES, DEFAULT_INITIAL_WORLD_CAUSES);
  },

  async addCause(data: {
    title: string;
    category: string;
    description: string;
    whyItMatters: string;
    resourceLink?: string;
    resourceName?: string;
  }): Promise<WorldCause> {
    const user = authService.getCurrentUser();
    const entry: WorldCause = {
      id: `cause-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: data.title.trim(),
      category: data.category.trim() || 'General Awareness',
      description: data.description.trim(),
      whyItMatters: data.whyItMatters.trim(),
      resourceLink: data.resourceLink?.trim() || undefined,
      resourceName: data.resourceName?.trim() || undefined,
      addedBy: user.id,
      addedByName: user.displayName,
      createdAt: new Date().toISOString(),
    };

    const all = loadLocal<WorldCause[]>(STORAGE_KEYS.WORLD_CAUSES, DEFAULT_INITIAL_WORLD_CAUSES);
    all.unshift(entry);
    saveLocal(STORAGE_KEYS.WORLD_CAUSES, all);
    notifyWorldSubscribers();
    return entry;
  },

  async deleteCause(id: string): Promise<boolean> {
    const all = loadLocal<WorldCause[]>(STORAGE_KEYS.WORLD_CAUSES, DEFAULT_INITIAL_WORLD_CAUSES);
    const filtered = all.filter((c) => c.id !== id);
    saveLocal(STORAGE_KEYS.WORLD_CAUSES, filtered);
    notifyWorldSubscribers();
    return true;
  },

  async getArticles(): Promise<WorldArticle[]> {
    return loadLocal<WorldArticle[]>(STORAGE_KEYS.WORLD_ARTICLES, DEFAULT_INITIAL_WORLD_ARTICLES);
  },

  async addArticle(data: {
    title: string;
    source: string;
    link: string;
    type: 'article' | 'video' | 'post' | 'book';
    whyItMatters: string;
    isShared?: boolean;
  }): Promise<WorldArticle> {
    const user = authService.getCurrentUser();
    const entry: WorldArticle = {
      id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: data.title.trim(),
      source: data.source.trim() || 'Curated Resource',
      link: data.link.trim(),
      type: data.type,
      whyItMatters: data.whyItMatters.trim(),
      addedBy: user.id,
      addedByName: user.displayName,
      createdAt: new Date().toISOString(),
      isShared: data.isShared !== undefined ? data.isShared : true,
    };

    const all = loadLocal<WorldArticle[]>(STORAGE_KEYS.WORLD_ARTICLES, DEFAULT_INITIAL_WORLD_ARTICLES);
    all.unshift(entry);
    saveLocal(STORAGE_KEYS.WORLD_ARTICLES, all);
    notifyWorldSubscribers();
    return entry;
  },

  async deleteArticle(id: string): Promise<boolean> {
    const all = loadLocal<WorldArticle[]>(STORAGE_KEYS.WORLD_ARTICLES, DEFAULT_INITIAL_WORLD_ARTICLES);
    const filtered = all.filter((a) => a.id !== id);
    saveLocal(STORAGE_KEYS.WORLD_ARTICLES, filtered);
    notifyWorldSubscribers();
    return true;
  },

  async getPrompts(): Promise<WorldPrompt[]> {
    return loadLocal<WorldPrompt[]>(STORAGE_KEYS.WORLD_PROMPTS, DEFAULT_INITIAL_WORLD_PROMPTS);
  },

  async addPromptReflection(promptId: string, reflection: string): Promise<WorldPromptResponse> {
    const user = authService.getCurrentUser();
    const response: WorldPromptResponse = {
      id: `resp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorId: user.id,
      authorName: user.displayName,
      reflection: reflection.trim(),
      createdAt: new Date().toISOString(),
    };

    const all = loadLocal<WorldPrompt[]>(STORAGE_KEYS.WORLD_PROMPTS, DEFAULT_INITIAL_WORLD_PROMPTS);
    const prompt = all.find((p) => p.id === promptId);
    if (prompt) {
      if (!prompt.responses) prompt.responses = [];
      prompt.responses.push(response);
      saveLocal(STORAGE_KEYS.WORLD_PROMPTS, all);
      notifyWorldSubscribers();
    }
    return response;
  },

  async addCustomPrompt(promptText: string, category: string, contextNote?: string): Promise<WorldPrompt> {
    const entry: WorldPrompt = {
      id: `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      promptText: promptText.trim(),
      category: category.trim() || 'Reflection',
      contextNote: contextNote?.trim() || undefined,
      responses: [],
    };

    const all = loadLocal<WorldPrompt[]>(STORAGE_KEYS.WORLD_PROMPTS, DEFAULT_INITIAL_WORLD_PROMPTS);
    all.push(entry);
    saveLocal(STORAGE_KEYS.WORLD_PROMPTS, all);
    notifyWorldSubscribers();
    return entry;
  },

  async getSmallActions(): Promise<WorldSmallAction[]> {
    return loadLocal<WorldSmallAction[]>(STORAGE_KEYS.WORLD_ACTIONS, DEFAULT_INITIAL_WORLD_ACTIONS);
  },

  async toggleHeartAction(actionId: string): Promise<number> {
    const all = loadLocal<WorldSmallAction[]>(STORAGE_KEYS.WORLD_ACTIONS, DEFAULT_INITIAL_WORLD_ACTIONS);
    const item = all.find((a) => a.id === actionId);
    if (item) {
      if (item.hasHeartedByMe) {
        item.hasHeartedByMe = false;
        item.heartsCount = Math.max(0, item.heartsCount - 1);
      } else {
        item.hasHeartedByMe = true;
        item.heartsCount = (item.heartsCount || 0) + 1;
      }
      saveLocal(STORAGE_KEYS.WORLD_ACTIONS, all);
      notifyWorldSubscribers();
      return item.heartsCount;
    }
    return 0;
  },

  async addSmallAction(
    title: string,
    description: string,
    category: WorldSmallAction['category']
  ): Promise<WorldSmallAction> {
    const user = authService.getCurrentUser();
    const entry: WorldSmallAction = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      description: description.trim(),
      category,
      suggestedBy: user.id,
      suggestedByName: user.displayName,
      heartsCount: 1,
      hasHeartedByMe: true,
      createdAt: new Date().toISOString(),
    };

    const all = loadLocal<WorldSmallAction[]>(STORAGE_KEYS.WORLD_ACTIONS, DEFAULT_INITIAL_WORLD_ACTIONS);
    all.unshift(entry);
    saveLocal(STORAGE_KEYS.WORLD_ACTIONS, all);
    notifyWorldSubscribers();
    return entry;
  },
};
