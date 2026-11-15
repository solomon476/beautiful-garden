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
  musicUrl?: string; // Optional external streaming link
  audioUrl?: string; // Uploaded audio file or voice note data URL
  audioFileName?: string;
  isVoiceNote?: boolean;
  voiceNoteDuration?: number;
  message?: string;
  status: SongStatus;
  createdAt: string;
  coverUrl?: string;
  reaction?: string;
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
  pdfUrl?: string; // Uploaded book PDF
  pdfFileName?: string;
  pdfFileSize?: number;
  photoUrl?: string; // Uploaded picture of book, dish, place
  voiceNoteUrl?: string;
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
  videoUrl?: string;
  videoMediaId?: string;
  mediaType?: 'photo' | 'video';
  voiceNoteUrl?: string;
  audioFileName?: string;
  musicUrl?: string;
  musicTitle?: string;
  musicArtist?: string;
  dateTaken?: string;
  isShared: boolean;
  createdAt: string;
}

export interface DeletedMemoryItem {
  id: string;
  originalMemory: MemoryEntry;
  deletedAt: string;
  deletedBy: string; // userId of person who moved it to bin
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
  location?: string;
  reminderEnabled?: boolean;
  reminderTime?: string;
  status: HangoutStatus;
  createdAt: string;
}

export interface GardenNotification {
  id: string;
  type: 'letter' | 'petal' | 'song' | 'shelf' | 'memory' | 'date' | 'mood' | 'question';
  title: string;
  message: string;
  targetTab: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  isRead: boolean;
  createdAt: string;
  isPrivate?: boolean;
  entityId?: string;
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

export interface WorldCause {
  id: string;
  title: string;
  category: string;
  description: string;
  whyItMatters: string;
  resourceLink?: string;
  resourceName?: string;
  addedBy: string;
  addedByName?: string;
  createdAt: string;
}

export interface WorldArticle {
  id: string;
  title: string;
  source: string;
  link: string;
  type: 'article' | 'video' | 'post' | 'book';
  whyItMatters: string;
  addedBy: string;
  addedByName?: string;
  createdAt: string;
  isShared: boolean;
}

export interface WorldPromptResponse {
  id: string;
  authorId: string;
  authorName: string;
  reflection: string;
  createdAt: string;
}

export interface WorldPrompt {
  id: string;
  promptText: string;
  category: string;
  contextNote?: string;
  responses: WorldPromptResponse[];
}

export interface WorldSmallAction {
  id: string;
  title: string;
  description: string;
  category: 'listening' | 'care' | 'learning' | 'perspective';
  suggestedBy: string;
  suggestedByName?: string;
  heartsCount: number;
  hasHeartedByMe?: boolean;
  createdAt: string;
}
