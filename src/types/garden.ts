export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  created_at?: string;
}

export interface NoteEntry {
  id: string;
  authorId: string;
  authorName?: string;
  recipientId?: string;
  title: string;
  body: string;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SongStatus = 'want_to_listen' | 'listened' | 'recommend_back';

export interface SongEntry {
  id: string;
  addedBy: string;
  addedByName?: string;
  title: string;
  artist: string;
  musicUrl: string;
  message?: string;
  status: SongStatus;
  createdAt: string;
}

export type ShelfCategory = 'music' | 'films' | 'books' | 'food' | 'places' | 'activities';
export type ShelfStatus = 'to_explore' | 'in_progress' | 'loved' | 'done';

export interface ShelfEntry {
  id: string;
  contributorId: string;
  contributorName?: string;
  title: string;
  category: ShelfCategory;
  description?: string;
  link?: string;
  status: ShelfStatus;
  createdAt: string;
}

export interface MemoryEntry {
  id: string;
  contributorId: string;
  contributorName?: string;
  title: string;
  caption?: string;
  description?: string;
  photoUrl: string;
  dateTaken?: string;
  isShared: boolean;
  createdAt: string;
}

export interface PetalNoteEntry {
  id: string;
  authorId: string;
  authorName?: string;
  recipientId?: string;
  body: string;
  color: string;
  emoji: string;
  isShared: boolean;
  createdAt: string;
}

export type HangoutStatus = 'proposed' | 'interested' | 'confirmed' | 'completed' | 'declined';

export interface HangoutEntry {
  id: string;
  suggestedBy: string;
  suggestedByName?: string;
  title: string;
  description?: string;
  proposedDate?: string;
  status: HangoutStatus;
  createdAt: string;
}

export interface QuestionPrompt {
  id: string;
  question: string;
  category: string;
  hint?: string;
}

export interface QuestionResponseEntry {
  id: string;
  questionId: string;
  userId: string;
  userName?: string;
  answer: string;
  isShared: boolean;
  createdAt: string;
}

export interface TimeCapsuleEntry {
  id: string;
  authorId: string;
  authorName?: string;
  recipientId?: string;
  title: string;
  body: string;
  releaseAt: string; // ISO date string
  isShared: boolean;
  createdAt: string;
}

export interface MoodEntry {
  id: string;
  userId: string;
  userName?: string;
  moodKey: string;
  moodLabel: string;
  emoji: string;
  note?: string;
  isShared: boolean;
  createdAt: string;
}
